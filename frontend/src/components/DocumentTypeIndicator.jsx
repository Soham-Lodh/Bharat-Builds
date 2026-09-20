import React from "react";
import { FileText, FlaskConical, Image, Stethoscope } from "lucide-react";

const iconMap = {
  PRESCRIPTION: Stethoscope,
  LAB_REPORT: FlaskConical,
  CLINICAL_PHOTO: Image,
  SCAN: Image,
  CERTIFICATE: FileText,
  UNKNOWN: FileText,
};

const DocumentTypeIndicator = ({ type }) => {
  if (!type) return null;
  const Icon = iconMap[type] || FileText;
  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      <Icon size={14} />
      {type.replaceAll("_", " ")}
    </div>
  );
};

export default DocumentTypeIndicator;
