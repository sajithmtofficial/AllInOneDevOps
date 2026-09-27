import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import "../styles/code-editor.css";
import { runCode, stopCode } from "../services/codeRunner";

const API_URL = "http://127.0.0.1:8000/api";

const DEFAULT_FILES = {
  "main.py": `# Welcome to All In One DevOps

def hello():
    print("Hello from All In One DevOps!")

hello()
`,

  "app.js": `console.log("Hello from All In One DevOps!");
`,

  "Main.java": `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from All In One DevOps!");
    }
}
`,

  "main.c": `#include <stdio.h>

int main() {
    printf("Hello from All In One DevOps!\\n");
    return 0;
}
`,

  "main.cpp": `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from All In One DevOps!" << endl;
    return 0;
}
`,

  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All In One DevOps</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>

    <div class="container">
        <h1>Hello from All In One DevOps!</h1>
        <p>HTML, CSS and JavaScript preview is working.</p>

        <button id="helloButton">
            Click Me
        </button>
    </div>

    <script src="script.js"></script>

</body>
</html>
`,

  "style.css": `body {
    font-family: Arial, sans-serif;
    background: #f4f6f8;
    text-align: center;
    padding: 80px;
}

.container {
    background: white;
    max-width: 600px;
    margin: auto;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

h1 {
    color: #2563eb;
}

button {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    background: #2563eb;
    color: white;
    cursor: pointer;
}

button:hover {
    background: #1d4ed8;
}
`,

  "script.js": `document
    .getElementById("helloButton")
    ?.addEventListener("click", () => {
        alert("Hello from the All In One DevOps preview!");
    });
`,

  "README.md": `# All In One DevOps

An integrated DevOps platform with:

- Code Editor
- Multi-language execution
- Git
- Docker
- CI/CD
- Monitoring
- AI-assisted troubleshooting
`,

  "requirements.txt": `django
djangorestframework
djangorestframework-simplejwt
`,

  "Dockerfile": `FROM python:3.12

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

CMD ["python", "main.py"]
`,
};

const LANGUAGE_MAP = {
  py: "python",
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "typescript",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  html: "html",
  htm: "html",
  css: "css",
  json: "json",
  md: "markdown",
  txt: "plaintext",
};

function getLanguageFromFilename(filename) {
  const lower = filename.toLowerCase();

  if (lower === "dockerfile") {
    return "dockerfile";
  }

  const extension = lower.includes(".")
    ? lower.substring(lower.lastIndexOf(".") + 1)
    : "";

  return LANGUAGE_MAP[extension] || "plaintext";
}

function getFileIcon(filename) {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".py")) return "🐍";
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "🟨";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "🔷";
  if (lower.endsWith(".java")) return "☕";
  if (lower.endsWith(".c")) return "🔵";
  if (
    lower.endsWith(".cpp") ||
    lower.endsWith(".cc") ||
    lower.endsWith(".cxx")
  ) {
    return "🟣";
  }
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "🌐";
  if (lower.endsWith(".css")) return "🎨";
  if (lower.endsWith(".json")) return "📋";
  if (lower.endsWith(".md")) return "📘";
  if (lower === "dockerfile") return "🐳";

  return "📄";
}

function getStarterCode(language) {
  switch (language) {
    case "python":
      return `print("Hello from All In One DevOps!")\n`;

    case "javascript":
      return `console.log("Hello from All In One DevOps!");\n`;

    case "jsx":
      return `import React from "react";

export default function App() {
    return (
        <div>
            <h1>Hello from All In One DevOps!</h1>
        </div>
    );
}
`;

    case "typescript":
      return `const message: string = "Hello from All In One DevOps!";
console.log(message);
`;

    case "java":
      return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from All In One DevOps!");
    }
}
`;

    case "c":
      return `#include <stdio.h>

int main() {
    printf("Hello from All In One DevOps!\\n");
    return 0;
}
`;

    case "cpp":
      return `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from All In One DevOps!" << endl;
    return 0;
}
`;

    case "html":
      return `<!DOCTYPE html>
<html>
<head>
    <title>All In One DevOps</title>
</head>

<body>
    <h1>Hello from All In One DevOps!</h1>
</body>
</html>
`;

    case "css":
      return `body {
    font-family: Arial, sans-serif;
    margin: 40px;
}
`;

    case "json":
      return `{
    "message": "Hello from All In One DevOps"
}
`;

    case "markdown":
      return `# All In One DevOps

Write your documentation here.
`;

    case "dockerfile":
      return `FROM python:3.12

WORKDIR /app

COPY . .

CMD ["python", "main.py"]
`;

    default:
      return "# Start writing your code here...";
  }
}

