import medicalKnowledgeBaseModel from "../models/medicalKnowledgeBaseSchema.js";
import { starterKnowledgeBase } from "./medicalKnowledgeSeed.js";

const tokenize = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

const scoreEntry = (queryTokens, entry) => {
  const corpus = [
    entry.condition,
    entry.summary,
    ...(entry.commonSymptoms || []),
    ...(entry.riskFactors || []),
    ...(entry.relatedConditions || []),
  ].join(" ").toLowerCase();
  return queryTokens.reduce((sum, token) => sum + (corpus.includes(token) ? 1 : 0), 0);
};

export const retrieveMedicalEvidence = async (query = "", limit = 3) => {
  const tokens = tokenize(query);
  let dbResults = [];

  try {
    dbResults = await medicalKnowledgeBaseModel
      .find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();
  } catch {
    dbResults = [];
  }

  const combined = [...dbResults, ...starterKnowledgeBase];
  const ranked = combined
    .map((entry) => ({ ...entry, localScore: scoreEntry(tokens, entry) }))
    .filter((entry) => entry.localScore > 0 || dbResults.some((db) => String(db._id) === String(entry._id)))
    .sort((a, b) => b.localScore - a.localScore)
    .slice(0, limit);

  return ranked.map((entry, index) => ({
    id: entry._id?.toString() || `starter-${index}`,
    title: `${entry.condition} Overview`,
    condition: entry.condition,
    sourceType: entry.source,
    excerpt: entry.summary,
    url: entry.sourceURL,
    commonSymptoms: entry.commonSymptoms || [],
    whenToSeekCare: entry.whenToSeekCare || "",
  }));
};
