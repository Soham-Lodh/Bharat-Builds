import mongoose from "mongoose";

const conversationMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    intent: { type: String },
    type: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const medicalChatSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    conversationThread: [conversationMessageSchema],
    extractedSymptoms: [{ type: String }],
    medicalContext: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { minimize: false }
);

export default mongoose.models.medicalChatSession ||
  mongoose.model("medicalChatSession", medicalChatSessionSchema);
