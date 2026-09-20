export const classifyDocument = (text = "", file = null) => {
  const normalized = text.toLowerCase();
  const fileType = file?.mimetype || "";

  if (/x-?ray|mri|ct scan|ultrasound|radiology|imaging/.test(normalized)) return "SCAN";
  if (/hemoglobin|wbc|platelet|reference range|cbc|glucose|cholesterol|mg\/dl|g\/dl/.test(normalized)) return "LAB_REPORT";
  if (/rx|tablet|capsule|mg|take|dose|dosage|prescription|twice daily/.test(normalized)) return "PRESCRIPTION";
  if (/medical certificate|fit to|unfit|doctor signature|certificate/.test(normalized)) return "CERTIFICATE";
  if (fileType.startsWith("image/")) return "CLINICAL_PHOTO";
  return "UNKNOWN";
};
