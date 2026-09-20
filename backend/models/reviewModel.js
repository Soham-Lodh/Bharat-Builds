import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", default: null, index: true },
    type: { type: String, enum: ["doctor", "website"], required: true, index: true },
    visibility: { type: String, enum: ["public", "private"], required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, default: "" },
    comment: { type: String, required: true },
    tags: [{ type: String }],
    userDisplayName: { type: String, default: "Patient" },
  },
  { timestamps: true }
);

reviewSchema.index(
  { userId: 1, doctorId: 1, type: 1, visibility: 1 },
  { unique: true, partialFilterExpression: { doctorId: { $type: "objectId" } } }
);
reviewSchema.index(
  { userId: 1, type: 1, visibility: 1 },
  { unique: true, partialFilterExpression: { doctorId: null, type: "website" } }
);

export default mongoose.models.review || mongoose.model("review", reviewSchema);
