import crypto from "crypto";
import medicalChatSessionModel from "../models/medicalChatSessionSchema.js";
import { unique } from "./jsonUtils.js";

const SESSION_HOURS = 24;

const expiresAt = () => new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

export const getOrCreateSession = async (userId, sessionId = null) => {
  if (sessionId) {
    const existing = await medicalChatSessionModel.findOne({ userId, sessionId });
    if (existing) return existing;
  }

  const nextSessionId = `session_${userId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  return medicalChatSessionModel.create({
    userId,
    sessionId: nextSessionId,
    expiresAt: expiresAt(),
    conversationThread: [],
    extractedSymptoms: [],
    medicalContext: {},
  });
};

export const appendMessage = async (session, message) => {
  session.conversationThread.push({ timestamp: new Date(), ...message });
  session.expiresAt = expiresAt();
  await session.save();
  return session;
};

export const updateSessionContext = async (session, updates = {}) => {
  if (updates.symptoms?.length) {
    session.extractedSymptoms = unique([...(session.extractedSymptoms || []), ...updates.symptoms]);
  }
  session.medicalContext = {
    ...(session.medicalContext || {}),
    ...(updates.medicalContext || {}),
  };
  session.expiresAt = expiresAt();
  await session.save();
  return session;
};

export const summarizeSession = (session) => ({
  sessionId: session.sessionId,
  extractedSymptoms: session.extractedSymptoms || [],
  medicalContext: session.medicalContext || {},
  timeline: (session.conversationThread || []).slice(-12),
});
