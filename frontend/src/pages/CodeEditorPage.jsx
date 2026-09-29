import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
    FaFolder,
    FaFolderOpen,
    FaFile,
    FaPlus,
    FaPlay,
    FaSave,
    FaTrash,
    FaEdit,
    FaTerminal,
    FaRobot,
    FaCode,
    FaChevronDown,
    FaChevronRight,
    FaGlobe,
    FaTimes,
} from "react-icons/fa";

import { runCode } from "../services/codeRunner";
import "./CodeEditorPage.css";


/* =========================================================
   LANGUAGE CONFIGURATION
========================================================= */

const LANGUAGE_CONFIG = {

    py: {
        id: "python",
        label: "Python",
        executable: true,
        runner: "python",
        template:
`# All In One DevOps

def hello():
    print("Hello from Python!")

hello()
`,
    },

    js: {
        id: "javascript",
        label: "JavaScript",
        executable: true,
        runner: "javascript",
        template:
`console.log("Hello from JavaScript!");
`,
    },

    jsx: {
        id: "javascript",
        label: "React JSX",
        executable: false,
        runner: null,
        template:
`import React from "react";

function App() {
    return (
        <div>
            <h1>Hello All In One DevOps</h1>
        </div>
    );
}

export default App;
`,
    },

    ts: {
        id: "typescript",
        label: "TypeScript",
        executable: false,
        runner: null,
        template:
`const message: string = "Hello TypeScript";

console.log(message);
`,
    },

    java: {
        id: "java",
        label: "Java",
        executable: true,
        runner: "java",
        template:
`public class Main {

    public static void main(String[] args) {

        System.out.println("Hello from Java!");

    }
}
`,
    },

    c: {
        id: "c",
        label: "C",
        executable: true,
        runner: "c",
        template:
`#include <stdio.h>

int main() {

    printf("Hello from C!\\n");

    return 0;
}
`,
    },

    cpp: {
        id: "cpp",
        label: "C++",
        executable: true,
        runner: "cpp",
        template:
`#include <iostream>

using namespace std;

int main() {

    cout << "Hello from C++!" << endl;

    return 0;
}
`,
    },

    html: {
        id: "html",
        label: "HTML",
        executable: false,
        runner: null,
        template:
`<!DOCTYPE html>

<html>

<head>
    <title>All In One DevOps</title>
</head>

<body>

    <h1>Hello HTML</h1>

    <p>HTML preview is supported.</p>

</body>

</html>
`,
    },

    css: {
        id: "css",
        label: "CSS",
        executable: false,
        runner: null,
        template:
`body {
    font-family: Arial;
    background: #111827;
    color: white;
}

h1 {
    color: #8b5cf6;
}
`,
    },

    json: {
        id: "json",
        label: "JSON",
        executable: false,
        runner: null,
        template:
`{
    "name": "AllInOneDevOps",
    "version": "1.0.0"
}
`,
    },

    md: {
        id: "markdown",
        label: "Markdown",
        executable: false,
        runner: null,
        template:
`# All In One DevOps

## Project

AI-powered DevOps platform.
`,
    },

    txt: {
        id: "plaintext",
        label: "Plain Text",
        executable: false,
        runner: null,
        template: "",
    },
};


/* =========================================================
   INITIAL PROJECT
========================================================= */

const INITIAL_FILES = [
    {
        path: "src/main.py",
        content: LANGUAGE_CONFIG.py.template,
    },

    {
        path: "src/app.py",
        content: "",
    },

    {
        path: "src/App.jsx",
        content: LANGUAGE_CONFIG.jsx.template,
    },

    {
        path: "src/index.js",
        content: LANGUAGE_CONFIG.js.template,
    },

    {
        path: "src/Main.java",
        content: LANGUAGE_CONFIG.java.template,
    },

    {
        path: "src/main.c",
        content: LANGUAGE_CONFIG.c.template,
    },

    {
        path: "src/main.cpp",
        content: LANGUAGE_CONFIG.cpp.template,
    },

    {
        path: "src/index.html",
        content: LANGUAGE_CONFIG.html.template,
    },

    {
        path: "src/style.css",
        content: LANGUAGE_CONFIG.css.template,
    },

    {
        path: "tests/test_main.py",
        content: "",
    },

    {
        path: "README.md",
        content: LANGUAGE_CONFIG.md.template,
    },

    {
        path: "package.json",
        content:
`{
    "name": "all-in-one-devops",
    "version": "1.0.0"
}
`,
    },

    {
        path: "Dockerfile",
        content:
`FROM python:3.12

WORKDIR /app

COPY . .

CMD ["python", "src/main.py"]
`,
    },
];


