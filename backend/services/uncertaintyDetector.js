const refusalTriggers = [
  { pattern: /(what disease do i have|diagnose me|do i have .* from this (photo|image|picture))/i, reason: "Diagnosis cannot be confirmed from chat or image alone." },
  { pattern: /(pregnan|miscarriage|abortion|labor|fetal)/i, reason: "Pregnancy-related decisions need professional medical guidance." },
  { pattern: /(child|baby|infant|toddler).*dose|dose.*(child|baby|infant|toddler)/i, reason: "Pediatric dosing requires clinician/pharmacist verification." },
  { pattern: /(drug interaction|mix these medicines|combine these medicines)/i, reason: "Interaction checks require a complete medication and allergy list." },
  { pattern: /(prescribe|which antibiotic|start antibiotic)/i, reason: "Prescribing decisions require a licensed clinician." },
];

export const detectUncertainty = ({ message = "", confidence = 0.8, imageType = "" }) => {
  const trigger = refusalTriggers.find((item) => item.pattern.test(message));
  const imageDiagnosis = imageType === "CLINICAL_PHOTO" && /(diagnose|disease|measles|cancer|infection)/i.test(message);

  if (trigger || imageDiagnosis || confidence < 0.6) {
    return {
      shouldRefuse: true,
      reason: trigger?.reason || (imageDiagnosis ? "A diagnosis cannot be made from an image alone." : "Confidence is below the safe response threshold."),
      canDo: [
        "Describe visible or reported features in plain language.",
        "Explain general categories of conditions that clinicians consider.",
        "Identify warning signs that require urgent care.",
        "Suggest what information to bring to a doctor.",
      ],
      cannotDo: [
        "Confirm a diagnosis.",
        "Prescribe treatment or dosage.",
        "Rule out serious conditions.",
      ],
      nextStep: imageDiagnosis ? "Schedule an appointment with a dermatologist or appropriate clinician." : "Discuss this with a qualified healthcare professional.",
    };
  }

  return { shouldRefuse: false };
};
