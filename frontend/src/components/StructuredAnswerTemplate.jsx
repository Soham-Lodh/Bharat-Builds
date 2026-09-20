import React, { useState } from "react";
import { ChevronDown, ClipboardList, Eye, MessageCircleQuestion, Siren, Stethoscope } from "lucide-react";
import EvidenceCard from "./EvidenceCard";
import DocumentTypeIndicator from "./DocumentTypeIndicator";
import ReportExplainerCard from "./ReportExplainerCard";
import DoctorVisitPrep from "./DoctorVisitPrep";

const Section = ({ icon: Icon, title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          {React.createElement(Icon, { size: 17 })}
          {title}
        </span>
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-gray-100 px-4 py-3 text-sm leading-6 text-gray-700">{children}</div>}
    </div>
  );
};

const StructuredAnswerTemplate = ({ data }) => {
  if (!data) return null;

  if (data.mode === "NON_MEDICAL") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-900">{data.title}</h3>
        <p className="mt-2 text-sm text-gray-700">{data.answer}</p>
        <p className="mt-3 text-xs text-gray-500">{data.safetyDisclaimer}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{data.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{data.mode}</p>
          </div>
          <DocumentTypeIndicator type={data.documentType || data.imageAnalysis?.imageType} />
        </div>
        <p className="mt-3 text-sm leading-6 text-gray-700">{data.safetyDisclaimer}</p>
      </div>

      {data.imageAnalysis && (
        <Section icon={Eye} title="Image understanding">
          <p>{data.imageAnalysis.analysis}</p>
          {data.imageAnalysis.extracted && Object.keys(data.imageAnalysis.extracted).length > 0 && (
            <pre className="mt-3 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700">
              {JSON.stringify(data.imageAnalysis.extracted, null, 2)}
            </pre>
          )}
          <p className="mt-2 text-xs text-gray-500">{data.imageAnalysis.limitations}</p>
        </Section>
      )}

      <Section icon={Stethoscope} title={data.mode === "MEDICINE" ? "Overview" : "Understanding"}>
        <p>{data.understanding}</p>
      </Section>

      {data.possibleExplanations?.length > 0 && (
        <Section icon={ClipboardList} title="Possible explanations">
          <div className="space-y-3">
            {data.possibleExplanations.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-md bg-gray-50 p-3">
                <p className="font-medium text-gray-900">{index + 1}. {item.label}</p>
                <p className="mt-1">{item.note}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon={ClipboardList} title="What you can monitor">
        <ul className="space-y-1">{data.monitor?.map((item) => <li key={item}>• {item}</li>)}</ul>
      </Section>

      <Section icon={Siren} title="When to seek urgent care">
        <p>{data.urgentCare}</p>
      </Section>

      {data.doctorQuestions?.length > 0 && (
        <Section icon={MessageCircleQuestion} title="Questions for your doctor">
          <ol className="list-decimal space-y-1 pl-5">{data.doctorQuestions.map((item) => <li key={item}>{item}</li>)}</ol>
        </Section>
      )}

      <ReportExplainerCard report={data.reportExplanation} />
      <EvidenceCard sources={data.sources || []} evidenceGrade={data.evidenceGrade} />
      <DoctorVisitPrep prep={data.visitPrep} />
    </div>
  );
};

export default StructuredAnswerTemplate;
