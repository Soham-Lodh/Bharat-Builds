import { v2 as cloudinary } from "cloudinary";
import medicalChatHistoryModel from "../models/medicalChatHistorySchema.js";
import emergencyDetectionModel from "../models/emergencyDetectionSchema.js";
import { appendMessage, getOrCreateSession, summarizeSession, updateSessionContext } from "../services/conversationManager.js";
import { detectEmergency, buildEmergencyResponse } from "../services/emergencyDetector.js";
import { classifyMedicalIntent } from "../services/medicalIntentClassifier.js";
import { generateClarifyingQuestions } from "../services/clarifyingQuestionGenerator.js";
import { retrieveMedicalEvidence } from "../services/ragRetriever.js";
import { parseMedicalImage } from "../services/medicalImageParser.js";
import { detectUncertainty } from "../services/uncertaintyDetector.js";
import { explainReport } from "../services/reportExplainer.js";
import { formatRefusal, formatStructuredAnswer } from "../services/responseFormatter.js";
import { generateDoctorVisitPrep } from "../services/doctorVisitPrep.js";
import grokClient from "../services/grokClient.js";
import { parseJsonObject, unique } from "../services/jsonUtils.js";
import { resolveSpeciality } from "../services/specialityResolver.js";
import doctorModel from "../models/doctorModel.js";

const uploadToCloudinary = async (file) => {
  if (!file) return "";
  const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64, {
    folder: "prescripto/medical-copilot",
    resource_type: "image",
  });
  return result.secure_url;
};

const extractSymptoms = (message = "", emergencySymptoms = []) => {
  const symptomWords = [
    "cough", "fever", "headache", "stomach pain", "abdominal pain", "rash", "itching",
    "chest pain", "breathing", "vomiting", "diarrhea", "fatigue", "dizziness", "knee pain",
  ];
  return unique([
    ...emergencySymptoms,
    ...symptomWords.filter((symptom) => message.toLowerCase().includes(symptom)),
  ]);
};

const generateMedicalAnswer = async ({ message, session, sources, imageAnalysis, reportExplanation }) => {
  if (!grokClient.isConfigured()) {
    return {
      answer: sources.length
        ? `Based on the available educational sources, ${sources[0].excerpt}`
        : "I do not have enough reliable sourced information to answer this safely.",
      confidence: sources.length ? 0.72 : 0.45,
      evidenceGrade: sources.length ? "MEDIUM_CONFIDENCE" : "LOW_CONFIDENCE",
      possibleExplanations: sources.map((source) => ({
        label: source.condition,
        note: source.excerpt,
      })),
    };
  }

  const context = JSON.stringify({
    conversation: (session.conversationThread || []).slice(-8),
    extractedSymptoms: session.extractedSymptoms || [],
    imageAnalysis,
    reportExplanation,
  });

  const sourceContext = sources
    .map((source) => `Source ${source.id}: ${source.title}\n${source.excerpt}\nWhen to seek care: ${source.whenToSeekCare}\nURL: ${source.url}`)
    .join("\n\n");

  try {
    const content = await grokClient.chat(
      [{ role: "user", content: message }],
      `You are a medical information assistant. Use ONLY the supplied sources and conversation context.
Do not diagnose, prescribe, or calculate dosing. If the sources do not support the answer, say you do not have reliable information.
Output ONLY valid JSON:
{"answer":"...","confidence":0.0,"evidenceGrade":"HIGH_CONFIDENCE|MEDIUM_CONFIDENCE|LOW_CONFIDENCE","possibleExplanations":[{"label":"...","note":"..."}],"monitor":["..."],"urgentCare":"...","doctorQuestions":["..."]}
Conversation context: ${context}
Knowledge base sources:
${sourceContext || "No reliable sources retrieved."}`,
      0.3,
      1800
    );
    return {
      answer: "I do not have reliable information about this from the available sources.",
      confidence: 0.4,
      evidenceGrade: "LOW_CONFIDENCE",
      ...parseJsonObject(content),
    };
  } catch {
    return {
      answer: sources.length
        ? `Based on the retrieved educational source: ${sources[0].excerpt}`
        : "I could not generate a sourced answer right now.",
      confidence: sources.length ? 0.65 : 0.4,
      evidenceGrade: sources.length ? "MEDIUM_CONFIDENCE" : "LOW_CONFIDENCE",
    };
  }
};

