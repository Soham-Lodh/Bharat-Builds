import mongoose from "mongoose";

const symptomSpecialityMapSchema = new mongoose.Schema(
  {
    symptom: { type: String, required: true, unique: true, index: true },
    relatedSpecialities: [{ type: String }],
    confidence: { type: Number, default: 0.7 },
    examples: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.symptomSpecialityMap ||
  mongoose.model("symptomSpecialityMap", symptomSpecialityMapSchema);
