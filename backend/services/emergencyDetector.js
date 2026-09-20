import grokClient from "./grokClient.js";
import { parseJsonObject, unique } from "./jsonUtils.js";

const emergencyPatterns = [
  { symptom: "chest pain", riskLevel: "CRITICAL", patterns: [/chest pain/i, /pressure in (my )?chest/i] },
  { symptom: "difficulty breathing", riskLevel: "CRITICAL", patterns: [/difficulty breathing/i, /can't breathe/i, /short(ness)? of breath/i] },
  { symptom: "loss of consciousness", riskLevel: "CRITICAL", patterns: [/loss of consciousness/i, /passed out/i, /fainted/i, /unconscious/i] },
  { symptom: "severe bleeding", riskLevel: "CRITICAL", patterns: [/severe bleeding/i, /won't stop bleeding/i, /bleeding heavily/i] },
  { symptom: "poisoning", riskLevel: "CRITICAL", patterns: [/poison/i, /overdose/i, /swallowed.*chemical/i] },
  { symptom: "anaphylaxis", riskLevel: "CRITICAL", patterns: [/anaphylaxis/i, /swelling.*(face|lips|tongue|throat)/i, /allergic reaction.*breath/i] },
  { symptom: "stroke signs", riskLevel: "CRITICAL", patterns: [/sudden paralysis/i, /face droop/i, /difficulty speaking/i, /slurred speech/i] },
  { symptom: "high fever with confusion", riskLevel: "HIGH", patterns: [/fever.*confusion/i, /confusion.*fever/i] },
  { symptom: "severe abdominal pain", riskLevel: "HIGH", patterns: [/severe abdominal pain/i, /worst stomach pain/i] },
  { symptom: "severe trauma", riskLevel: "CRITICAL", patterns: [/major accident/i, /severe trauma/i, /head injury.*vomit/i] },
];

const riskRank = { NONE: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export const detectEmergency = async (input = "", imageText = "") => {
  const text = `${input} ${imageText}`.trim();
  const matched = [];
  let riskLevel = "NONE";

  emergencyPatterns.forEach((entry) => {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      matched.push(entry.symptom);
      if (riskRank[entry.riskLevel] > riskRank[riskLevel]) riskLevel = entry.riskLevel;
    }
  });

  if (matched.length || !grokClient.isConfigured() || text.length < 4) {
    return {
      isEmergency: matched.length > 0,
      riskLevel,
      symptoms: unique(matched),
      suggestedAction: matched.length ? "call 112 or local emergency services" : "monitor",
    };
  }

  try {
    const content = await grokClient.chat(
      [{ role: "user", content: text }],
      `You are a medical safety system. Detect emergency symptoms requiring immediate professional attention.
Output ONLY valid JSON:
{"isEmergency":true|false,"riskLevel":"CRITICAL|HIGH|MEDIUM|NONE","symptoms":["..."],"suggestedAction":"call 112|seek urgent care|monitor"}`,
      0,
      500
    );
    return {
      isEmergency: false,
      riskLevel: "NONE",
      symptoms: [],
      suggestedAction: "monitor",
      ...parseJsonObject(content),
    };
  } catch {
    return { isEmergency: false, riskLevel: "NONE", symptoms: [], suggestedAction: "monitor" };
  }
};

export const buildEmergencyResponse = (emergency) => ({
  mode: "EMERGENCY",
  title: "Possible emergency detected",
  answer:
    "DO NOT rely on this chatbot for diagnosis. Call local emergency services (112 in India) or seek immediate medical attention now.",
  symptoms: emergency.symptoms,
  immediateActions: [
    "Call local emergency services (112 in India).",
    "Seek immediate medical attention.",
    `Inform the healthcare provider about: ${emergency.symptoms.join(", ") || "the symptoms you described"}.`,
  ],
  safetyDisclaimer: "This assessment is not a diagnosis and does not replace professional evaluation.",
});
