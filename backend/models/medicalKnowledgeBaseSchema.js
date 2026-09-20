import mongoose from "mongoose";

const medicalKnowledgeBaseSchema = new mongoose.Schema(
  {
    condition: { type: String, required: true, index: true },
    summary: { type: String, required: true },
    commonSymptoms: [{ type: String }],
    riskFactors: [{ type: String }],
    whenToSeekCare: { type: String, default: "" },
    relatedConditions: [{ type: String }],
    source: { type: String, required: true },
    sourceURL: { type: String, default: "" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

medicalKnowledgeBaseSchema.index({
  condition: "text",
  summary: "text",
  commonSymptoms: "text",
  relatedConditions: "text",
});

export default mongoose.models.medicalKnowledgeBase ||
  mongoose.model("medicalKnowledgeBase", medicalKnowledgeBaseSchema);
