import React from "react";
import { MessageSquarePlus } from "lucide-react";

const ConversationSidebar = ({ sessionId, timeline = [], onNewConversation }) => (
  <aside className="border-b border-gray-200 bg-white p-4 lg:w-72 lg:border-b-0 lg:border-r">
    <button
      type="button"
      onClick={onNewConversation}
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      <MessageSquarePlus size={16} />
      New conversation
    </button>
    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Current session</p>
    <p className="break-all rounded-md bg-gray-50 p-2 text-xs text-gray-600">{sessionId || "Not started"}</p>
    <p className="mb-2 mt-4 text-xs font-semibold uppercase text-gray-500">Timeline</p>
    <div className="space-y-2">
      {timeline.length ? timeline.map((item, index) => (
        <div key={`${item.timestamp}-${index}`} className="rounded-md border border-gray-100 p-2 text-xs">
          <p className="font-medium text-gray-900">{item.role}</p>
          <p className="line-clamp-2 text-gray-600">{typeof item.content === "string" ? item.content : item.type || item.intent || "Medical copilot event"}</p>
        </div>
      )) : <p className="text-sm text-gray-500">Messages in this session will appear here.</p>}
    </div>
  </aside>
);

export default ConversationSidebar;
