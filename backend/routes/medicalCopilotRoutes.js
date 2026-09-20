import express from "express";
import { rateLimit } from "express-rate-limit";
import upload from "../middleware/multer.js";
import authUser from "../middleware/authUser.js";
import { medicalChat, medicalChatHistory } from "../controllers/medicalCopilotController.js";

const medicalCopilotRouter = express.Router();

const medicalChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.user?.userId || "anonymous-medical-user",
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many medical chat requests. Please slow down." },
});

medicalCopilotRouter.post("/medical-chat", authUser, medicalChatLimiter, upload.single("image"), medicalChat);
medicalCopilotRouter.get("/medical-chat/history", authUser, medicalChatHistory);

export default medicalCopilotRouter;