/* =========================================================
   HELPERS
========================================================= */

function extensionOf(path) {

    const parts = path.split(".");

    if (parts.length < 2) {
        return "txt";
    }

    return parts.pop().toLowerCase();
}


function configOf(path) {

    return (
        LANGUAGE_CONFIG[extensionOf(path)] ||
        LANGUAGE_CONFIG.txt
    );
}


function fileName(path) {

    return path.split("/").pop();
}


function parentFolders(files) {

    const folders = new Set();

    files.forEach((file) => {

        const parts = file.path.split("/");

        parts.pop();

        let current = "";

        parts.forEach((part) => {

            current = current
                ? `${current}/${part}`
                : part;

            folders.add(current);
        });
    });

    return Array.from(folders);
}


/* =========================================================
   FILE ICON
========================================================= */

function FileTypeIcon({ path }) {

    const extension = extensionOf(path);

    const colors = {
        py: "#4da3ff",
        js: "#f7df1e",
        jsx: "#61dafb",
        ts: "#3178c6",
        java: "#ff8a65",
        c: "#9db7ff",
        cpp: "#7ca7ff",
        html: "#ff7043",
        css: "#42a5f5",
        json: "#f5d76e",
        md: "#c8d0e8",
        txt: "#9aa5c4",
    };

    return (
        <FaFile
            size={14}
            color={colors[extension] || "#9aa5c4"}
        />
    );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CodeEditorPage() {

    const [files, setFiles] = useState(() => {

        try {

            const saved =
                localStorage.getItem(
                    "allinone_project_files"
                );

            return saved
                ? JSON.parse(saved)
                : INITIAL_FILES;

        } catch {

            return INITIAL_FILES;
        }
    });


    const [activePath, setActivePath] =
        useState("src/main.py");


    const [openFiles, setOpenFiles] =
        useState([
            "src/main.py"
        ]);


    const [expandedFolders, setExpandedFolders] =
        useState({
            src: true,
            tests: true,
        });


    const [output, setOutput] =
        useState("Terminal ready...");


    const [running, setRunning] =
        useState(false);


    const [consoleTab, setConsoleTab] =
        useState("TERMINAL");


    const [newFileOpen, setNewFileOpen] =
        useState(false);


    const [newFolderOpen, setNewFolderOpen] =
        useState(false);


    const [newName, setNewName] =
        useState("");


    const [aiInput, setAiInput] =
        useState("");


    const [aiMessages, setAiMessages] =
        useState([
            {
                from: "ai",
                text:
                    "Hello! I'm your AI Coding Partner. Ask me anything about your code.",
            },
        ]);


    const [preview, setPreview] =
        useState(null);


    const newNameRef =
        useRef(null);


    /* =====================================================
       ACTIVE FILE
    ===================================================== */

    const activeFile =
        files.find(
            (file) =>
                file.path === activePath
        ) || files[0];


    const language =
        configOf(activeFile.path);


    /* =====================================================
       SAVE TO LOCAL STORAGE
    ===================================================== */

    useEffect(() => {

        localStorage.setItem(
            "allinone_project_files",
            JSON.stringify(files)
        );

    }, [files]);


    /* =====================================================
       CREATE FILE
    ===================================================== */

    function createFile() {

        const name =
            newName.trim();

        if (!name) {
            return;
        }

        if (
            files.some(
                (file) =>
                    file.path === name
            )
        ) {

            setOutput(
                `File already exists: ${name}`
            );

            return;
        }

        const config =
            configOf(name);


        const newFile = {
            path: name,
            content: config.template || "",
        };


        setFiles((current) => [
            ...current,
            newFile,
        ]);


        setActivePath(name);


        setOpenFiles((current) => {

            if (current.includes(name)) {
                return current;
            }

            return [
                ...current,
                name,
            ];
        });


        setNewName("");
        setNewFileOpen(false);


        const folder =
            name.split("/").slice(0, -1).join("/");


        if (folder) {

            setExpandedFolders(
                (current) => ({
                    ...current,
                    [folder]: true,
                })
            );
        }
    }


    /* =====================================================
       CREATE FOLDER
    ===================================================== */

    function createFolder() {

        const folder =
            newName.trim()
                .replace(/\/+$/, "");


        if (!folder) {
            return;
        }


        setExpandedFolders(
            (current) => ({
                ...current,
                [folder]: true,
            })
        );


        setNewName("");
        setNewFolderOpen(false);


        setOutput(
            `Folder created: ${folder}`
        );
    }


    /* =====================================================
       UPDATE FILE
    ===================================================== */

    function updateContent(value) {

        setFiles((current) =>
            current.map((file) =>
                file.path === activePath
                    ? {
                        ...file,
                        content:
                            value ?? "",
                    }
                    : file
            )
        );
    }


    /* =====================================================
       OPEN FILE
    ===================================================== */

    function openFile(path) {

        setActivePath(path);


        setOpenFiles((current) => {

            if (current.includes(path)) {
                return current;
            }

            return [
                ...current,
                path,
            ];
        });
    }


    /* =====================================================
       CLOSE TAB
    ===================================================== */

    function closeTab(path) {

        setOpenFiles((current) => {

            const next =
                current.filter(
                    (item) =>
                        item !== path
                );


            if (
                path === activePath &&
                next.length
            ) {

                setActivePath(
                    next[next.length - 1]
                );
            }


            return next;
        });
    }


    /* =====================================================
       DELETE FILE
    ===================================================== */

    function deleteFile(path) {

        const confirmed =
            window.confirm(
                `Delete "${path}"?`
            );


        if (!confirmed) {
            return;
        }


        setFiles((current) =>
            current.filter(
                (file) =>
                    file.path !== path
            )
        );


        setOpenFiles((current) =>
            current.filter(
                (file) =>
                    file !== path
            )
        );


        if (activePath === path) {

            const remaining =
                files.filter(
                    (file) =>
                        file.path !== path
                );


            if (remaining.length) {

                setActivePath(
                    remaining[0].path
                );
            }
        }


        setOutput(
            `Deleted ${path}`
        );
    }


    /* =====================================================
       RENAME FILE
    ===================================================== */

    function renameFile(path) {

        const newPath =
            window.prompt(
                "Enter new file path:",
                path
            );


        if (!newPath) {
            return;
        }


        if (
            files.some(
                (file) =>
                    file.path ===
                    newPath
            )
        ) {

            window.alert(
                "A file with that name already exists."
            );

            return;
        }


        setFiles((current) =>
            current.map((file) =>
                file.path === path
                    ? {
                        ...file,
                        path: newPath,
                    }
                    : file
            )
        );


        setOpenFiles((current) =>
            current.map((file) =>
                file === path
                    ? newPath
                    : file
            )
        );


        if (activePath === path) {
            setActivePath(newPath);
        }
    }


    /* =====================================================
       SAVE
    ===================================================== */

    function saveProject() {

        localStorage.setItem(
            "allinone_project_files",
            JSON.stringify(files)
        );


        setOutput(
            (current) =>
                `${current}\n✓ Project saved locally.`
        );
    }


    /* =====================================================
       RUN CODE
    ===================================================== */

    async function executeCurrentFile() {

        if (!activeFile) {
            return;
        }


        /* -------------------------------------------------
           HTML PREVIEW
        ------------------------------------------------- */

        if (
            extensionOf(activePath) ===
            "html"
        ) {

            setPreview({
                type: "html",
                content:
                    activeFile.content,
            });

            setConsoleTab(
                "OUTPUT"
            );

            return;
        }


        /* -------------------------------------------------
           CSS PREVIEW
        ------------------------------------------------- */

        if (
            extensionOf(activePath) ===
            "css"
        ) {

            const html = `
<!DOCTYPE html>
<html>
<head>

<style>
${activeFile.content}
</style>

</head>

<body>

<div class="preview-content">

<h1>CSS Preview</h1>

<p>
This page is using your CSS.
</p>

<button>
Sample Button
</button>

</div>

</body>
</html>
`;

            setPreview({
                type: "html",
                content: html,
            });

            setConsoleTab(
                "OUTPUT"
            );

            return;
        }


        /* -------------------------------------------------
           JSON VALIDATION
        ------------------------------------------------- */

        if (
            extensionOf(activePath) ===
            "json"
        ) {

            try {

                JSON.parse(
                    activeFile.content
                );

                setOutput(
                    "✓ JSON is valid."
                );

            } catch (error) {

                setOutput(
                    `✗ JSON Error:\n${error.message}`
                );
            }

            return;
        }


        /* -------------------------------------------------
           NON-EXECUTABLE FILE
        ------------------------------------------------- */

        if (!language.executable) {

            setOutput(
                `${language.label} is an editor/preview file and cannot be executed directly.\n\n` +
                `For React JSX, use the project build environment.`
            );

            return;
        }


        /* -------------------------------------------------
           EXECUTABLE LANGUAGE
        ------------------------------------------------- */

        setRunning(true);

        setPreview(null);

        setConsoleTab(
            "TERMINAL"
        );


        setOutput(
            `$ run ${activePath}\n\nRunning ${language.label}...`
        );


        try {

            const data =
                await runCode({
                    language:
                        language.runner,

                    code:
                        activeFile.content,

                    stdin: "",
                });


            let result = "";


            if (data.stdout) {

                result +=
                    data.stdout;
            }


            if (data.stderr) {

                result +=
                    `${result ? "\n" : ""}${data.stderr}`;
            }


            if (data.error) {

                result +=
                    `${result ? "\n" : ""}${data.error}`;
            }


            if (!result) {

                result =
                    data.success
                        ? "✓ Program finished successfully."
                        : "Program finished with no output.";
            }


            setOutput(
                `$ run ${activePath}\n\n${result}`
            );


        } catch (error) {

            const message =
                error?.response?.data?.error ||
                error.message ||
                "Unable to execute code.";


            setOutput(
                `✗ Execution error\n\n${message}`
            );

        } finally {

            setRunning(false);
        }
    }


    /* =====================================================
       AI MESSAGE
    ===================================================== */

    async function sendAiMessage() {

        const text =
            aiInput.trim();


        if (!text) {
            return;
        }


        setAiMessages(
            (current) => [
                ...current,
                {
                    from: "user",
                    text,
                },
            ]
        );


        setAiInput("");


        /*
         * Your existing Ollama AI endpoint can be connected
         * here without changing the editor architecture.
         */

        setTimeout(() => {

            setAiMessages(
                (current) => [
                    ...current,
                    {
                        from: "ai",
                        text:
                            "I received your request. Your Ollama AI service can be connected here for code explanation, debugging and generation.",
                    },
                ]
            );

        }, 500);
    }


    /* =====================================================
       QUICK AI ACTION
    ===================================================== */

    function aiAction(action) {

        setAiMessages(
            (current) => [
                ...current,
                {
                    from: "user",
                    text: action,
                },
            ]
        );


        setTimeout(() => {

            setAiMessages(
                (current) => [
                    ...current,
                    {
                        from: "ai",
                        text:
                            `${action} requested for ${fileName(activePath)}.`,
                    },
                ]
            );

        }, 400);
    }


    /* =====================================================
       FOLDER TREE
    ===================================================== */

    const folders =
        useMemo(
            () => parentFolders(files),
            [files]
        );


    const rootFiles =
        files.filter(
            (file) =>
                !file.path.includes("/")
        );


    function filesInsideFolder(
        folder
    ) {

        return files.filter(
            (file) => {

                const prefix =
                    `${folder}/`;

                if (
                    !file.path.startsWith(
                        prefix
                    )
                ) {
                    return false;
                }

                const remaining =
                    file.path.slice(
                        prefix.length
                    );

                return (
                    !remaining.includes("/")
                );
            }
        );
    }


    /* =====================================================
       RENDER FILE
    ===================================================== */

    function renderFile(file) {

        return (
            <button
                key={file.path}
                className={
                    `tree-file ${
                        file.path ===
                        activePath
                            ? "active"
                            : ""
                    }`
                }
                onClick={() =>
                    openFile(file.path)
                }
                onDoubleClick={() =>
                    renameFile(file.path)
                }
            >

                <FileTypeIcon
                    path={file.path}
                />

                <span className="tree-file-name">
                    {fileName(file.path)}
                </span>

            </button>
        );
    }


    /* =====================================================
       RENDER FOLDER
    ===================================================== */

    function renderFolder(folder) {

        const open =
            expandedFolders[folder];


        return (
            <div
                key={folder}
                className="folder-group"
            >

                <button
                    className="tree-folder"
                    onClick={() =>
                        setExpandedFolders(
                            (current) => ({
                                ...current,
                                [folder]:
                                    !current[
                                        folder
                                    ],
                            })
                        )
                    }
                >

                    {open ? (
                        <FaChevronDown />
                    ) : (
                        <FaChevronRight />
                    )}

                    {open ? (
                        <FaFolderOpen
                            color="#f2c94c"
                        />
                    ) : (
                        <FaFolder
                            color="#f2c94c"
                        />
                    )}

                    <span>
                        {folder.split("/").pop()}
                    </span>

                </button>


                {open && (
                    <div className="folder-children">

                        {filesInsideFolder(
                            folder
                        ).map(renderFile)}

                    </div>
                )}

            </div>
        );
    }


    return (
        <div className="ide-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="ide-header">

                <div className="ide-brand">

                    <div className="ide-logo">
                        <FaCode />
                    </div>

                    <div>

                        <div className="ide-brand-name">
                            All In One{" "}
                            <span>DevOps</span>
                        </div>

                        <div className="ide-brand-sub">
                            AI-Powered Development Platform
                        </div>

                    </div>

                </div>


                <nav className="ide-nav">

                    <span className="ide-nav-item active">
                        Code
                    </span>

                    <span className="ide-nav-item">
                        Build
                    </span>

                    <span className="ide-nav-item">
                        Deploy
                    </span>

                    <span className="ide-nav-item">
                        Monitor
                    </span>

                </nav>


                <div className="ide-header-actions">

                    <button
                        className="btn btn-ghost"
                        onClick={saveProject}
                    >
                        <FaSave />
                        Save
                    </button>


                    <button
                        className="btn btn-run"
                        onClick={
                            executeCurrentFile
                        }
                        disabled={
                            running
                        }
                    >

                        <FaPlay />

                        {running
                            ? "Running..."
                            : "Run"}

                    </button>


                    <div className="ide-avatar">
                        A
                    </div>

                </div>

            </header>


            {/* =================================================
                BODY
            ================================================= */}

            <div className="ide-body">


                {/* =================================================
                    EXPLORER
                ================================================= */}

                <aside className="ide-explorer">

                    <div className="explorer-header">

                        <span>
                            EXPLORER
                        </span>

                        <div className="explorer-actions">

                            <button
                                className="explorer-add"
                                title="New file"
                                onClick={() => {
                                    setNewName("");
                                    setNewFileOpen(true);
                                    setNewFolderOpen(false);
                                }}
                            >
                                <FaPlus />
                            </button>

                        </div>

                    </div>


                    <div className="ide-project-name">

                        <FaFolder
                            color="#f2c94c"
                        />

                        ALLINONEDEVOPS

                    </div>


                    <div className="tree">

                        {folders.map(
                            renderFolder
                        )}

                        {rootFiles.map(
                            renderFile
                        )}

                    </div>


                    {/* AI CARD */}

                    <div className="ai-partner-card">

                        <div className="ai-partner-avatar">
                            <FaRobot />
                        </div>

                        <div className="ai-partner-title">
                            AI Coding Partner
                        </div>

                        <div className="ai-partner-sub">
                            Intelligent development assistant
                        </div>


                        <button
                            className="quick-action"
                            onClick={() =>
                                aiAction(
                                    "Generate Code"
                                )
                            }
                        >
                            ✨ Generate Code
                        </button>


                        <button
                            className="quick-action"
                            onClick={() =>
                                aiAction(
                                    "Explain Code"
                                )
                            }
                        >
                            💡 Explain Code
                        </button>


                        <button
                            className="quick-action"
                            onClick={() =>
                                aiAction(
                                    "Fix Errors"
                                )
                            }
                        >
                            🔧 Fix Errors
                        </button>


                        <button
                            className="quick-action"
                            onClick={() =>
                                aiAction(
                                    "Improve & Refactor"
                                )
                            }
                        >
                            ✨ Improve & Refactor
                        </button>

                    </div>

                </aside>


                {/* =================================================
                    EDITOR
                ================================================= */}

                <main className="ide-editor-area">

                    {/* TABS */}

                    <div className="ide-tabs">

                        {openFiles.map(
                            (path) => (

                                <div
                                    key={path}
                                    className={
                                        `ide-tab ${
                                            path ===
                                            activePath
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        setActivePath(
                                            path
                                        )
                                    }
                                >

                                    <FileTypeIcon
                                        path={path}
                                    />

                                    <span>
                                        {fileName(
                                            path
                                        )}
                                    </span>


                                    <button
                                        className="tab-close"
                                        onClick={(
                                            event
                                        ) => {

                                            event.stopPropagation();

                                            closeTab(
                                                path
                                            );
                                        }}
                                    >
                                        <FaTimes />
                                    </button>

                                </div>

                            )
                        )}


                        <div className="ide-lang-select">

                            <span
                                className="lang-badge"
                            >
                                {language.label}
                            </span>

                        </div>

                    </div>


                    {/* MONACO */}

                    <div className="editor-pane">

                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={
                                language.id
                            }
                            value={
                                activeFile.content
                            }
                            onChange={
                                updateContent
                            }
                            options={{
                                fontSize: 14,
                                minimap: {
                                    enabled: true,
                                },
                                automaticLayout:
                                    true,
                                smoothScrolling:
                                    true,
                                cursorSmoothCaretAnimation:
                                    "on",
                                scrollBeyondLastLine:
                                    false,
                                wordWrap:
                                    "off",
                                padding: {
                                    top: 15,
                                },
                            }}
                        />

                    </div>


                    {/* BOTTOM PANEL */}

                    <div className="bottom-panel">

                        <div className="bottom-tabs">

                            <span
                                className={
                                    `bottom-tab ${
                                        consoleTab ===
                                        "TERMINAL"
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() =>
                                    setConsoleTab(
                                        "TERMINAL"
                                    )
                                }
                            >
                                TERMINAL
                            </span>


                            <span
                                className={
                                    `bottom-tab ${
                                        consoleTab ===
                                        "OUTPUT"
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() =>
                                    setConsoleTab(
                                        "OUTPUT"
                                    )
                                }
                            >
                                OUTPUT
                            </span>


                            <span
                                className={
                                    `bottom-tab ${
                                        consoleTab ===
                                        "PROBLEMS"
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() =>
                                    setConsoleTab(
                                        "PROBLEMS"
                                    )
                                }
                            >
                                PROBLEMS
                            </span>

                        </div>


                        <div className="bottom-content">

                            <pre className="terminal-line">
                                {output}
                            </pre>

                        </div>

                    </div>

                </main>


                {/* =================================================
                    AI PANEL
                ================================================= */}

                <aside className="ide-ai-panel">

                    <div className="ai-panel-header">

                        <div className="ai-panel-avatar">
                            <FaRobot />
                        </div>

                        <div>

                            <div className="ai-panel-title">
                                AI Assistant
                            </div>

                            <div className="ai-panel-sub">
                                Powered by Qwen2.5 3B
                            </div>

                        </div>

                    </div>


                    <div className="ai-status">

                        <span className="status-dot-sm" />

                        AI Assistant Online

                    </div>


                    <div className="ai-chat">

                        {aiMessages.map(
                            (message, index) => (

                                <div
                                    key={index}
                                    className={
                                        `ai-msg ${
                                            message.from
                                        }`
                                    }
                                >
                                    {message.text}
                                </div>

                            )
                        )}

                    </div>


                    <div className="current-code-block">

                        <div className="current-code-header">

                            <span>
                                Current Code
                            </span>

                            <button
                                className="copy-btn"
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        activeFile.content
                                    )
                                }
                            >
                                Copy
                            </button>

                        </div>


                        <pre className="current-code-body">
                            {activeFile.content}
                        </pre>

                    </div>


                    <div className="quick-actions-title">
                        QUICK ACTIONS
                    </div>


                    <button
                        className="quick-action"
                        onClick={() =>
                            setAiMessages([])
                        }
                    >
                        🧹 Clear Chat
                    </button>


                    <button
                        className="quick-action"
                        onClick={() =>
                            aiAction(
                                "Generate Code"
                            )
                        }
                    >
                        ✨ Generate Code
                    </button>


                    <button
                        className="quick-action"
                        onClick={() =>
                            aiAction(
                                "Explain Selection"
                            )
                        }
                    >
                        💡 Explain Selection
                    </button>


                    <button
                        className="quick-action"
                        onClick={() =>
                            aiAction(
                                "Fix Errors"
                            )
                        }
                    >
                        🔧 Fix Errors
                    </button>


                    <button
                        className="quick-action"
                        onClick={() =>
                            aiAction(
                                "Refactor Code"
                            )
                        }
                    >
                        ✨ Refactor Code
                    </button>


                    <div className="ai-input-row">

                        <input
                            className="ai-input"
                            placeholder="Ask AI anything about your code..."
                            value={
                                aiInput
                            }
                            onChange={(event) =>
                                setAiInput(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {

                                if (
                                    event.key ===
                                    "Enter"
                                ) {

                                    sendAiMessage();
                                }

                            }}
                        />


                        <button
                            className="ai-send"
                            onClick={
                                sendAiMessage
                            }
                        >
                            ➤
                        </button>

                    </div>

                </aside>

            </div>


            {/* =================================================
                NEW FILE MODAL
            ================================================= */}

            {newFileOpen && (

                <div
                    className="modal-backdrop"
                    onClick={() =>
                        setNewFileOpen(false)
                    }
                >

                    <div
                        className="modal-card"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <h2 className="modal-title">
                            Create New File
                        </h2>


                        <label className="modal-label">
                            File path
                        </label>


                        <input
                            ref={newNameRef}
                            className="modal-input"
                            autoFocus
                            placeholder="src/example.py"
                            value={
                                newName
                            }
                            onChange={(event) =>
                                setNewName(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {

                                if (
                                    event.key ===
                                    "Enter"
                                ) {

                                    createFile();
                                }

                            }}
                        />


                        <div className="modal-lang-preview">

                            <FaFile />

                            {newName
                                ? configOf(
                                    newName
                                ).label
                                : "Language detected from extension"}

                        </div>


                        <div className="modal-actions">

                            <button
                                className="btn btn-ghost"
                                onClick={() =>
                                    setNewFileOpen(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="btn btn-violet"
                                onClick={
                                    createFile
                                }
                            >
                                Create File
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                HTML PREVIEW
            ================================================= */}

            {preview && (

                <div className="preview-overlay">

                    <div className="preview-window">

                        <div className="preview-header">

                            <div>

                                <FaGlobe />

                                <span>
                                    Preview
                                </span>

                            </div>


                            <button
                                onClick={() =>
                                    setPreview(
                                        null
                                    )
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>


                        <iframe
                            title="Code Preview"
                            className="preview-frame"
                            srcDoc={
                                preview.content
                            }
                            sandbox="allow-scripts"
                        />

                    </div>

                </div>

            )}

        </div>
    );
}