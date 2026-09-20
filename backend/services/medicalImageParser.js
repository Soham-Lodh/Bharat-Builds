import grokClient from "./grokClient.js";
import { classifyDocument } from "./documentClassifier.js";
import { parseJsonObject } from "./jsonUtils.js";

export const parseMedicalImage = async (file) => {
  if (!file) return null;

  if (!grokClient.isConfigured()) {
    return {
      imageType: classifyDocument("", file),
      extracted: {},
      analysis: "Image received. Configure GROK_API_KEY to enable medical document extraction.",
      limitations: "I cannot diagnose from images alone, and image extraction is unavailable without the vision model.",
      rawText: "",
    };
  }

  const prompt = `Analyze this medical document or image. Classify as PRESCRIPTION, LAB_REPORT, CLINICAL_PHOTO, SCAN, CERTIFICATE, or UNKNOWN.
Extract medicines/dosages for prescriptions; test names, values and ranges for lab reports; visible features for clinical photos; imaging type only for scans. Do not diagnose.
Output ONLY valid JSON:
{"imageType":"...","extracted":{},"analysis":"Plain English description","limitations":"What I cannot do","rawText":"visible text if any"}`;

  try {
    const base64 = file.buffer.toString("base64");
    const content = await grokClient.vision(base64, prompt, file.mimetype);
    const parsed = parseJsonObject(content, {});
    return {
      imageType: parsed.imageType || classifyDocument(parsed.rawText || parsed.analysis || "", file),
      extracted: parsed.extracted || {},
      analysis: parsed.analysis || "I can describe this image, but could not extract structured details reliably.",
      limitations: parsed.limitations || "I cannot diagnose from images alone.",
      rawText: parsed.rawText || "",
    };
  } catch (error) {
    return {
      imageType: classifyDocument("", file),
      extracted: {},
      analysis: "The image could not be analyzed right now.",
      limitations: "Please consult your clinician for image interpretation.",
      error: error.message,
      rawText: "",
    };
  }
};
