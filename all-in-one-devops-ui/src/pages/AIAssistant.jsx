import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, Loader2, Send, User } from "lucide-react";
import { askAssistant } from "../services/ai";

const languages = [
  "python",
  "javascript",
  "java",
  "c",
  "cpp",
  "plaintext",
];

const suggestions = [
  "How do I write a Dockerfile for a Python app?",
  "Explain the difference between CI and CD.",
  "Write a Python script that renames files in a folder.",
  "What does a Jenkinsfile pipeline stage do?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("python");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const send = async (text) => {
    const question = (text ?? input).trim();

    if (!question || thinking) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      { id: Date.now(), role: "user", content: question },
    ]);
    setInput("");
    setThinking(true);

    try {
      const data = await askAssistant({
        message: question,
        code: "",
        language,
        action: "chat",
      });

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            data.reply ||
            "The assistant returned an unexpected response.",
          model: data.model,
        },
      ]);
    } catch (requestError) {
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            requestError.message ||
            "The assistant is unavailable right now. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
          AI Tools
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          AI Assistant
        </h1>
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
          Chat about code and DevOps with your AI assistant. For code-aware
          help, use the assistant panel inside the Code Editor.
        </p>
      </div>

      <section className="flex h-[620px] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#11162b]">
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
            <Bot size={16} />
          </span>
          <div>
            <p className="text-xs font-semibold text-white">DevOps Assistant</p>
            <p className="text-[10px] text-slate-500">
              Local AI model
            </p>
          </div>

          <label className="ml-auto flex items-center gap-2 text-[10px] text-slate-400">
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="h-8 rounded-lg border border-white/[0.08] bg-[#0b1022] px-2 text-[11px] text-white outline-none transition focus:border-violet-500/50"
            >
              {languages.map((item) => (
                <option key={item} value={item} className="bg-[#0b1022]">
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
              <Bot size={22} className="mx-auto text-violet-300" />
              <p className="mt-3 text-sm font-medium text-slate-200">
                Start the conversation
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Ask anything about coding or DevOps, or try one of these:
              </p>
              <div className="mt-4 space-y-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-left text-[11px] text-slate-300 transition hover:border-violet-400/25 hover:bg-violet-500/[0.08] hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : ""}`}
            >
              {message.role === "assistant" && (
                <span
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                    message.isError
                      ? "bg-red-500/10 text-red-300"
                      : "bg-violet-500/10 text-violet-300"
                  }`}
                >
                  {message.isError ? (
                    <AlertCircle size={13} />
                  ) : (
                    <Bot size={13} />
                  )}
                </span>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white"
                    : message.isError
                      ? "border border-red-400/15 bg-red-500/[0.06] text-red-200"
                      : "border border-white/[0.05] bg-white/[0.03] text-slate-300"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === "user" && (
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-slate-300">
                  <User size={13} />
                </span>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-300">
                <Bot size={13} />
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.03] px-3.5 py-2.5 text-[11px] text-slate-400">
                <Loader2 size={12} className="animate-spin text-violet-300" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Ask something... (Enter to send, Shift+Enter for a new line)"
              className="min-h-[52px] flex-1 resize-none rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 py-2.5 text-xs leading-relaxed text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={thinking || !input.trim()}
              aria-label="Send message"
              className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-[0_12px_25px_-14px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
