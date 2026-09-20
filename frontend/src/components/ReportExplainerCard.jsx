import React from "react";

const statusClass = {
  NORMAL: "bg-emerald-50 text-emerald-700",
  LOW: "bg-amber-50 text-amber-800",
  HIGH: "bg-red-50 text-red-700",
  UNKNOWN: "bg-gray-100 text-gray-600",
};

const ReportExplainerCard = ({ report }) => {
  if (!report) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Report explanation</h3>
        <button type="button" onClick={() => window.print()} className="rounded-md border px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
          Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2">Value</th>
              <th className="py-2">Explanation</th>
              <th className="py-2">Next steps</th>
            </tr>
          </thead>
          <tbody>
            {report.values?.map((item) => (
              <tr key={item.testName} className="border-b last:border-0">
                <td className="py-3">
                  <p className="font-medium text-gray-900">{item.testName}</p>
                  <p className="text-gray-600">{item.value} {item.unit} <span className="text-xs">(ref: {item.refRange || "not shown"})</span></p>
                  <span className={`mt-1 inline-block rounded-md px-2 py-1 text-xs ${statusClass[item.status] || statusClass.UNKNOWN}`}>{item.status}</span>
                </td>
                <td className="py-3 text-gray-700">{item.explanation}</td>
                <td className="py-3 text-gray-700">Discuss interpretation with your doctor in clinical context.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-600">{report.safetyNote}</p>
    </div>
  );
};

export default ReportExplainerCard;
