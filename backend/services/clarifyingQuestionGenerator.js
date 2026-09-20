const questionSets = [
  {
    match: /(stomach|abdominal|abdomen|gastric)/i,
    symptom: "stomach pain",
    questions: [
      "Where exactly is the pain: upper, lower, right, left, or diffuse?",
      "How long have you had it?",
      "Is it worse after eating or when your stomach is empty?",
      "Any vomiting, fever, black stools, or blood in stool?",
      "On a scale of 1 to 10, how severe is it?",
    ],
  },
  {
    match: /(headache|migraine|head pain)/i,
    symptom: "headache",
    questions: [
      "Where is the headache located?",
      "How long has it been going on?",
      "How severe is it on a scale of 1 to 10?",
      "Any fever, neck stiffness, vision changes, vomiting, weakness, or confusion?",
      "Did it start suddenly or gradually?",
    ],
  },
  {
    match: /(cough|cold|sore throat)/i,
    symptom: "cough",
    questions: [
      "How long have you had the cough?",
      "Is it dry, or are you coughing up mucus?",
      "Any fever, chest pain, wheezing, or shortness of breath?",
      "Is it worse at night or after activity?",
      "Do you smoke or have asthma/allergies?",
    ],
  },
  {
    match: /(rash|itch|skin|wound)/i,
    symptom: "skin concern",
    questions: [
      "Where on the body is it located?",
      "When did it start and has it spread?",
      "Is it painful, itchy, warm, swollen, or leaking fluid?",
      "Any fever or recent new medicine, food, soap, or exposure?",
      "Can you upload a clear image if you want a description of visible features?",
    ],
  },
];

export const generateClarifyingQuestions = (message = "", session = null) => {
  const existingQuestions = session?.conversationThread?.some((item) => item.type === "CLARIFYING_QUESTIONS");
  const hasAssistantAnswer = session?.conversationThread?.some((item) => item.type === "STRUCTURED_ANSWER");
  if (existingQuestions || hasAssistantAnswer) return null;

  const selected = questionSets.find((set) => set.match.test(message));
  if (!selected) return null;

  return {
    symptom: selected.symptom,
    questions: selected.questions.map((question, index) => ({
      id: `q${index + 1}`,
      question,
      quickAnswers: index === selected.questions.length - 1 ? ["Mild", "Moderate", "Severe"] : [],
    })),
    progressLabel: "Gathering information...",
  };
};
