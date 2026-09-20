import mongoose from "mongoose";

const emergencyDetectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    sessionId: { type: String, index: true },
    symptoms: [{ type: String }],
    riskLevel: { type: String, enum: ["CRITICAL", "HIGH", "MEDIUM", "NONE"], default: "NONE" },
    suggestedAction: { type: String, default: "" },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.emergencyDetection ||
  mongoose.model("emergencyDetection", emergencyDetectionSchema);
