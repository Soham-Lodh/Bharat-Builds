import React, { useContext, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import ChatMessage from "./ChatMessage";
import ImageUploadZone from "./ImageUploadZone";
import ConversationSidebar from "./ConversationSidebar";

const MedicalCopilot = () => {
  const { token, backendURL } = useContext(AppContext);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: {
        mode: "NON_MEDICAL",
        title: "Medical Assistant",
        answer: "Ask an educational medical question, describe symptoms, or upload a prescription/lab report. I will ask clarifying questions when needed and flag urgent symptoms.",
        safetyDisclaimer: "This tool does not diagnose, prescribe, or replace professional care.",
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState(localStorage.getItem("medicalCopilotSessionId") || "");
  const [timeline, setTimeline] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [lastDebug, setLastDebug] = useState(null);
  const [loading, setLoading] = useState(false);
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const inputRef = useRef(null);

  const sendMessage = async (overrideText = "") => {
    const text = (overrideText || input).trim();
    if (!text && !file) return;
    if (!token) {
      toast.error("Please login to use the medical assistant.");
      return;
    }

    const outgoingFile = file;
    setMessages((prev) => [...prev, { role: "user", content: text, imagePreview: filePreview }]);
    setInput("");
    setFile(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", text);
      if (sessionId) formData.append("sessionId", sessionId);
      formData.append("debug", String(debugMode));
      if (outgoingFile) formData.append("image", outgoingFile);

      const { data } = await axios.post(`${backendURL}/api/user/medical-chat`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      const payload = data.data;
      setMessages((prev) => [...prev, { role: "assistant", content: payload.response }]);
      setSessionId(payload.sessionId);
      localStorage.setItem("medicalCopilotSessionId", payload.sessionId);
      setTimeline(payload.updatedContext?.timeline || []);
      setLastDebug(payload.debug || null);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Medical copilot request failed");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onNewConversation = () => {
    localStorage.removeItem("medicalCopilotSessionId");
    setSessionId("");
    setTimeline([]);
    setMessages((prev) => prev.slice(0, 1));
    setLastDebug(null);
  };

  return (
    <div className="min-h-[calc(100vh-9rem)] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 lg:flex">
      <ConversationSidebar sessionId={sessionId} timeline={timeline} onNewConversation={onNewConversation} />

      <main className="flex min-h-[calc(100vh-9rem)] flex-1 flex-col">
        <div className="border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Prescripto Medical Copilot</h1>
              <p className="text-sm text-gray-600">Safety-controlled medical AI with emergency escalation and sourced answers.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={debugMode} onChange={(event) => setDebugMode(event.target.checked)} />
              Debug
            </label>
          </div>
          {debugMode && lastDebug && (
            <pre className="mt-3 max-h-32 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
              {JSON.stringify(lastDebug, null, 2)}
            </pre>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
          {messages.map((message, index) => (
            <ChatMessage key={`${message.role}-${index}`} message={message} onQuickReply={(answer) => sendMessage(answer)} />
          ))}
          {loading && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Gathering information...
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <ImageUploadZone file={file} setFile={setFile} />
          <div className="mt-3 flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={2}
              placeholder="Describe symptoms, ask about a medicine, or add context for an uploaded report..."
              className="min-h-[48px] flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !file)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">For emergencies, call 112 in India or your local emergency number.</p>
        </div>
      </main>
    </div>
  );
};

export default MedicalCopilot;
