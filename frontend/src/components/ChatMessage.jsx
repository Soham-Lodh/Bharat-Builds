import React from "react";
import StructuredAnswerTemplate from "./StructuredAnswerTemplate";
import ClarifyingQuestions from "./ClarifyingQuestions";
import EmergencyAlert from "./EmergencyAlert";
import UncertaintyNotice from "./UncertaintyNotice";

const ChatMessage = ({ message, onQuickReply }) => {
  const isUser = message.role === "user";
  const payload = message.content;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-lg bg-blue-600 px-4 py-3 text-white">
          {message.imagePreview && (
            <img src={message.imagePreview} alt="Uploaded medical document" className="mb-3 max-h-44 rounded-md object-contain" />
          )}
          <p className="whitespace-pre-wrap text-sm leading-6">{payload || "Uploaded an image"}</p>
        </div>
      </div>
    );
  }

  if (payload?.mode === "EMERGENCY") return <EmergencyAlert data={payload} />;
  if (payload?.mode === "CLARIFYING_QUESTIONS") return <ClarifyingQuestions data={payload} onQuickReply={onQuickReply} />;
  if (payload?.mode === "REFUSAL") return <UncertaintyNotice data={payload} />;

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-3xl">
        <StructuredAnswerTemplate data={payload} />
      </div>
    </div>
  );
};

export default ChatMessage;
