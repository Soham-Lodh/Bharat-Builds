const mappings = [
  { pattern: /(knee|joint|bone|fracture|back pain|shoulder)/i, speciality: "Orthopedist" },
  { pattern: /(heart|chest|palpitation|bp|blood pressure)/i, speciality: "Cardiologist" },
  { pattern: /(skin|rash|acne|wound|itch)/i, speciality: "Dermatologist" },
  { pattern: /(stomach|abdominal|gastric|liver|diarrhea|vomit)/i, speciality: "Gastroenterologist" },
  { pattern: /(headache|seizure|weakness|numb|migraine|stroke)/i, speciality: "Neurologist" },
  { pattern: /(pregnan|period|menstrual|pelvic)/i, speciality: "Gynecologist" },
  { pattern: /(child|baby|infant|pediatric)/i, speciality: "Pediatrician" },
];

export const generateDoctorVisitPrep = (message = "", symptoms = [], doctorRecommendation = null) => {
  if (doctorRecommendation?.speciality) {
    const speciality = doctorRecommendation.speciality;
    return buildPrep(speciality, doctorRecommendation.appointmentPath);
  }
  const text = `${message} ${symptoms.join(" ")}`;
  const match = mappings.find((item) => item.pattern.test(text));
  const speciality = match?.speciality || "General Physician";
  return buildPrep(speciality, `/doctors/${encodeURIComponent(speciality)}`);
};

const buildPrep = (speciality, appointmentPath) => {
  return {
    speciality,
    appointmentPath,
    questionsToDiscuss: [
      "How long should this pattern warrant evaluation?",
      "What symptoms should I track?",
      "What warning signs require urgent attention?",
      "What information should I bring to the consultation?",
      "Are there specific tests I should ask about?",
    ],
    symptomTracker: [
      "Date and time symptoms occur",
      "Severity from 1 to 10",
      "Triggers, foods, activity, medicines, or exposures",
      "Associated symptoms such as fever, vomiting, rash, dizziness, or breathing difficulty",
    ],
    whatToBring: [
      "Current medication list",
      "Recent lab reports or prescriptions",
      "Medical history summary",
      "Allergies and prior reactions",
      "Questions written down",
    ],
  };
};