export const medicalChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const message = String(req.body.message || "").trim();
    const sessionId = req.body.sessionId || null;
    const debug = req.body.debug === "true" || req.body.debug === true;

    if (!message && !req.file) {
      return res.status(400).json({ success: false, message: "Please enter a message or upload a medical image." });
    }

    const session = await getOrCreateSession(userId, sessionId);
    let imageUrl = "";
    let imageAnalysis = null;

    if (req.file) {
      [imageUrl, imageAnalysis] = await Promise.all([
        uploadToCloudinary(req.file),
        parseMedicalImage(req.file),
      ]);
    }

    const emergency = await detectEmergency(message, `${imageAnalysis?.analysis || ""} ${imageAnalysis?.rawText || ""}`);
    const intent = await classifyMedicalIntent(message || imageAnalysis?.analysis || "", emergency);

    await appendMessage(session, {
      role: "user",
      content: { message, imageUrl, imageAnalysis },
      intent: intent.intent,
      type: imageAnalysis ? "IMAGE_MESSAGE" : "TEXT_MESSAGE",
    });

    if (emergency.isEmergency) {
      await emergencyDetectionModel.create({
        userId,
        sessionId: session.sessionId,
        symptoms: emergency.symptoms,
        riskLevel: emergency.riskLevel,
        suggestedAction: emergency.suggestedAction,
        handled: true,
      });

      const emergencyResponse = buildEmergencyResponse(emergency);
      await appendMessage(session, { role: "assistant", content: emergencyResponse, type: "EMERGENCY" });
      await medicalChatHistoryModel.create({
        userId,
        sessionId: session.sessionId,
        message,
        imageUrl,
        documentType: imageAnalysis?.imageType || "",
        intent,
        response: emergencyResponse,
        emergencyDetected: emergency,
        sources: [],
      });

      return res.json({
        success: true,
        data: {
          response: emergencyResponse,
          sessionId: session.sessionId,
          updatedContext: summarizeSession(session),
          nextAction: "EMERGENCY_ESCALATION",
          debug: debug ? { intent, emergency } : undefined,
        },
        message: "Emergency pathway triggered",
      });
    }

    if (intent.intent === "NON_MEDICAL" && !imageAnalysis) {
      const response = {
        mode: "NON_MEDICAL",
        title: "Medical questions only",
        answer: "I can help with educational medical questions, prescriptions, reports, symptoms, and doctor visit preparation.",
        safetyDisclaimer: "For medical emergencies, call local emergency services.",
      };
      await appendMessage(session, { role: "assistant", content: response, type: "NON_MEDICAL" });
      await medicalChatHistoryModel.create({ userId, sessionId: session.sessionId, message, intent, response, emergencyDetected: emergency });
      return res.json({ success: true, data: { response, sessionId: session.sessionId, updatedContext: summarizeSession(session), nextAction: "ASK_MEDICAL_QUERY", debug: debug ? { intent, emergency } : undefined }, message: "Message handled" });
    }

    const clarifying = !imageAnalysis ? generateClarifyingQuestions(message, session) : null;
    if (clarifying) {
      const response = {
        mode: "CLARIFYING_QUESTIONS",
        title: "A few quick questions",
        ...clarifying,
        safetyDisclaimer: "Answer what you can. If symptoms are severe or worsening, seek urgent medical care.",
      };
      await updateSessionContext(session, { symptoms: [clarifying.symptom] });
      await appendMessage(session, { role: "assistant", content: response, type: "CLARIFYING_QUESTIONS" });
      await medicalChatHistoryModel.create({ userId, sessionId: session.sessionId, message, imageUrl, intent, response, emergencyDetected: emergency });
      return res.json({ success: true, data: { response, sessionId: session.sessionId, updatedContext: summarizeSession(session), nextAction: "COLLECT_CLARIFICATION", debug: debug ? { intent, emergency } : undefined }, message: "Clarifying questions generated" });
    }

    const queryForEvidence = `${message} ${(session.extractedSymptoms || []).join(" ")} ${imageAnalysis?.analysis || ""}`;
    const sources = await retrieveMedicalEvidence(queryForEvidence);
    const reportExplanation = imageAnalysis?.imageType === "LAB_REPORT" ? explainReport(imageAnalysis) : null;
    const answer = await generateMedicalAnswer({ message: message || imageAnalysis?.analysis || "Uploaded medical image", session, sources, imageAnalysis, reportExplanation });
    const refusal = detectUncertainty({ message, confidence: answer.confidence, imageType: imageAnalysis?.imageType });
    const symptoms = extractSymptoms(message, emergency.symptoms);
    const availableSpecialities = await doctorModel.distinct("speciality", { available: true });
    const identifiedConditions = [
      ...(answer.possibleExplanations || []).map((item) => item.label),
      ...sources.map((source) => source.condition),
    ].filter(Boolean);
    const doctorRecommendation = resolveSpeciality({
      message,
      identifiedConditions,
      imageAnalysis,
      symptoms,
      sources,
      availableSpecialities,
    });
    const visitPrep = generateDoctorVisitPrep(message, symptoms, doctorRecommendation);

    const response = refusal.shouldRefuse
      ? formatRefusal(refusal)
      : formatStructuredAnswer({ message, answer, sources, imageAnalysis, reportExplanation, visitPrep });

    response.doctorRecommendation = doctorRecommendation;

    if (!refusal.shouldRefuse && imageAnalysis?.imageType && !response.documentType) {
      response.documentType = imageAnalysis.imageType;
    }

    await updateSessionContext(session, {
      symptoms,
      medicalContext: {
        lastIntent: intent.intent,
        lastDocumentType: imageAnalysis?.imageType || null,
        lastEvidenceGrade: response.evidenceGrade || null,
      },
    });
    await appendMessage(session, { role: "assistant", content: response, type: response.mode === "REFUSAL" ? "REFUSAL" : "STRUCTURED_ANSWER" });
    await medicalChatHistoryModel.create({
      userId,
      sessionId: session.sessionId,
      message,
      imageUrl,
      documentType: imageAnalysis?.imageType || "",
      intent,
      response,
      emergencyDetected: emergency,
      sources,
      refusal: refusal.shouldRefuse ? refusal : null,
    });

    return res.json({
      success: true,
      data: {
        response,
        sessionId: session.sessionId,
        updatedContext: summarizeSession(session),
        nextAction: refusal.shouldRefuse ? "REFER_TO_CLINICIAN" : "ANSWER_READY",
        debug: debug ? { intent, emergency, sources } : undefined,
      },
      message: "Medical copilot response generated",
    });
  } catch (error) {
    console.error("Medical copilot error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const medicalChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const history = await medicalChatHistoryModel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ success: true, history, message: "Medical chat history fetched" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
