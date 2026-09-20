const categoryRules = [
  {
    speciality: "Dermatologist",
    category: "dermatological",
    terms: ["skin", "rash", "acne", "dermatitis", "eczema", "psoriasis", "fungal", "lesion", "mole", "itch", "wound", "hives", "clinical_photo"],
  },
  {
    speciality: "Cardiologist",
    category: "cardiac",
    terms: ["heart", "chest pain", "palpitation", "cardiac", "hypertension", "blood pressure", "arrhythmia"],
  },
  {
    speciality: "Neurologist",
    category: "neurological",
    terms: ["migraine", "seizure", "stroke", "neurologic", "headache", "numbness", "weakness", "paralysis", "confusion"],
  },
  {
    speciality: "Gastroenterologist",
    category: "gastrointestinal",
    terms: ["stomach", "abdominal", "gastritis", "diarrhea", "vomit", "nausea", "liver", "gastro", "indigestion", "ulcer"],
  },
  {
    speciality: "Orthopedic",
    category: "musculoskeletal",
    terms: ["knee", "joint", "bone", "fracture", "orthopedic", "back pain", "shoulder", "sprain", "muscle"],
  },
  {
    speciality: "Gynecologist",
    category: "reproductive",
    terms: ["pregnan", "period", "menstrual", "pelvic", "gynec", "uterus", "vaginal"],
  },
  {
    speciality: "Pediatrician",
    category: "pediatric",
    terms: ["child", "baby", "infant", "toddler", "pediatric"],
  },
  {
    speciality: "ENT Specialist",
    category: "ent",
    terms: ["ear", "nose", "throat", "sinus", "tonsil", "hearing"],
  },
  {
    speciality: "Pulmonologist",
    category: "respiratory",
    terms: ["lung", "asthma", "wheezing", "respiratory", "breathing", "cough", "pneumonia"],
  },
  {
    speciality: "Urologist",
    category: "urological",
    terms: ["urine", "kidney stone", "urolog", "bladder", "prostate"],
  },
];

const normalize = (value = "") => String(value).toLowerCase();

const pickAvailableSpeciality = (target, available = []) => {
  if (!available.length) return target;
  const exact = available.find((item) => item.toLowerCase() === target.toLowerCase());
  if (exact) return exact;
  if (target === "Pulmonologist") return available.find((item) => /pulmon/i.test(item)) || "General Physician";
  if (target === "Urologist") return available.find((item) => /urolog/i.test(item)) || "General Physician";
  if (target === "Orthopedic") return available.find((item) => /ortho/i.test(item)) || target;
  return target;
};

export const resolveSpeciality = ({
  message = "",
  identifiedConditions = [],
  imageAnalysis = null,
  symptoms = [],
  sources = [],
  existingMappings = [],
  availableSpecialities = [],
} = {}) => {
  const signals = [
    { weight: 0.42, source: "condition", text: identifiedConditions.join(" ") },
    { weight: 0.32, source: "image analysis", text: `${imageAnalysis?.imageType || ""} ${imageAnalysis?.analysis || ""} ${imageAnalysis?.rawText || ""}` },
    { weight: 0.22, source: "symptoms", text: symptoms.join(" ") },
    { weight: 0.18, source: "rag evidence", text: sources.map((source) => `${source.condition || ""} ${source.title || ""} ${source.excerpt || ""}`).join(" ") },
    { weight: 0.14, source: "message", text: message },
    { weight: 0.12, source: "speciality mapping", text: existingMappings.map((item) => `${item.symptom} ${(item.relatedSpecialities || []).join(" ")}`).join(" ") },
  ];

  const scores = categoryRules.map((rule) => {
    const matchedSources = [];
    const score = signals.reduce((sum, signal) => {
      const text = normalize(signal.text);
      const matches = rule.terms.filter((term) => text.includes(term));
      if (matches.length) matchedSources.push(signal.source);
      return sum + Math.min(signal.weight, matches.length * signal.weight);
    }, 0);
    return { rule, score, matchedSources: [...new Set(matchedSources)] };
  }).sort((a, b) => b.score - a.score);

  const best = scores[0];
  if (!best || best.score < 0.18) {
    return {
      recommendedSpeciality: "General Physician",
      speciality: "General Physician",
      confidence: 0.45,
      reason: "The available evidence does not strongly indicate a specialist category.",
      source: "fallback",
      appointmentPath: "/doctors/General%20Physician",
    };
  }

  const speciality = pickAvailableSpeciality(best.rule.speciality, availableSpecialities);
  const confidence = Math.min(0.95, 0.55 + best.score);
  const fallback = speciality === "General Physician" && !["General Physician", "Orthopedic"].includes(best.rule.speciality);

  return {
    recommendedSpeciality: speciality,
    speciality,
    confidence: fallback ? 0.52 : Number(confidence.toFixed(2)),
    reason: fallback
      ? `${best.rule.speciality} evidence was detected, but that speciality is not currently available in the doctor dataset.`
      : `The available evidence is primarily ${best.rule.category}.`,
    source: best.matchedSources.join(" + ") || "speciality resolver",
    appointmentPath: `/doctors/${encodeURIComponent(speciality)}`,
  };
};