function CodeEditor() {
  const [code, setCode] = useState(DEFAULT_FILES["main.py"]);

  const [language, setLanguage] = useState("python");

  const [activeFile, setActiveFile] = useState("main.py");

  const [fileContents, setFileContents] =
    useState(DEFAULT_FILES);

  const [files, setFiles] = useState([
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "main.py",
          type: "file",
          language: "python",
        },
        {
          name: "app.js",
          type: "file",
          language: "javascript",
        },
        {
          name: "Main.java",
          type: "file",
          language: "java",
        },
        {
          name: "main.c",
          type: "file",
          language: "c",
        },
        {
          name: "main.cpp",
          type: "file",
          language: "cpp",
        },
      ],
    },

    {
      name: "web",
      type: "folder",
      children: [
        {
          name: "index.html",
          type: "file",
          language: "html",
        },
        {
          name: "style.css",
          type: "file",
          language: "css",
        },
        {
          name: "script.js",
          type: "file",
          language: "javascript",
        },
      ],
    },

    {
      name: "requirements.txt",
      type: "file",
      language: "plaintext",
    },

    {
      name: "README.md",
      type: "file",
      language: "markdown",
    },

    {
      name: "Dockerfile",
      type: "file",
      language: "dockerfile",
    },
  ]);

  const [terminalOutput, setTerminalOutput] =
    useState("Terminal ready...\n");

  const [isTerminalOpen, setIsTerminalOpen] =
    useState(true);

  const [isRunning, setIsRunning] =
    useState(false);

  const [isPreviewOpen, setIsPreviewOpen] =
    useState(false);

  const [previewDocument, setPreviewDocument] =
    useState("");

  const [aiInput, setAiInput] = useState("");

  const [aiMessage, setAiMessage] = useState(
    "Hello! I'm your AI Coding Partner. Ask me anything about your code."
  );

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I'm your AI Coding Partner. Ask me anything about your code.",
    },
  ]);

  const [correctedCode, setCorrectedCode] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [isAIThinking, setIsAIThinking] =
    useState(false);

  /* =========================================================
     SAVE CURRENT FILE CONTENT
  ========================================================= */

  const saveCurrentFileContent = (newCode) => {
    setCode(newCode);

    setFileContents((previous) => ({
      ...previous,
      [activeFile]: newCode,
    }));
  };

  /* =========================================================
     FILE CLICK
  ========================================================= */

  const handleFileClick = (file) => {
    if (file.type !== "file") {
      return;
    }

    const newLanguage =
      file.language ||
      getLanguageFromFilename(file.name);

    const savedCode =
      fileContents[file.name] ??
      getStarterCode(newLanguage);

    setActiveFile(file.name);

    setLanguage(newLanguage);

    setCode(savedCode);

    setIsPreviewOpen(false);
  };

  /* =========================================================
     CHANGE LANGUAGE
  ========================================================= */

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);

    /*
      IMPORTANT:
      When changing Python → C++ for example,
      we replace the old Python code with valid
      C++ starter code.

      This prevents errors such as:

      using namespace std;
      SyntaxError: invalid syntax
    */

    const newCode = getStarterCode(newLanguage);

    setCode(newCode);

    setFileContents((previous) => ({
      ...previous,
      [activeFile]: newCode,
    }));

    setTerminalOutput(
      `> Language changed to ${newLanguage}.\n` +
      `> Starter code loaded for ${newLanguage}.\n`
    );

    setIsTerminalOpen(true);
  };

  /* =========================================================
     ADD NEW FILE
  ========================================================= */

  const handleAddFile = () => {
    const filename = window.prompt(
      "Enter file name:\n\nExamples:\nmain.py\napp.js\nMain.java\nmain.c\nmain.cpp\nindex.html"
    );

    if (!filename) {
      return;
    }

    const cleanName = filename.trim();

    if (!cleanName) {
      return;
    }

    if (
      cleanName.includes("/") ||
      cleanName.includes("\\") ||
      cleanName.includes("..")
    ) {
      window.alert(
        "Please enter only a file name."
      );
      return;
    }

    const exists = files.some((item) => {
      if (item.type === "file") {
        return item.name === cleanName;
      }

      return item.children?.some(
        (child) => child.name === cleanName
      );
    });

    if (exists) {
      window.alert(
        "A file with this name already exists."
      );
      return;
    }

    const newLanguage =
      getLanguageFromFilename(cleanName);

    const starterCode =
      getStarterCode(newLanguage);

    const newFile = {
      name: cleanName,
      type: "file",
      language: newLanguage,
    };

    setFiles((previous) => [
      ...previous,
      newFile,
    ]);

    setFileContents((previous) => ({
      ...previous,
      [cleanName]: starterCode,
    }));

    setActiveFile(cleanName);

    setLanguage(newLanguage);

    setCode(starterCode);

    setTerminalOutput(
      `> Created ${cleanName}\n`
    );

    setIsTerminalOpen(true);
  };

  /* =========================================================
     DELETE FILE
  ========================================================= */

  const handleDeleteFile = () => {
    if (!activeFile) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${activeFile}"?`
    );

    if (!confirmed) {
      return;
    }

    setFiles((previous) =>
      previous
        .filter(
          (item) =>
            !(
              item.type === "file" &&
              item.name === activeFile
            )
        )
        .map((item) => {
          if (item.type !== "folder") {
            return item;
          }

          return {
            ...item,
            children: item.children.filter(
              (child) =>
                child.name !== activeFile
            ),
          };
        })
    );

    setFileContents((previous) => {
      const next = {
        ...previous,
      };

      delete next[activeFile];

      return next;
    });

    const fallbackCode =
      DEFAULT_FILES["main.py"];

    setActiveFile("main.py");

    setLanguage("python");

    setCode(fallbackCode);

    setTerminalOutput(
      `> Deleted ${activeFile}\n`
    );

    setIsTerminalOpen(true);
  };

  /* =========================================================
     BROWSER PREVIEW
  ========================================================= */

  const buildBrowserPreview = () => {
    let html = code;

    /*
      CSS FILE PREVIEW
    */

    if (language === "css") {
      return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>CSS Preview</title>

<style>
${code}
</style>

</head>

<body>

<div class="container">
    <h1>CSS Preview</h1>
    <p>This page is using your CSS code.</p>
    <button>Sample Button</button>
</div>

</body>
</html>
`;
    }

    /*
      JAVASCRIPT FILE PREVIEW
    */

    if (
      language === "javascript" &&
      !activeFile.toLowerCase().endsWith(".html")
    ) {
      return `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">
<title>JavaScript Preview</title>
</head>

<body>

<h1>JavaScript Preview</h1>

<p>
JavaScript is running inside the browser preview.
</p>

<script>
${code}
</script>

</body>

</html>
`;
    }

    /*
      HTML FILE
    */

    /*
      Replace local CSS reference
      with actual CSS code.
    */

    html = html.replace(
      /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi,
      (fullTag, href) => {
        const filename =
          href.split("/").pop();

        const css =
          fileContents[filename];

        if (css !== undefined) {
          return `
<style>
${css}
</style>
`;
        }

        return fullTag;
      }
    );

    /*
      Replace local JS reference
      with actual JS code.
    */

    html = html.replace(
      /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
      (fullTag, src) => {
        const filename =
          src.split("/").pop();

        const js =
          fileContents[filename];

        if (js !== undefined) {
          return `
<script>
${js}
<\/script>
`;
        }

        return fullTag;
      }
    );

    return html;
  };

  /* =========================================================
     PREVIEW
  ========================================================= */

  const handlePreview = () => {
    if (!code.trim()) {
      setTerminalOutput(
        "> Nothing to preview.\n"
      );

      setIsTerminalOpen(true);

      return;
    }

    if (
      ![
        "html",
        "css",
        "javascript",
      ].includes(language)
    ) {
      setTerminalOutput(
        `> ${activeFile} cannot be browser previewed.\n\n` +
        "> Browser Preview supports:\n" +
        "> HTML\n" +
        "> CSS\n" +
        "> JavaScript\n\n" +
        "> Python, Java, C and C++ use Docker.\n"
      );

      setIsTerminalOpen(true);

      return;
    }

    const preview =
      buildBrowserPreview();

    setPreviewDocument(preview);

    setIsPreviewOpen(true);

    setTerminalOutput(
      `> Browser preview opened for ${activeFile}.\n`
    );

    setIsTerminalOpen(true);
  };

  /* =========================================================
     RUN CODE
  ========================================================= */

  const handleRun = async () => {
    if (!code.trim()) {
      setTerminalOutput(
        "> Nothing to run.\n"
      );

      setIsTerminalOpen(true);

      return;
    }

    /*
      HTML / CSS / JavaScript
      */

    if (
      language === "html" ||
      language === "css" ||
      language === "javascript"
    ) {
      handlePreview();
      return;
    }

    /*
      These languages are not currently sent
      to the Docker execution endpoint.
      */

    if (
      language === "typescript" ||
      language === "jsx" ||
      language === "plaintext" ||
      language === "markdown" ||
      language === "dockerfile"
    ) {
      setTerminalOutput(
        `> ${activeFile} is not directly executable.\n\n` +
        "> Currently supported Docker execution:\n" +
        "> Python\n" +
        "> JavaScript\n" +
        "> Java\n" +
        "> C\n" +
        "> C++\n"
      );

      setIsTerminalOpen(true);

      return;
    }

    setIsRunning(true);

    setIsTerminalOpen(true);

    setTerminalOutput(
      `> Running ${activeFile}\n` +
      `> Language: ${language}\n` +
      `> Docker execution started...\n\n`
    );

    try {
      const result = await runCode({
        language,
        code,
        stdin: "",
      });

      let output =
        `> Running ${activeFile}\n\n`;

      if (result.stdout) {
        output += result.stdout;

        if (
          !result.stdout.endsWith("\n")
        ) {
          output += "\n";
        }
      }

      if (result.stderr) {
        output +=
          `\n[stderr]\n${result.stderr}`;

        if (
          !result.stderr.endsWith("\n")
        ) {
          output += "\n";
        }
      }

      if (result.success) {
        output +=
          "\n> Process completed successfully.";
      } else {
        output +=
          `\n> Process failed with exit code ${
            result.returncode ?? 1
          }.`;
      }

      setTerminalOutput(output);
    } catch (error) {
      console.error(
        "Code execution error:",
        error
      );

      setTerminalOutput(
        "> Code execution failed.\n\n" +
        `${error?.message || "Unknown error"}\n\n` +
        "> Make sure Django and Docker are running."
      );
    } finally {
      setIsRunning(false);
    }
  };

  /* =========================================================
     STOP CODE
  ========================================================= */

  const handleStop = async () => {
    try {
      await stopCode();

      setTerminalOutput(
        "> Process stopped.\n"
      );
    } catch (error) {
      console.error(
        "Stop error:",
        error
      );

      setTerminalOutput(
        "> Could not stop process.\n" +
        "> Make sure Django is running.\n"
      );
    }

    setIsRunning(false);

    setIsTerminalOpen(true);
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = () => {
    setFileContents((previous) => ({
      ...previous,
      [activeFile]: code,
    }));

    setTerminalOutput(
      `> Saving ${activeFile}\n` +
      "> File saved successfully.\n"
    );

    setIsTerminalOpen(true);
  };

  /* =========================================================
     AI
  ========================================================= */

  const askAI = async (
    message,
    action = "chat"
  ) => {
    const finalMessage =
      message.trim();

    if (
      !finalMessage &&
      !code.trim()
    ) {
      return;
    }

    const userMessage =
      finalMessage ||
      "Help me with the current code.";

    setChatMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        content: userMessage,
      },
    ]);

    setIsAIThinking(true);

    if (
      action === "fix" ||
      action === "generate" ||
      action === "refactor"
    ) {
      setCorrectedCode("");
    }

    try {
      const response =
        await fetch(
          `${API_URL}/ai-assistant/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
    message: finalMessage,
    code: code,
    language: language,
    action: action,
    terminal_output: terminalOutput,
}),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        const reply =
          data.reply ||
          "The AI assistant returned an error.";

        setAiMessage(reply);

        setChatMessages(
          (previous) => [
            ...previous,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: reply,
            },
          ]
        );

        return;
      }

      const reply =
        data.reply || "Done.";

      setAiMessage(reply);

      if (
        data.corrected_code
      ) {
        setCorrectedCode(
          data.corrected_code
        );
      }

      setChatMessages(
        (previous) => [
          ...previous,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: reply,
          },
        ]
      );
    } catch (error) {
      console.error(
        "AI Error:",
        error
      );

      const reply =
        "Unable to connect to the AI assistant.\n\n" +
        "Make sure Django and Ollama are running.";

      setAiMessage(reply);

      setChatMessages(
        (previous) => [
          ...previous,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: reply,
          },
        ]
      );
    } finally {
      setIsAIThinking(false);
    }
  };

  /* =========================================================
     AI BUTTONS
  ========================================================= */

  const handleGenerateCode = () => {
    const message =
      aiInput.trim() ||
      "Generate useful code based on the current code.";

    setAiInput("");

    askAI(
      message,
      "generate"
    );
  };

  const handleExplainCode = () => {
    askAI(
      "Explain the current code clearly.",
      "explain"
    );
  };

  const handleFixErrors = () => {
    askAI(
      `Fix all errors in this ${language} code.
Use the compiler/runtime output shown below to identify the actual error.
Return the COMPLETE corrected ${language} source code.
Do not convert it to Python.
Do not return only the changed lines.
Do not shorten or omit correct parts of the program.
Preserve the original program structure and behavior wherever possible.

Compiler/runtime output:
${terminalOutput}`,
      "fix"
    );
  };

  const handleImproveCode = () => {
    askAI(
      "Improve and refactor the current code.",
      "refactor"
    );
  };

  const handleSendAI = () => {
    if (
      !aiInput.trim() ||
      isAIThinking
    ) {
      return;
    }

    const message =
      aiInput.trim();

    setAiInput("");

    askAI(
      message,
      "chat"
    );
  };

  const handleAIKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendAI();
    }
  };

  /* =========================================================
     COPY
  ========================================================= */

  const copyToClipboard = async (
    textToCopy
  ) => {
    if (!textToCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        textToCopy
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  /* =========================================================
     PASTE CORRECTED CODE
  ========================================================= */

  const useCorrectedCode = () => {
    if (!correctedCode.trim()) {
      return;
    }

    saveCurrentFileContent(
      correctedCode
    );

    setTerminalOutput(
      "> Corrected code pasted into editor.\n"
    );

    setIsTerminalOpen(true);
  };

  /* =========================================================
     CLEAR CHAT
  ========================================================= */

  const handleClearChat = () => {
    const message =
      "Chat cleared. How can I help you with your code?";

    setChatMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: message,
      },
    ]);

    setAiMessage(message);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="code-editor-page">

      {/* =====================================================
          HEADER
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

          {[
            "html",
            "css",
            "javascript",
          ].includes(language) && (
            <button
              className="header-action"
              onClick={handlePreview}
            >
              🌐 Preview
            </button>
          )}

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
          BODY
      ===================================================== */}

      <div className="editor-body">

        {/* ===================================================
            ACTIVITY BAR
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
            LEFT PANEL
        =================================================== */}

        <aside className="left-panel">

          <div className="panel-title">

            <span>
              EXPLORER
            </span>

            <div
              style={{
                display: "flex",
                gap: "6px",
              }}
            >

              <button
                type="button"
                className="new-file-btn"
                onClick={handleAddFile}
                title="Create New File"
              >
                + New File
              </button>

              <button
                type="button"
                className="delete-file-btn"
                onClick={handleDeleteFile}
                title="Delete Current File"
              >
                Delete
              </button>

            </div>

          </div>

          <div className="workspace-title">
            <span>⌄</span>
            ALLINONEDEVOPS
          </div>

          <div className="file-tree">

            {files.map(
              (item, index) => (
                <div key={index}>

                  {item.type ===
                  "folder" ? (
                    <>

                      <div className="folder-item">

                        <span>
                          ⌄
                        </span>

                        <span>
                          📁
                        </span>

                        <span>
                          {item.name}
                        </span>

                      </div>

                      <div className="folder-children">

                        {item.children.map(
                          (
                            child,
                            childIndex
                          ) => (
                            <button
                              key={
                                childIndex
                              }
                              className={
                                activeFile ===
                                child.name
                                  ? "file-item file-active"
                                  : "file-item"
                              }
                              onClick={() =>
                                handleFileClick(
                                  child
                                )
                              }
                            >

                              <span>
                                {getFileIcon(
                                  child.name
                                )}
                              </span>

                              <span>
                                {
                                  child.name
                                }
                              </span>

                            </button>
                          )
                        )}

                      </div>

                    </>
                  ) : (
                    <button
                      className={
                        activeFile ===
                        item.name
                          ? "file-item file-active"
                          : "file-item"
                      }
                      onClick={() =>
                        handleFileClick(
                          item
                        )
                      }
                    >

                      <span>
                        {getFileIcon(
                          item.name
                        )}
                      </span>

                      <span>
                        {item.name}
                      </span>

                    </button>
                  )}

                </div>
              )
            )}

          </div>

          {/* =================================================
              AI ROBOT
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
              onClick={
                handleGenerateCode
              }
            >
              ✨ Generate Code
            </button>

            <button
              className="robot-action"
              onClick={
                handleExplainCode
              }
            >
              💡 Explain Code
            </button>

            <button
              className="robot-action"
              onClick={
                handleFixErrors
              }
            >
              🔧 Fix Errors
            </button>

            <button
              className="robot-action"
              onClick={
                handleImproveCode
              }
            >
              ✨ Improve & Refactor
            </button>

          </div>

        </aside>

        {/* ===================================================
            CENTER EDITOR
        =================================================== */}

        <main className="editor-center">

          {/* TAB */}

          <div className="editor-tabs">

            <div className="editor-tab active-tab">

              <span>
                {getFileIcon(
                  activeFile
                )}
              </span>

              <span>
                {activeFile}
              </span>

              <span className="tab-close">
                ×
              </span>

            </div>

            <div className="editor-tab-space"></div>

            {/* TOP FILE BUTTONS */}

            <button
              type="button"
              className="new-file-btn"
              onClick={handleAddFile}
            >
              + File
            </button>

            <button
              type="button"
              className="delete-file-btn"
              onClick={handleDeleteFile}
            >
              🗑 Delete
            </button>

            {/* LANGUAGE */}

            <div className="language-selector">

              <select
                value={language}
                onChange={(event) =>
                  handleLanguageChange(
                    event.target.value
                  )
                }
              >

                <option value="python">
                  Python
                </option>

                <option value="javascript">
                  JavaScript
                </option>

                <option value="typescript">
                  TypeScript
                </option>

                <option value="jsx">
                  JSX / React
                </option>

                <option value="java">
                  Java
                </option>

                <option value="c">
                  C
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

          {/* MONACO */}

          <div className="monaco-wrapper">

            <Editor
              height="100%"
              language={
                language === "jsx"
                  ? "javascript"
                  : language
              }
              value={code}
              theme="vs-dark"
              onChange={(value) => {
                saveCurrentFileContent(
                  value || ""
                );
              }}
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

                scrollBeyondLastLine:
                  false,

                cursorBlinking:
                  "smooth",

                roundedSelection:
                  false,
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
                    setIsTerminalOpen(
                      false
                    )
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

          {/* CHAT */}

          <div className="ai-chat">

            {chatMessages.map(
              (message) => (
                <div
                  className="ai-message"
                  key={message.id}
                >

                  <div className="message-avatar">
                    {message.role ===
                    "user"
                      ? "👤"
                      : "🤖"}
                  </div>

                  <div className="message-content">

                    <strong>
                      {message.role ===
                      "user"
                        ? "You"
                        : "AI Assistant"}
                    </strong>

                    <p
                      style={{
                        whiteSpace:
                          "pre-wrap",
                      }}
                    >
                      {
                        message.content
                      }
                    </p>

                  </div>

                </div>
              )
            )}

            {isAIThinking && (
              <div className="ai-message">

                <div className="message-avatar">
                  🤖
                </div>

                <div className="message-content">

                  <strong>
                    AI Assistant
                  </strong>

                  <p>
                    Thinking...
                  </p>

                </div>

              </div>
            )}

            {/* CORRECTED CODE */}

            {correctedCode && (
              <div className="ai-code-card">

                <div className="ai-code-header">

                  <span>
                    Corrected Code
                  </span>

                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                    }}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          correctedCode
                        )
                      }
                    >
                      {copied
                        ? "Copied!"
                        : "Copy Code"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        useCorrectedCode
                      }
                    >
                      📋 Paste to Editor
                    </button>

                  </div>

                </div>

                <pre>
                  {correctedCode}
                </pre>

              </div>
            )}

            {/* CURRENT CODE */}

            <div className="ai-code-card">

              <div className="ai-code-header">

                <span>
                  Current Code
                </span>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      code
                    )
                  }
                >
                  {copied
                    ? "Copied!"
                    : "Copy"}
                </button>

              </div>

              <pre>
                {code}
              </pre>

            </div>

          </div>

          {/* QUICK ACTIONS */}

          <div className="quick-actions">

            <div className="quick-title">
              Quick Actions
            </div>

            <button
              onClick={
                handleClearChat
              }
            >
              🧹 Clear Chat
            </button>

            <button
              onClick={
                handleGenerateCode
              }
              disabled={
                isAIThinking
              }
            >
              ✨ Generate Code
            </button>

            <button
              onClick={
                handleExplainCode
              }
              disabled={
                isAIThinking
              }
            >
              💡 Explain Code
            </button>

            <button
              onClick={
                handleFixErrors
              }
              disabled={
                isAIThinking
              }
            >
              🔧 Fix Errors
            </button>

            <button
              onClick={
                handleImproveCode
              }
              disabled={
                isAIThinking
              }
            >
              ✨ Refactor Code
            </button>

          </div>

          {/* AI INPUT */}

          <div className="ai-input-area">

            <textarea
              value={aiInput}
              onChange={(event) =>
                setAiInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleAIKeyDown
              }
              placeholder={
                isAIThinking
                  ? "AI is thinking..."
                  : "Ask AI anything about your code..."
              }
              rows="3"
              disabled={
                isAIThinking
              }
            />

            <button
              className="send-ai"
              onClick={
                handleSendAI
              }
              disabled={
                isAIThinking ||
                !aiInput.trim()
              }
            >
              {isAIThinking
                ? "..."
                : "➤"}
            </button>

          </div>

        </aside>

      </div>

      {/* =====================================================
          BROWSER PREVIEW
      ===================================================== */}

      {isPreviewOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "rgba(0,0,0,0.75)",
            display: "flex",
            flexDirection:
              "column",
            padding: "40px",
            boxSizing:
              "border-box",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              background:
                "#1e1e1e",
              color: "white",
              padding:
                "12px 16px",
              borderRadius:
                "8px 8px 0 0",
            }}
          >

            <strong>
              🌐 Browser Preview —{" "}
              {activeFile}
            </strong>

            <button
              type="button"
              onClick={() =>
                setIsPreviewOpen(
                  false
                )
              }
              style={{
                border: "none",
                background:
                  "transparent",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

          </div>

          <iframe
            title="Browser Preview"
            srcDoc={
              previewDocument
            }
            sandbox="allow-scripts"
            style={{
              width: "100%",
              flex: 1,
              border: "none",
              background: "white",
              borderRadius:
                "0 0 8px 8px",
            }}
          />

        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="editor-footer">

        <div>
          {isRunning
            ? "● Running"
            : "● Ready"}
        </div>

        <div>
          All In One DevOps
        </div>

        <div>
          {language}
          &nbsp; | &nbsp;
          UTF-8
          &nbsp; | &nbsp;
          Docker Runner
        </div>

      </footer>

    </div>
  );
}

export default CodeEditor;