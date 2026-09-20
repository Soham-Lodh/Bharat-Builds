import React from "react";
import { CircleHelp } from "lucide-react";

const ClarifyingQuestions = ({ data, onQuickReply }) => (
  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
    <div className="mb-3 flex items-center gap-2 text-blue-900">
      <CircleHelp size={18} />
      <div>
        <p className="font-semibold">{data.title}</p>
        <p className="text-xs text-blue-700">{data.progressLabel}</p>
      </div>
    </div>
    <div className="space-y-3">
      {data.questions?.map((item, index) => (
        <div key={item.id} className="rounded-md bg-white p-3 text-sm text-gray-800">
          <p className="font-medium">{index + 1}. {item.question}</p>
          {item.quickAnswers?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.quickAnswers.map((answer) => (
                <button
                  key={answer}
                  type="button"
                  onClick={() => onQuickReply(answer)}
                  className="rounded-md border border-blue-200 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
                >
                  {answer}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
    <p className="mt-3 text-xs text-gray-600">{data.safetyDisclaimer}</p>
  </div>
);

export default ClarifyingQuestions;
