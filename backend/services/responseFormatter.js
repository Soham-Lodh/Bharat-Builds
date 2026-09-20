export const formatRefusal = (refusal) => ({
  mode: "REFUSAL",
  title: "I cannot reliably determine that here",
  answer: refusal.reason,
  canDo: refusal.canDo,
  cannotDo: refusal.cannotDo,
  nextStep: refusal.nextStep,
  safetyDisclaimer: "This information is educational and does not replace professional medical evaluation.",
});

export const formatStructuredAnswer = ({ message, answer, sources, imageAnalysis, reportExplanation, visitPrep }) => {
  const lower = message.toLowerCase();
  const mode = reportExplanation
    ? "REPORT"
    : /(medicine|tablet|capsule|dose|dosage|side effect|prescription)/i.test(lower)
      ? "MEDICINE"
      : "SYMPTOM";

  return {
    mode,
    title:
      mode === "REPORT"
        ? "Lab report explained"
        : mode === "MEDICINE"
          ? "Medicine information"
          : "Medical assistant response",
    understanding: answer.understanding || answer.answer || "I reviewed your question and the available context.",
    possibleExplanations: answer.possibleExplanations || [],
    monitor: answer.monitor || [
      "Track timing, severity, and triggers.",
      "Note any new or worsening symptoms.",
      "Keep a list of medicines and recent reports.",
    ],
    urgentCare: answer.urgentCare || "Seek urgent care for severe, sudden, rapidly worsening, or emergency symptoms.",
    doctorQuestions: answer.doctorQuestions || visitPrep?.questionsToDiscuss || [],
    sources,
    imageAnalysis,
    reportExplanation,
    visitPrep,
    evidenceGrade: answer.evidenceGrade || (sources.length ? "MEDIUM_CONFIDENCE" : "LOW_CONFIDENCE"),
    safetyDisclaimer: "This is educational information only and does not replace professional medical evaluation, diagnosis, or treatment.",
  };
};
