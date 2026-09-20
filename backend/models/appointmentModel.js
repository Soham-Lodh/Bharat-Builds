import mongoose from "mongoose";
const appointmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  docId: {
    type: String,
    required: true,
    index: true,
  },
  slotDate: {
    type: String,
    required: true,
  },
  slotTime: {
    type: String,
    required: true,
  },
  userData: {
    type: Object,
    required: true,
  },
  docData: {
    type: Object,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  cancelled: {
    type: Boolean,
    default: false,
  },
  payment: {
    type: Boolean,
    default: false,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  appointmentType: {
    type: String,
    enum: ["INITIAL", "FOLLOW_UP"],
    default: "INITIAL",
  },
  parentAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "appointments",
    default: null,
  },
  followUpNotes: {
    type: String,
    default: "",
  },
  followUpAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "appointments",
    default: null,
  },
  prescription: {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    uploadedAt: { type: Date, default: null },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", default: null },
  },
});
appointmentSchema.index({ docId: 1, slotDate: 1, slotTime: 1 });
const appointmentModel = mongoose.model("appointments", appointmentSchema);
export default appointmentModel;
