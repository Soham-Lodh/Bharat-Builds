const testMeanings = {
  hemoglobin: "How well your blood can carry oxygen.",
  hgb: "How well your blood can carry oxygen.",
  wbc: "White blood cells that help fight infection.",
  platelets: "Cells that help your blood clot.",
  glucose: "Sugar level in the blood.",
  cholesterol: "A blood fat related to heart and blood vessel risk.",
};

const parseNumber = (value) => {
  const match = String(value || "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const getStatus = (result) => {
  const value = parseNumber(result.value);
  const range = String(result.refRange || result.referenceRange || "");
  const rangeMatch = range.match(/(-?\d+(\.\d+)?)\s*[-–]\s*(-?\d+(\.\d+)?)/);
  if (value === null || !rangeMatch) return "UNKNOWN";
  const low = Number(rangeMatch[1]);
  const high = Number(rangeMatch[3]);
  if (value < low) return "LOW";
  if (value > high) return "HIGH";
  return "NORMAL";
};

export const explainReport = (imageAnalysis = {}) => {
  const results = imageAnalysis?.extracted?.testResults || [];
  if (!Array.isArray(results) || results.length === 0) return null;

  const values = results.map((result) => {
    const name = result.testName || result.name || "Test";
    const key = name.toLowerCase();
    const status = getStatus(result);
    return {
      testName: name,
      value: result.value || "",
      unit: result.unit || "",
      refRange: result.refRange || result.referenceRange || "",
      status,
      explanation: Object.keys(testMeanings).find((item) => key.includes(item))
        ? testMeanings[Object.keys(testMeanings).find((item) => key.includes(item))]
        : "A lab measurement your doctor interprets with your symptoms and history.",
    };
  });

  const abnormal = values.filter((item) => ["LOW", "HIGH"].includes(item.status));
  return {
    mode: "REPORT",
    values,
    whatTheyMeasure: values.map((item) => ({ testName: item.testName, explanation: item.explanation })),
    doctorDiscussion: [
      ...abnormal.map((item) => `What could explain ${item.testName} being ${item.status.toLowerCase()}?`),
      "Do I need repeat testing or additional tests?",
      "How do these results fit with my symptoms and medical history?",
    ],
    safetyNote: "Abnormal lab values can have several causes and should be interpreted by your doctor in clinical context.",
  };
};
