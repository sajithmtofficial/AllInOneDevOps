import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import "../styles/code-editor.css";

const API_URL = "http://127.0.0.1:8000/api";

function CodeEditor() {
  const [code, setCode] = useState(
`# Welcome to All In One DevOps

def hello():
    print("Hello from All In One DevOps!")

hello()
`
  );

  const [language, setLanguage] = useState("python");
  const [activeFile, setActiveFile] = useState("main.py");

  const [terminalOutput, setTerminalOutput] = useState(
    "Terminal ready...\n"
  );

  const [aiMessage, setAiMessage] = useState(
    "Hello! I'm your AI Coding Partner. Ask me anything about your code."
  );

  const [aiInput, setAiInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: "assistant", content: "Hello! I'm your AI Coding Partner. Ask me anything about your code." },
  ]);
  const [copied, setCopied] = useState(false);
  const [correctedCode, setCorrectedCode] = useState("");
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [isTerminalOpen, setIsTerminalOpen] = useState(true);

  const files = [
    {
      name: "src",
      type: "folder",
      children: [
        { name: "main.py", type: "file", language: "python" },
        { name: "app.py", type: "file", language: "python" },
        { name: "requirements.txt", type: "file", language: "plaintext" },
      ],
    },
    {
      name: "tests",
      type: "folder",
      children: [
        { name: "test_main.py", type: "file", language: "python" },
      ],
    },
    { name: "README.md", type: "file", language: "markdown" },
    { name: "Dockerfile", type: "file", language: "dockerfile" },
  ];

  // ============================================================
  // FILE CLICK
  // ============================================================

  const handleFileClick = (file) => {
    if (file.type !== "file") return;

    setActiveFile(file.name);
    setLanguage(file.language || "plaintext");

    if (file.name === "main.py") {
      setCode(
`# Main Python File

def hello():
    print("Hello from All In One DevOps!")

hello()
`
      );
    }

    else if (file.name === "app.py") {
      setCode(
`from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return {"message": "Hello from DevOps Platform"}

if __name__ == "__main__":
    app.run(debug=True)
`
      );
    }

    else if (file.name === "requirements.txt") {
      setCode(
`django
djangorestframework
djangorestframework-simplejwt
flask
`
      );
    }

    else if (file.name === "README.md") {
      setCode(
`# All In One DevOps

An integrated DevOps platform with:

- Code Editor
- Git
- Build
- Deployment
- Monitoring
- AI-assisted troubleshooting
`
      );
    }

    else if (file.name === "Dockerfile") {
      setCode(
`FROM python:3.12

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

CMD ["python", "app.py"]
`
      );
    }

    else {
      setCode("# Start writing your code here...");
    }
  };

  // ============================================================
  // AI REQUEST
  // ============================================================

  const askAI = async (message, action = "chat") => {
    const finalMessage = message.trim();
    if (!finalMessage && !code.trim()) return;

    const userText = finalMessage || (
      action === "explain"
        ? "Explain the current code."
        : action === "fix"
        ? "Find errors in the current code and provide corrected code."
        : action === "refactor"
        ? "Improve and refactor the current code."
        : "Help me with the current code."
    );

    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: userText },
    ]);
    setIsAIThinking(true);

    // Clear the previous corrected result when starting a new request.
    if (action === "fix" || action === "generate" || action === "refactor") {
      setCorrectedCode("");
    }

    try {
      const response = await fetch(`${API_URL}/ai-assistant/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalMessage,
          code,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const reply = data.reply || "The AI assistant returned an error.";
        setAiMessage(reply);
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", content: reply },
        ]);
        return;
      }

      setAiMessage(data.reply || "Done.");

      // The backend returns corrected_code separately for Fix Code.
      if ((action === "fix" || action === "generate" || action === "refactor") && data.corrected_code) {
        setCorrectedCode(data.corrected_code);
      }

      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: data.reply || "Done." },
      ]);
    } catch (error) {
      console.error("AI Error:", error);
      const reply =
        "Unable to connect to the AI assistant.\n\n" +
        "Make sure Django and Ollama are running.";
      setAiMessage(reply);
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: reply },
      ]);
    } finally {
      setIsAIThinking(false);
    }
  };

  const copyToClipboard = async (textToCopy) => {
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const useCorrectedCode = () => {
    if (!correctedCode.trim()) return;
    setCode(correctedCode);
    setCopied(false);
    setTerminalOutput("> Corrected code pasted into editor.\n");
    setIsTerminalOpen(true);
  };

  const handleClearChat = () => {
    const message = "Chat cleared. How can I help you with your code?";
    setChatMessages([{ id: Date.now(), role: "assistant", content: message }]);
    setAiMessage(message);
  };

  // ============================================================
  // SEND AI MESSAGE
  // ============================================================

  const handleSendAI = async () => {

    if (!aiInput.trim() || isAIThinking) {
      return;
    }

    const message = aiInput.trim();

    setAiInput("");

    await askAI(message, "chat");
  };

  // ============================================================
  // ENTER KEY
  // ============================================================

  const handleAIKeyDown = (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendAI();
    }
  };

  // ============================================================
  // GENERATE CODE
  // ============================================================

  const handleGenerateCode = async () => {

    const message =
      aiInput.trim() ||
      "Generate useful code based on the current project and code.";

    setAiInput("");

    await askAI(
      message,
      "generate"
    );
  };

  // ============================================================
  // EXPLAIN CODE
  // ============================================================

  const handleExplainCode = async () => {

    await askAI(
      "Explain the current code clearly.",
      "explain"
    );
  };

  // ============================================================
  // FIX ERRORS
  // ============================================================

  const handleFixErrors = async () => {

    await askAI(
      "Find errors in the current code and provide corrected code.",
      "fix"
    );
  };

  // ============================================================
  // IMPROVE CODE
  // ============================================================

  const handleImproveCode = async () => {

    await askAI(
      "Improve and refactor the current code.",
      "refactor"
    );
  };

  // ============================================================
  // RUN CODE
  // ============================================================

  const handleRun = async () => {

    setIsRunning(true);
    setIsTerminalOpen(true);

    setTerminalOutput(
      `> Running ${activeFile}...\n\n`
    );

    try {

      const response = await fetch(
        `${API_URL}/run-code/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code,
            language: language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        setTerminalOutput(
          `> Execution failed\n\n${data.output || "Unknown error"}`
        );

        return;
      }

      setTerminalOutput(
        `> Running ${activeFile}\n\n` +
        `${data.output || "No output."}\n` +
        `\n> Process completed.`
      );

    } catch (error) {

      console.error("Run error:", error);

      setTerminalOutput(
        "> Could not connect to Django.\n\n" +
        "Make sure the Django server is running."
      );

    } finally {

      setIsRunning(false);
    }
  };

  // ============================================================
  // STOP CODE
  // ============================================================

  const handleStop = async () => {

    try {

      await fetch(
        `${API_URL}/stop-code/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setTerminalOutput(
        "> Process stopped."
      );

    } catch (error) {

      console.error("Stop error:", error);

      setTerminalOutput(
        "> Could not connect to Django."
      );
    }

    setIsRunning(false);
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = () => {

    setTerminalOutput(
      `> Saving ${activeFile}\n` +
      `> File saved successfully.\n`
    );

    setIsTerminalOpen(true);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="code-editor-page">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header className="editor-header">

        <div className="editor-brand">

          <div className="editor-brand-icon">
            <span>☁</span>
          </div>

          <div>
            <div className="editor-brand-title">
              All In One <span>DevOps</span>
            </div>

            <div className="editor-brand-subtitle">
              AI-Powered Development Platform
            </div>
          </div>

        </div>

        <nav className="editor-top-nav">

          <button className="top-nav-active">
            Code
          </button>

          <button>
            Build
          </button>

          <button>
            Deploy
          </button>

          <button>
            Monitor
          </button>

        </nav>

        <div className="editor-header-actions">

          <button
            className="header-action save-btn"
            onClick={handleSave}
          >
            💾 Save
          </button>

          {!isRunning ? (

            <button
              className="header-action run-btn"
              onClick={handleRun}
            >
              ▶ Run
            </button>

          ) : (

            <button
              className="header-action run-btn"
              onClick={handleStop}
            >
              ■ Stop
            </button>

          )}

          <div className="user-avatar">
            A
          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="editor-body">

        {/* ===================================================
            LEFT ACTIVITY BAR
        =================================================== */}

        <aside className="activity-bar">

          <button
            className="activity-active"
            title="Home"
          >
            🏠
          </button>

          <button title="Explorer">
            📁
          </button>

          <button title="Source Control">
            🌿
          </button>

          <button title="Docker">
            🐳
          </button>

          <button title="Monitor">
            📊
          </button>

          <div className="activity-spacer"></div>

          <button title="Settings">
            ⚙
          </button>

        </aside>


        {/* ===================================================
            FILE EXPLORER + ROBOT
        =================================================== */}

        <aside className="left-panel">

          <div className="panel-title">
            <span>EXPLORER</span>
            <span className="panel-menu">
              •••
            </span>
          </div>

          <div className="workspace-title">
            <span>⌄</span>
            ALLINONEDEVOPS
          </div>

          <div className="file-tree">

            {files.map((item, index) => (

              <div key={index}>

                {item.type === "folder" ? (

                  <>

                    <div className="folder-item">
                      <span>⌄</span>
                      <span>📁</span>
                      <span>{item.name}</span>
                    </div>

                    <div className="folder-children">

                      {item.children.map(
                        (child, childIndex) => (

                          <button
                            key={childIndex}
                            className={
                              activeFile === child.name
                                ? "file-item file-active"
                                : "file-item"
                            }
                            onClick={() =>
                              handleFileClick(child)
                            }
                          >

                            <span>

                              {child.name.endsWith(".py")
                                ? "🐍"
                                : child.name.endsWith(".txt")
                                ? "📄"
                                : "📄"}

                            </span>

                            <span>
                              {child.name}
                            </span>

                          </button>

                        )
                      )}

                    </div>

                  </>

                ) : (

                  <button
                    className={
                      activeFile === item.name
                        ? "file-item file-active"
                        : "file-item"
                    }
                    onClick={() =>
                      handleFileClick(item)
                    }
                  >

                    <span>📄</span>

                    <span>
                      {item.name}
                    </span>

                  </button>

                )}

              </div>

            ))}

          </div>


          {/* =================================================
              ROBOT AI SECTION
          ================================================= */}

          <div className="robot-ai-section">

            <div className="robot-image-container">

              <img
                src="/robot-ai.png"
                alt="AI Coding Partner"
                className="robot-image"
              />

            </div>

            <div className="robot-title">
              AI Coding Partner
            </div>

            <div className="robot-subtitle">
              Your intelligent development assistant
            </div>

            <button
              className="robot-action"
              onClick={handleGenerateCode}
            >
              <span>✨</span>
              <span>Generate Code</span>
            </button>

            <button
              className="robot-action"
              onClick={handleExplainCode}
            >
              <span>💡</span>
              <span>Explain Code</span>
            </button>

            <button
              className="robot-action"
              onClick={handleFixErrors}
            >
              <span>🔧</span>
              <span>Fix Errors</span>
            </button>

            <button
              className="robot-action"
              onClick={handleImproveCode}
            >
              <span>✨</span>
              <span>Improve & Refactor</span>
            </button>

          </div>

        </aside>


        {/* ===================================================
            CENTER EDITOR
        =================================================== */}

        <main className="editor-center">

          <div className="editor-tabs">

            <div className="editor-tab active-tab">

              <span>🐍</span>

              <span>
                {activeFile}
              </span>

              <span className="tab-close">
                ×
              </span>

            </div>

            <div className="editor-tab-space"></div>

            <div className="language-selector">

              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
              >

                <option value="python">
                  Python
                </option>

                <option value="javascript">
                  JavaScript
                </option>

                <option value="java">
                  Java
                </option>

                <option value="cpp">
                  C++
                </option>

                <option value="html">
                  HTML
                </option>

                <option value="css">
                  CSS
                </option>

                <option value="plaintext">
                  Plain Text
                </option>

              </select>

            </div>

          </div>


          <div className="monaco-wrapper">

            <Editor
              height="100%"
              language={language}
              value={code}
              theme="vs-dark"
              onChange={(value) =>
                setCode(value || "")
              }
              options={{
                minimap: {
                  enabled: true,
                },

                fontSize: 15,

                lineNumbers: "on",

                automaticLayout: true,

                wordWrap: "on",

                padding: {
                  top: 15,
                  bottom: 15,
                },

                scrollBeyondLastLine: false,

                roundedSelection: false,

                cursorBlinking: "smooth",
              }}
            />

          </div>


          {/* =================================================
              TERMINAL
          ================================================= */}

          {isTerminalOpen && (

            <div className="terminal-panel">

              <div className="terminal-header">

                <div className="terminal-tabs">

                  <button className="terminal-tab-active">
                    TERMINAL
                  </button>

                  <button>
                    OUTPUT
                  </button>

                  <button>
                    PROBLEMS
                  </button>

                </div>

                <button
                  className="terminal-close"
                  onClick={() =>
                    setIsTerminalOpen(false)
                  }
                >
                  ×
                </button>

              </div>

              <div className="terminal-content">

                <pre>
                  {terminalOutput}
                </pre>

              </div>

            </div>

          )}

        </main>


        {/* ===================================================
            RIGHT AI PANEL
        =================================================== */}

        <aside className="right-ai-panel">

          <div className="ai-panel-header">

            <div className="ai-panel-title">

              <span className="ai-icon">
                🤖
              </span>

              <div>

                <strong>
                  AI Assistant
                </strong>

                <small>
                  Powered by Qwen2.5 3B
                </small>

              </div>

            </div>

            <button className="ai-menu">
              •••
            </button>

          </div>


          <div className="ai-status">

            <span className="status-dot"></span>

            AI Assistant Online

          </div>


          <div className="ai-chat">

            {chatMessages.map((message) => (
              <div className="ai-message" key={message.id}>
                <div className="message-avatar">
                  {message.role === "user" ? "👤" : "🤖"}
                </div>
                <div className="message-content">
                  <strong>{message.role === "user" ? "You" : "AI Assistant"}</strong>
                  <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
                </div>
              </div>
            ))}

            {isAIThinking && (
              <div className="ai-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <strong>AI Assistant</strong>
                  <p>Thinking...</p>
                </div>
              </div>
            )}


            {correctedCode && (
              <div className="ai-code-card">

                <div className="ai-code-header">
                  <span>Corrected Code</span>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(correctedCode)}
                      title="Copy corrected code"
                    >
                      {copied ? "Copied!" : "Copy Code"}
                    </button>

                    <button
                      type="button"
                      onClick={useCorrectedCode}
                      title="Paste corrected code into the code editor"
                    >
                      📋 Paste to Editor
                    </button>
                  </div>
                </div>

                <pre>{correctedCode}</pre>

              </div>
            )}

            <div className="ai-code-card">

              <div className="ai-code-header">
                <span>Current Code</span>

                <button
                  type="button"
                  onClick={() => copyToClipboard(code)}
                  title="Copy current code"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <pre>{code}</pre>

            </div>

          </div>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="quick-actions">

            <div className="quick-title">
              Quick Actions
            </div>

            <button type="button" onClick={handleClearChat} disabled={isAIThinking}>
              🧹 Clear Chat
            </button>

            <button
              onClick={handleGenerateCode}
              disabled={isAIThinking}
            >
              ✨ Generate Code
            </button>

            <button
              onClick={handleExplainCode}
              disabled={isAIThinking}
            >
              💡 Explain Selection
            </button>

            <button
              onClick={handleFixErrors}
              disabled={isAIThinking}
            >
              🔧 Fix Errors
            </button>

            <button
              onClick={handleImproveCode}
              disabled={isAIThinking}
            >
              ✨ Refactor Code
            </button>

          </div>


          {/* =================================================
              AI INPUT
          ================================================= */}

          <div className="ai-input-area">

            <textarea
              value={aiInput}
              onChange={(e) =>
                setAiInput(e.target.value)
              }
              onKeyDown={handleAIKeyDown}
              placeholder={
                isAIThinking
                  ? "AI is thinking..."
                  : "Ask AI anything about your code..."
              }
              rows="3"
              disabled={isAIThinking}
            />

            <button
              className="send-ai"
              onClick={handleSendAI}
              disabled={
                isAIThinking ||
                !aiInput.trim()
              }
              title="Send message"
            >
              {isAIThinking ? "..." : "➤"}
            </button>

          </div>

        </aside>

      </div>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="editor-footer">

        <div>
          ● Ready
        </div>

        <div>
          All In One DevOps
        </div>

        <div>
          {language} &nbsp; | &nbsp; UTF-8
        </div>

      </footer>

    </div>
  );
}

export default CodeEditor;