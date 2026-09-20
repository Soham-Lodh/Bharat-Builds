import validator from "validator";
import appointmentModel from "../models/appointmentModel.js";
import reviewModel from "../models/reviewModel.js";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";

const clean = (value = "") => validator.escape(validator.trim(String(value)));

const validateReviewInput = ({ rating, comment }) => {
  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  if (!comment || !String(comment).trim()) {
    throw new Error("Review cannot be blank");
  }
  return parsedRating;
};

const hasCompletedConsultation = async (userId, doctorId) => {
  const appointment = await appointmentModel.findOne({
    userId: String(userId),
    docId: String(doctorId),
    cancelled: false,
    isCompleted: true,
  }).lean();
  return Boolean(appointment);
};

const publicReviewProjection = "rating title comment userDisplayName createdAt updatedAt";

export const getPublicWebsiteReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find({ type: "website", visibility: "public" })
      .sort({ updatedAt: -1 })
      .select(publicReviewProjection)
      .lean();
    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyWebsiteReview = async (req, res) => {
  try {
    const review = await reviewModel.findOne({
      userId: req.user.userId,
      type: "website",
      visibility: "public",
      doctorId: null,
    });
    return res.json({ success: true, review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertWebsiteReview = async (req, res) => {
  try {
    const rating = validateReviewInput(req.body);
    const user = await userModel.findById(req.user.userId).select("name");
    const review = await reviewModel.findOneAndUpdate(
      { userId: req.user.userId, type: "website", visibility: "public", doctorId: null },
      {
        userId: req.user.userId,
        doctorId: null,
        type: "website",
        visibility: "public",
        rating,
        title: clean(req.body.title || ""),
        comment: clean(req.body.comment),
        userDisplayName: user?.name || "Patient",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, message: "Website review saved", review });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getPublicDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await doctorModel.findById(doctorId).select("_id");
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const reviews = await reviewModel
      .find({ doctorId, type: "doctor", visibility: "public" })
      .sort({ updatedAt: -1 })
      .select(publicReviewProjection)
      .lean();

    const count = reviews.length;
    const averageRating = count
      ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / count).toFixed(1))
      : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((item) => item.rating === star).length,
    }));

    return res.json({ success: true, reviews, summary: { count, averageRating, distribution } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorReviewState = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const eligible = await hasCompletedConsultation(req.user.userId, doctorId);
    const [publicReview, privateReview] = await Promise.all([
      reviewModel.findOne({ userId: req.user.userId, doctorId, type: "doctor", visibility: "public" }),
      reviewModel.findOne({ userId: req.user.userId, doctorId, type: "doctor", visibility: "private" }),
    ]);
    return res.json({
      success: true,
      eligible,
      message: eligible ? "Eligible to review" : "Complete a consultation with this doctor before reviewing.",
      publicReview,
      privateReview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertDoctorReview = async (req, res) => {
  try {
    const { doctorId, visibility } = req.params;
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ success: false, message: "Invalid review visibility" });
    }
    const eligible = await hasCompletedConsultation(req.user.userId, doctorId);
    if (!eligible) {
      return res.status(403).json({ success: false, message: "You can review this doctor after a completed consultation." });
    }
    const rating = validateReviewInput(req.body);
    const user = await userModel.findById(req.user.userId).select("name");
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags.map(clean).filter(Boolean).slice(0, 8)
      : [];

    const review = await reviewModel.findOneAndUpdate(
      { userId: req.user.userId, doctorId, type: "doctor", visibility },
      {
        userId: req.user.userId,
        doctorId,
        type: "doctor",
        visibility,
        rating,
        title: clean(req.body.title || ""),
        comment: clean(req.body.comment),
        tags,
        userDisplayName: user?.name || "Patient",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, message: visibility === "private" ? "Private note saved" : "Doctor review saved", review });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
