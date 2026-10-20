import { useState } from "react";
import { FaRobot, FaPaperPlane } from "react-icons/fa";
import "../styles/pages.css";

const API_URL = "http://127.0.0.1:8000/api";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = async () => {
    const question = input.trim();

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
      const response = await fetch(`${API_URL}/ai-assistant/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          code: "",
          language: "python",
          action: "chat",
          terminal_output: "",
        }),
      });

      const data = await response.json();

      const reply =
        data.reply ||
        (response.ok
          ? "The assistant returned an unexpected response."
          : "The AI assistant is unavailable right now.");

      setMessages((previous) => [
        ...previous,
        { id: Date.now() + 1, role: "assistant", content: reply },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Could not reach the AI assistant. Check that Django is running on port 8000.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="page">
      <p className="page-eyebrow">INTELLIGENT HELP</p>
      <h1>AI Assistant</h1>
      <p className="page-sub">
        Ask questions about code, DevOps practices, or your projects.
      </p>

      <section className="page-card">
        <h2>
          <FaRobot style={{ marginRight: "8px", color: "#8b5cf6" }} />
          Chat
        </h2>

        <div className="chat-box">
          {messages.length === 0 && (
            <p className="page-muted">
              Start the conversation — try "How do I write a Dockerfile?".
            </p>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble ${message.role}`}
            >
              {message.content}
            </div>
          ))}

          {thinking && (
            <div className="chat-bubble assistant">Thinking...</div>
          )}
        </div>

        <div className="chat-row">
          <input
            className="page-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                send();
              }
            }}
            placeholder="Ask something..."
          />
          <button className="page-btn" onClick={send} disabled={thinking}>
            <FaPaperPlane /> Send
          </button>
        </div>
      </section>
    </div>
  );
}
