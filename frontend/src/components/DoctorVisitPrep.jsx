import React from "react";
import { CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DoctorVisitPrep = ({ prep }) => {
  const navigate = useNavigate();
  if (!prep) return null;

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-blue-950">
        <CalendarCheck size={18} />
        <h3 className="font-semibold">Preparing for your doctor visit</h3>
      </div>
      <div className="grid gap-4 text-sm md:grid-cols-3">
        <div>
          <p className="mb-2 font-medium text-gray-900">Questions</p>
          <ul className="space-y-1 text-gray-700">{prep.questionsToDiscuss?.map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
        <div>
          <p className="mb-2 font-medium text-gray-900">Symptom tracker</p>
          <ul className="space-y-1 text-gray-700">{prep.symptomTracker?.map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
        <div>
          <p className="mb-2 font-medium text-gray-900">What to bring</p>
          <ul className="space-y-1 text-gray-700">{prep.whatToBring?.map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(prep.appointmentPath || "/doctors")}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Book {prep.speciality}
        </button>
        <button type="button" onClick={() => window.print()} className="rounded-md border border-blue-200 px-4 py-2 text-sm text-blue-700 hover:bg-white">
          Download prep
        </button>
      </div>
    </div>
  );
};

export default DoctorVisitPrep;
