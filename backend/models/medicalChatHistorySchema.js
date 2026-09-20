import mongoose from "mongoose";

const medicalChatHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    message: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    documentType: { type: String, default: "" },
    intent: { type: mongoose.Schema.Types.Mixed, default: {} },
    response: { type: mongoose.Schema.Types.Mixed, default: {} },
    emergencyDetected: { type: mongoose.Schema.Types.Mixed, default: {} },
    sources: [{ type: mongoose.Schema.Types.Mixed }],
    refusal: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, minimize: false }
);

medicalChatHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.medicalChatHistory ||
  mongoose.model("medicalChatHistory", medicalChatHistorySchema);
