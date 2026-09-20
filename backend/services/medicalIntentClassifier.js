import grokClient from "./grokClient.js";
import { parseJsonObject } from "./jsonUtils.js";

const medicalWords = [
  "pain", "fever", "cough", "rash", "medicine", "tablet", "dose", "blood", "vomit",
  "headache", "stomach", "pregnant", "lab", "report", "prescription", "symptom",
  "doctor", "infection", "allergy", "bp", "diabetes", "heart", "breathing",
];

export const classifyMedicalIntent = async (message = "", emergency = null) => {
  const text = message.toLowerCase();
  if (emergency?.isEmergency) {
    return {
      intent: emergency.riskLevel === "CRITICAL" ? "URGENT_ESCALATION" : "EMERGENCY_SIGNAL",
      confidence: 0.98,
      category: "safety",
      shouldEscalate: true,
      reasoning: "Emergency keywords or patterns were detected.",
    };
  }

  const score = medicalWords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
  if (score > 0 || !grokClient.isConfigured()) {
    const isMedical = score > 0;
    return {
      intent: isMedical ? "MEDICAL_QUERY" : "NON_MEDICAL",
      confidence: isMedical ? Math.min(0.95, 0.55 + score * 0.12) : 0.8,
      category: isMedical ? "medical" : "off_topic",
      shouldEscalate: false,
      reasoning: isMedical ? "Medical terms were detected." : "No medical terms were detected.",
    };
  }

  try {
    const content = await grokClient.chat(
      [{ role: "user", content: message }],
      `You are a medical intent classifier. Output ONLY valid JSON:
{"intent":"MEDICAL_QUERY|EMERGENCY_SIGNAL|NON_MEDICAL|URGENT_ESCALATION","confidence":0.0,"category":"medical|safety|off_topic","shouldEscalate":false,"reasoning":"brief"}`,
      0,
      400
    );
    return {
      intent: "NON_MEDICAL",
      confidence: 0.6,
      category: "off_topic",
      shouldEscalate: false,
      ...parseJsonObject(content),
    };
  } catch {
    return { intent: "NON_MEDICAL", confidence: 0.5, category: "off_topic", shouldEscalate: false };
  }
};
