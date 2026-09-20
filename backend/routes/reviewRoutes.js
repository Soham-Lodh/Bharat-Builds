import express from "express";
import authUser from "../middleware/authUser.js";
import {
  getDoctorReviewState,
  getMyWebsiteReview,
  getPublicDoctorReviews,
  getPublicWebsiteReviews,
  upsertDoctorReview,
  upsertWebsiteReview,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.get("/website", getPublicWebsiteReviews);
reviewRouter.get("/doctor/:doctorId", getPublicDoctorReviews);

reviewRouter.get("/website/me", authUser, getMyWebsiteReview);
reviewRouter.post("/website", authUser, upsertWebsiteReview);
reviewRouter.get("/doctor/:doctorId/me", authUser, getDoctorReviewState);
reviewRouter.post("/doctor/:doctorId/:visibility", authUser, upsertDoctorReview);

export default reviewRouter;
