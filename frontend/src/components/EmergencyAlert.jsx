import React from "react";
import { AlertTriangle, PhoneCall } from "lucide-react";

const EmergencyAlert = ({ data }) => (
  <div className="rounded-lg border border-red-300 bg-red-50 p-5 text-red-950">
    <div className="mb-3 flex items-center gap-2">
      <AlertTriangle size={22} />
      <h2 className="text-lg font-bold">{data.title}</h2>
    </div>
    <p className="font-semibold">{data.answer}</p>
    {data.symptoms?.length > 0 && (
      <p className="mt-3 text-sm">Symptoms identified: {data.symptoms.join(", ")}</p>
    )}
    <div className="mt-4 space-y-2">
      {data.immediateActions?.map((action) => (
        <div key={action} className="flex gap-2 rounded-md bg-white p-3 text-sm">
          <PhoneCall size={16} className="mt-0.5 shrink-0" />
          <span>{action}</span>
        </div>
      ))}
    </div>
    <p className="mt-4 text-xs">{data.safetyDisclaimer}</p>
  </div>
);

export default EmergencyAlert;
