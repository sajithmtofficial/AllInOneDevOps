import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FilePlus2,
  FileText,
  FolderGit2,
  FolderOpen,
  Loader2,
  Maximize2,
  Minimize2,
  Monitor,
  Play,
  RefreshCw,
  Save,
  Send,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Terminal,
  Trash2,
  Wand2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { executeCode, stopExecution } from "../services/codeExecution";
import { askAssistant } from "../services/ai";
import { getProjects } from "../services/projects";
import { getProjectFiles, saveProjectFiles } from "../services/projectFiles";
import { getApiErrorMessage } from "../utils/apiError";
import {
  buildPreviewDocument,
  createDefaultFiles,
  downloadFile,
  isEditableFileName,
  languageFromName,
  languageLabel,
  loadWorkspace,
  persistWorkspace,
  readFolderEntries,
  templateForLanguage,
} from "../utils/codeWorkspace";

const PROJECT_STORAGE_KEY = "allinone-devops:editor-project:v1";

const WEB_LANGUAGES = new Set(["html", "css", "javascript"]);
const RUNNABLE_LANGUAGES = new Set([
  "python",
  "javascript",
  "java",
  "c",
  "cpp",
]);

const PREVIEW_WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const FILE_COLORS = {
  html: "text-orange-300",
  css: "text-sky-300",
  javascript: "text-yellow-300",
  python: "text-emerald-300",
  java: "text-red-300",
  c: "text-blue-300",
  cpp: "text-indigo-300",
  json: "text-amber-300",
  markdown: "text-slate-200",
};

function FileIcon({ language, size = 13 }) {
  if (language === "css") {
    return (
      <span
        className={`font-mono text-[11px] font-bold ${FILE_COLORS.css}`}
        aria-hidden="true"
      >
        #
      </span>
    );
  }

  if (language === "markdown" || language === "plaintext") {
    return (
      <FileText
        size={size}
        className={FILE_COLORS[language] || "text-slate-400"}
        aria-hidden="true"
      />
    );
  }

  return (
    <FileCode2
      size={size}
      className={FILE_COLORS[language] || "text-violet-300"}
      aria-hidden="true"
    />
  );
}

function ToolbarButton({ title, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default function CodeEditor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const [workspace] = useState(loadWorkspace);
  const [files, setFiles] = useState(workspace.files);
  const [activeId, setActiveId] = useState(workspace.activeId);
  const [savedJson, setSavedJson] = useState(() =>
    JSON.stringify(workspace.files)
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [explorerError, setExplorerError] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [projectRefreshKey, setProjectRefreshKey] = useState(0);
  const [autoSave, setAutoSave] = useState(true);
  const [hasSharedFiles, setHasSharedFiles] = useState(false);

  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [outputTone, setOutputTone] = useState("neutral");

  const [panel, setPanel] = useState("preview");
  const [device, setDevice] = useState("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);

  const [aiInput, setAiInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [correctedCode, setCorrectedCode] = useState("");
  const [typedGreeting, setTypedGreeting] = useState("");

  const outputRef = useRef(null);
  const folderInputRef = useRef(null);
  const codeInputRef = useRef(null);

  const activeFile = useMemo(
    () => files.find((file) => file.id === activeId) || files[0],
    [files, activeId]
  );

  const activeLanguage = languageFromName(activeFile?.name);
  const code = activeFile?.content ?? "";
  const activeLabel = languageLabel(activeLanguage);

  const hasPreview = useMemo(
    () => files.some((file) => languageFromName(file.name) === "html"),
    [files]
  );

  const isDirty = useMemo(
    () => JSON.stringify(files) !== savedJson,
    [files, savedJson]
  );

  const isPreviewAction =
    hasPreview && WEB_LANGUAGES.has(activeLanguage);

  const previewDocument = useMemo(
    () => buildPreviewDocument(files, activeFile?.id),
    [files, activeFile?.id]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(projectId)),
    [projects, projectId]
  );

  useEffect(() => {
    let active = true;

    getProjects()
      .then((data) => {
        if (active) {
          setProjects(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (projectId || projects.length === 0) {
      return;
    }

    let stored = "";

    try {
      stored = window.localStorage.getItem(PROJECT_STORAGE_KEY) || "";
    } catch {
      return;
    }

    if (!stored) {
      return;
    }

    if (!projects.some((project) => String(project.id) === stored)) {
      try {
        window.localStorage.removeItem(PROJECT_STORAGE_KEY);
      } catch {
        // Ignore unavailable storage.
      }
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("project", stored);
    setSearchParams(nextParams, { replace: true });
  }, [projectId, projects, searchParams, setSearchParams]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    try {
      window.localStorage.setItem(PROJECT_STORAGE_KEY, String(projectId));
    } catch {
      // Ignore unavailable storage.
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      return undefined;
    }

    let active = true;
    setProjectLoading(true);
    setProjectError("");
    setExplorerError("");

    const loadProjectFiles = async () => {
      try {
        const data = await getProjectFiles(projectId);
        if (!active) {
          return;
        }

        const serverFiles = (data.files || []).map((file) => ({
          id: `server-${file.id}`,
          name: file.name,
          content: file.content,
        }));

        setHasSharedFiles(serverFiles.length > 0);

        if (serverFiles.length > 0) {
          setFiles(serverFiles);
          setActiveId(serverFiles[0].id);
          setSavedJson(JSON.stringify(serverFiles));
          setPanel(
            serverFiles.some(
              (file) => languageFromName(file.name) === "html"
            )
              ? "preview"
              : "terminal"
          );
        } else {
          const starter = createDefaultFiles();
          setFiles(starter);
          setActiveId(starter[0].id);
          setSavedJson(JSON.stringify(starter));
          setExplorerError(
            "No shared files yet. Save this workspace to add it to the project."
          );
          setPanel("preview");
        }

        setCorrectedCode("");
      } catch (requestError) {
        if (active) {
          setProjectError(getApiErrorMessage(requestError));
        }
      } finally {
        if (active) {
          setProjectLoading(false);
        }
      }
    };

    loadProjectFiles();

    return () => {
      active = false;
    };
  }, [projectId, projectRefreshKey]);

  const updateActiveContent = useCallback(
    (value) => {
      setFiles((previous) =>
        previous.map((file) =>
          file.id === activeFile?.id ? { ...file, content: value } : file
        )
      );
    },
    [activeFile?.id]
  );

  const saveSnapshot = useCallback(
    async (snapshot) => {
      if (projectId) {
        if (projectLoading || savingRef.current) {
          return false;
        }

        savingRef.current = true;
        setSavingWorkspace(true);
        setExplorerError("");

        try {
          await saveProjectFiles(projectId, snapshot);
          setSavedJson(JSON.stringify(snapshot));
          setHasSharedFiles(true);
          setSavedFlash(true);
          return true;
        } catch (requestError) {
          setExplorerError(getApiErrorMessage(requestError));
          return false;
        } finally {
          savingRef.current = false;
          setSavingWorkspace(false);
        }
      }

      if (persistWorkspace(snapshot, activeId)) {
        setSavedJson(JSON.stringify(snapshot));
        setSavedFlash(true);
        setExplorerError("");
        return true;
      }

      setExplorerError("Could not save the workspace in this browser.");
      return false;
    },
    [activeId, projectId, projectLoading]
  );

  const saveWorkspace = useCallback(
    () => saveSnapshot(files),
    [files, saveSnapshot]
  );

  useEffect(() => {
    if (
      !projectId ||
      !autoSave ||
      !isDirty ||
      projectLoading ||
      savingWorkspace
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      saveWorkspace();
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    projectId,
    autoSave,
    isDirty,
    projectLoading,
    savingWorkspace,
    saveWorkspace,
  ]);

  const savingRef = useRef(false);
  const pendingSaveRef = useRef(null);

  useEffect(() => {
    pendingSaveRef.current = { files, projectId, autoSave, isDirty };
  }, [files, projectId, autoSave, isDirty]);

  useEffect(
    () => () => {
      const pending = pendingSaveRef.current;

      if (pending?.projectId && pending.autoSave && pending.isDirty) {
        saveProjectFiles(pending.projectId, pending.files).catch(() => {});
      }
    },
    []
  );

  const handleProjectChange = (event) => {
    const nextId = event.target.value;

    if (
      isDirty &&
      !window.confirm(
        "Switch workspace and discard unsaved changes?"
      )
    ) {
      event.target.value = projectId;
      return;
    }

    setProjectError("");
    setExplorerError("");
    setCorrectedCode("");
    setOutput("");

    const nextParams = new URLSearchParams(searchParams);

    if (nextId) {
      nextParams.set("project", nextId);
      setSearchParams(nextParams, { replace: true });
      return;
    }

    nextParams.delete("project");
    setSearchParams(nextParams, { replace: true });

    try {
      window.localStorage.removeItem(PROJECT_STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }

    const local = loadWorkspace();
    setFiles(local.files);
    setActiveId(local.activeId);
    setSavedJson(JSON.stringify(local.files));
  };

  const reloadProjectFiles = () => {
    if (!projectId) {
      return;
    }

    if (
      isDirty &&
      !window.confirm(
        "Reload shared files and discard unsaved changes?"
      )
    ) {
      return;
    }

    setProjectRefreshKey((value) => value + 1);
  };

  useEffect(() => {
    if (!savedFlash) {
      return undefined;
    }

    const timer = setTimeout(() => setSavedFlash(false), 1800);

    return () => clearTimeout(timer);
  }, [savedFlash]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveWorkspace();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [saveWorkspace]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    if (!editorFullscreen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setEditorFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [editorFullscreen]);

  useEffect(() => {
    if (editorFullscreen) {
      codeInputRef.current?.focus();
    }
  }, [editorFullscreen]);

  useEffect(() => {
    if (!hasPreview && panel === "preview") {
      setPanel("terminal");
    }
  }, [hasPreview, panel]);

  useEffect(() => {
    if (aiBusy) {
      return undefined;
    }

    const message = "May I help you?";
    let index = 0;
    let deleting = false;
    let timer;

    const step = () => {
      if (!deleting) {
        index += 1;
        setTypedGreeting(message.slice(0, index));

        if (index >= message.length) {
          deleting = true;
          timer = setTimeout(step, 2200);
          return;
        }

        timer = setTimeout(step, 90);
        return;
      }

      index -= 1;
      setTypedGreeting(message.slice(0, index));

      if (index <= 0) {
        deleting = false;
        timer = setTimeout(step, 800);
        return;
      }

      timer = setTimeout(step, 45);
    };

    timer = setTimeout(step, 500);

    return () => clearTimeout(timer);
  }, [aiBusy]);

  const selectFile = (file) => {
    setActiveId(file.id);
    setCorrectedCode("");
    setExplorerError("");

    if (
      hasPreview &&
      WEB_LANGUAGES.has(languageFromName(file.name))
    ) {
      setPanel("preview");
    } else {
      setPanel("terminal");
    }
  };

  const createNewFile = (event) => {
    event.preventDefault();

    const name = newFileName.trim().replace(/^\.?\//, "");

    if (!name) {
      return;
    }

    if (!/\.[a-z0-9]+$/i.test(name)) {
      setExplorerError("Add an extension, such as .html or .py.");
      return;
    }

    if (!isEditableFileName(name)) {
      setExplorerError("That file type is not supported in the editor.");
      return;
    }

    if (files.some((file) => file.name.toLowerCase() === name.toLowerCase())) {
      setExplorerError("A file with that name already exists.");
      return;
    }

    const language = languageFromName(name);
    const file = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      content: templateForLanguage(language),
    };

    const nextFiles = [...files, file];

    setFiles(nextFiles);
    setActiveId(file.id);
    setNewFileName("");
    setCreatingFile(false);
    setExplorerError("");
    setCorrectedCode("");
    setPanel(
      language === "html" || (hasPreview && WEB_LANGUAGES.has(language))
        ? "preview"
        : "terminal"
    );

    if (projectId && autoSave) {
      saveSnapshot(nextFiles);
    }
  };

  const deleteFile = (file) => {
    if (files.length === 1) {
      setExplorerError("Keep at least one file in the workspace.");
      return;
    }

    if (!window.confirm(`Delete ${file.name}?`)) {
      return;
    }

    const remaining = files.filter((item) => item.id !== file.id);

    setFiles(remaining);

    if (file.id === activeId) {
      setActiveId(remaining[0].id);
    }

    setCorrectedCode("");
    setExplorerError("");

    if (projectId && autoSave) {
      saveSnapshot(remaining);
    }
  };

  const handleFolderChange = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (selected.length === 0) {
      return;
    }

    if (
      isDirty &&
      !window.confirm(
        "Open this folder and replace the current workspace? Unsaved changes will be lost."
      )
    ) {
      return;
    }

    const loaded = await readFolderEntries(selected);

    if (loaded.length === 0) {
      setExplorerError(
        "No supported text files were found. Try HTML, CSS, JS, Python, Java, C or C++ files."
      );
      return;
    }

    const first =
      loaded.find((file) => languageFromName(file.name) === "html") ||
      loaded[0];

    setFiles(loaded);
    setActiveId(first.id);
    setCorrectedCode("");
    setExplorerError("");
    setPanel(languageFromName(first.name) === "html" ? "preview" : "terminal");
  };

  const handleDownload = () => {
    if (!activeFile) {
      return;
    }

    downloadFile(activeFile.name, activeFile.content);
  };

  const runInContainer = async () => {
    if (
      running ||
      !code.trim() ||
      !RUNNABLE_LANGUAGES.has(activeLanguage)
    ) {
      return;
    }

    setPanel("terminal");
    setRunning(true);
    setOutput("Running...\n");
    setOutputTone("neutral");

    const result = await executeCode({
      language: activeLanguage,
      code,
      stdin,
    });

    const parts = [];

    if (result.stdout) {
      parts.push(result.stdout);
    }

    if (result.stderr) {
      parts.push(result.stderr);
    }

    if (parts.length === 0) {
      parts.push("(the program produced no output)");
    }

    parts.push(`\n[exit code: ${result.returncode ?? "?"}]`);

    setOutput(parts.join("\n"));
    setOutputTone(result.success ? "success" : "error");
    setRunning(false);
  };

  const handleRun = async () => {
    if (running) {
      return;
    }

    if (isPreviewAction) {
      setPanel("preview");
      setPreviewKey((key) => key + 1);
      return;
    }

    if (!RUNNABLE_LANGUAGES.has(activeLanguage)) {
      setPanel("terminal");
      setOutputTone("neutral");
      setOutput(
        "Add an HTML file to the workspace, then open the Preview tab to view your page."
      );
      return;
    }

    await runInContainer();
  };

  const handleStop = async () => {
    const result = await stopExecution();

    setOutput(
      (output ? `${output}\n\n` : "") +
        (result.message || result.error || "Stop requested.")
    );
    setOutputTone("error");
    setRunning(false);
  };

  const handleEditorKeyDown = (event) => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${code.slice(0, start)}  ${code.slice(end)}`;

    updateActiveContent(next);

    requestAnimationFrame(() => {
      target.selectionStart = start + 2;
      target.selectionEnd = start + 2;
    });
  };

  const openPreviewWindow = () => {
    if (!previewDocument) {
      return;
    }

    const previewBlob = new Blob([previewDocument], { type: "text/html" });
    const previewUrl = URL.createObjectURL(previewBlob);
    const backUrl = window.location.href
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const shell = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Preview</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0b1022; overflow: hidden; }
    iframe { position: fixed; inset: 0; width: 100%; height: 100%; border: 0; background: #fff; }
    .preview-back {
      position: fixed; left: 16px; top: 16px; z-index: 2147483647;
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 14px; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(11, 16, 34, 0.9); color: #fff;
      font: 600 12px/1 system-ui, sans-serif; text-decoration: none;
      box-shadow: 0 8px 24px rgba(2, 6, 23, 0.35);
      backdrop-filter: blur(8px);
    }
    .preview-back:hover { background: rgba(124, 58, 237, 0.92); }
  </style>
</head>
<body>
  <a class="preview-back" href="${backUrl}">&#8592; Back to editor</a>
  <iframe src="${previewUrl}" sandbox="allow-scripts allow-forms allow-modals allow-popups"></iframe>
</body>
</html>`;

    const shellBlob = new Blob([shell], { type: "text/html" });
    const shellUrl = URL.createObjectURL(shellBlob);

    window.open(shellUrl, "_blank", "noopener,noreferrer");

    window.setTimeout(() => {
      URL.revokeObjectURL(shellUrl);
      URL.revokeObjectURL(previewUrl);
    }, 60000);
  };

  const toggleEditorFullscreen = () => {
    setEditorFullscreen((value) => !value);
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      // Clipboard access denied — ignore.
    }
  };

  const askAI = async (action, message) => {
    const text = (message ?? aiInput).trim();

    if (!text && !code.trim()) {
      return;
    }

    setAiBusy(true);
    setCorrectedCode("");
    setAiMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        content:
          text ||
          {
            fix: "Fix the errors in my code.",
            generate: "Generate code for me.",
            refactor: "Refactor my code.",
            explain: "Explain my code.",
          }[action] ||
          "Help me with my code.",
      },
    ]);

    if (action !== "chat") {
      setAiInput("");
    }

    try {
      const data = await askAssistant({
        message: text,
        code,
        language: activeLanguage,
        action,
        terminalOutput: output,
      });

      setAiMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: data.reply || "Done.",
          model: data.model,
        },
      ]);

      if (data.corrected_code) {
        setCorrectedCode(data.corrected_code);
      }
    } catch (requestError) {
      setAiMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            requestError.message ||
            "The AI assistant is unavailable right now. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div
      className={`relative isolate ${
        editorFullscreen ? "z-[70]" : ""
      }`}
    >
      <div className="ai-bg-gradient" aria-hidden="true" />

      <div className="ai-roam-layer" aria-hidden="true">
        <div className="ai-roam-robot">
          <span className="ai-roam-glow" />
          <img src="/robot-ai.png?v=2" alt="" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
            Development
          </p>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
            Code Editor
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">
            Build web pages with a live preview, or run Python, JavaScript,
            Java, C and C++ in isolated containers with AI assistance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#11162b] px-3 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <FolderGit2 size={13} className="text-violet-300" />
            Workspace
          </span>
          <select
            value={projectId}
            onChange={handleProjectChange}
            disabled={projectLoading || savingWorkspace}
            aria-label="Project workspace"
            className="h-9 min-w-0 max-w-full flex-1 rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-200 outline-none transition focus:border-violet-500/50 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xs"
          >
            <option value="">Local browser workspace</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {projectLoading && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Loader2 size={11} className="animate-spin" />
              Loading shared files...
            </span>
          )}
          {!projectLoading && projectId && selectedProject && (
            <span className="text-[10px] text-slate-500">
              {selectedProject.owner_username
                ? `Owner: ${selectedProject.owner_username}`
                : "Workspace project"}
            </span>
          )}
          {!projectId && !projectLoading && (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300"
              title="Files created here stay in this browser. Pick a project from the dropdown to save changes to shared history."
            >
              <AlertCircle size={11} />
              Local workspace, not saved to project history
            </span>
          )}
          {projectError && (
            <span className="inline-flex items-center gap-1 text-[10px] text-red-300">
              <AlertCircle size={11} />
              {projectError}
            </span>
          )}
          {projectId && (
            <button
              type="button"
              onClick={reloadProjectFiles}
              disabled={projectLoading || savingWorkspace}
              title="Reload shared files"
              aria-label="Reload shared files"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw
                size={12}
                className={projectLoading ? "animate-spin" : ""}
              />
            </button>
          )}
          {projectId && (
            <button
              type="button"
              onClick={() => setAutoSave((value) => !value)}
              aria-pressed={autoSave}
              title={
                autoSave
                  ? "Auto-save is on: edits are saved to the shared project after you stop typing."
                  : "Auto-save is off: use Ctrl+S or the save button."
              }
              className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[10px] font-semibold transition ${
                autoSave
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                  : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Activity size={11} />
              Auto-save {autoSave ? "on" : "off"}
            </button>
          )}
          <Link
            to={
              projectId
                ? `/projects?edit=${projectId}`
                : "/projects"
            }
            className="ml-auto text-[10px] font-semibold text-violet-300 transition hover:text-violet-200"
          >
            {projectId ? "Project settings" : "Manage projects"}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#11162b] px-3 py-2.5">
          <button
            type="button"
            onClick={handleRun}
            disabled={running || (!isPreviewAction && !code.trim())}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-4 text-xs font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {running ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPreviewAction ? (
              <Eye size={14} />
            ) : (
              <Play size={14} />
            )}
            {running ? "Running..." : isPreviewAction ? "Preview" : "Run"}
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!running}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 text-xs font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Square size={13} />
            Stop
          </button>
          <button
            type="button"
            onClick={toggleEditorFullscreen}
            aria-pressed={editorFullscreen}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            {editorFullscreen ? (
              <Minimize2 size={14} />
            ) : (
              <Maximize2 size={14} />
            )}
            <span className="hidden sm:inline">
              {editorFullscreen ? "Exit full screen" : "Full screen"}
            </span>
          </button>

          <p className="hidden items-center gap-1.5 text-[10px] text-slate-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {activeFile?.name || "Untitled"} · {activeLabel}
          </p>

          <button
            type="button"
            onClick={() => setAiOpen((value) => !value)}
            aria-pressed={aiOpen}
            className={`ml-auto inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold ring-1 transition ${
              aiOpen
                ? "bg-violet-500/15 text-violet-200 ring-violet-400/25"
                : "bg-white/[0.03] text-slate-300 ring-white/[0.08] hover:bg-white/[0.06]"
            }`}
          >
            <Sparkles size={14} />
            AI Assistant
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                aiOpen ? "bg-emerald-400" : "bg-slate-600"
              }`}
            />
          </button>
        </div>

        <div
          className={`grid gap-4 ${
            aiOpen
              ? "xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]"
              : "grid-cols-1"
          }`}
        >
          <section
            className={`code-editor-shell min-w-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#11162b] ${
              editorFullscreen ? "is-expanded" : ""
            }`}
          >
            <div className="code-editor-body flex min-h-[620px] flex-col md:flex-row">
              <aside className="code-editor-explorer flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-[#0d1224] md:w-[196px] md:border-b-0 md:border-r">
                <div className="flex items-center justify-between gap-1 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Explorer
                  </p>
                  <div className="flex items-center gap-0.5">
                    <ToolbarButton
                      title="New file"
                      onClick={() => {
                        setCreatingFile((value) => !value);
                        setExplorerError("");
                      }}
                    >
                      <FilePlus2 size={13} />
                    </ToolbarButton>
                    <ToolbarButton
                      title="Open folder"
                      onClick={() => folderInputRef.current?.click()}
                    >
                      <FolderOpen size={13} />
                    </ToolbarButton>
                    <ToolbarButton
                      title={
                        projectId
                          ? "Save shared project (Ctrl+S)"
                          : "Save workspace (Ctrl+S)"
                      }
                      onClick={saveWorkspace}
                      disabled={savingWorkspace || projectLoading}
                    >
                      {savingWorkspace ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                    </ToolbarButton>
                  </div>
                </div>

                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  {...{ webkitdirectory: "", directory: "" }}
                  onChange={handleFolderChange}
                  className="hidden"
                />

                {creatingFile && (
                  <form
                    onSubmit={createNewFile}
                    className="border-b border-white/[0.06] p-2"
                  >
                    <input
                      autoFocus
                      value={newFileName}
                      onChange={(event) => setNewFileName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setCreatingFile(false);
                          setNewFileName("");
                        }
                      }}
                      placeholder="about.html"
                      aria-label="New file name"
                      className="h-8 w-full rounded-md border border-white/[0.08] bg-[#0b1022] px-2 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-violet-500/50"
                    />
                    <div className="mt-1.5 flex gap-1">
                      <button
                        type="submit"
                        className="h-7 flex-1 rounded-md bg-violet-500/20 text-[10px] font-semibold text-violet-200 transition hover:bg-violet-500/30"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingFile(false);
                          setNewFileName("");
                        }}
                        className="h-7 flex-1 rounded-md bg-white/[0.05] text-[10px] font-semibold text-slate-400 transition hover:bg-white/[0.08]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="max-h-[190px] flex-1 overflow-y-auto px-1.5 py-1.5 md:max-h-none">
                  {files.map((file) => {
                    const language = languageFromName(file.name);
                    const active = file.id === activeId;

                    return (
                      <div
                        key={file.id}
                        className={`group flex items-center gap-1 rounded-md px-1.5 transition ${
                          active
                            ? "bg-violet-500/15 ring-1 ring-inset ring-violet-400/20"
                            : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => selectFile(file)}
                          className={`flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-[11px] ${
                            active
                              ? "text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <FileIcon language={language} />
                          <span className="truncate">{file.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFile(file)}
                          title={`Delete ${file.name}`}
                          aria-label={`Delete ${file.name}`}
                          className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-600 opacity-100 transition hover:bg-red-500/15 hover:text-red-300 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/[0.06] px-3 py-2 text-[10px]">
                  {explorerError ? (
                    <p className="leading-relaxed text-red-300">
                      {explorerError}
                    </p>
                  ) : savedFlash ? (
                    <p className="flex items-center gap-1 text-emerald-300">
                      <Check size={10} />
                      {projectId ? "Saved to shared project" : "Workspace saved"}
                    </p>
                  ) : isDirty ? (
                    <p className="flex items-center gap-1 text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {projectId && autoSave
                        ? "Auto-saving changes..."
                        : "Unsaved changes"}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-slate-500">
                      <Check size={10} />
                      {projectId
                        ? hasSharedFiles
                          ? "Shared project up to date"
                          : "No shared files yet"
                        : "Saved locally"}
                    </p>
                  )}
                </div>
              </aside>

              <div className="code-editor-main flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-[#0f1428] px-3 py-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-[#0b1022] px-2 py-1">
                    <FileIcon language={activeLanguage} size={12} />
                    <span className="truncate text-[11px] font-medium text-slate-200">
                      {activeFile?.name || "Untitled"}
                    </span>
                    {isDirty && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                        title="Unsaved changes"
                      />
                    )}
                  </span>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {activeLabel}
                  </span>
                  <span className="hidden text-[10px] text-slate-600 sm:inline">
                    {code.split("\n").length} lines
                  </span>

                  <div className="ml-auto flex items-center gap-0.5">
                    <ToolbarButton
                      title={isPreviewAction ? "Open preview" : "Run code"}
                      onClick={handleRun}
                      disabled={
                        running || (!isPreviewAction && !code.trim())
                      }
                    >
                      {isPreviewAction ? (
                        <Eye size={13} />
                      ) : (
                        <Play size={13} />
                      )}
                    </ToolbarButton>
                    <ToolbarButton
                      title="Stop execution"
                      onClick={handleStop}
                      disabled={!running}
                    >
                      <Square size={12} />
                    </ToolbarButton>
                    <ToolbarButton
                      title={
                        editorFullscreen
                          ? "Exit full screen"
                          : "Full screen editor"
                      }
                      onClick={toggleEditorFullscreen}
                    >
                      {editorFullscreen ? (
                        <Minimize2 size={13} />
                      ) : (
                        <Maximize2 size={13} />
                      )}
                    </ToolbarButton>
                    <ToolbarButton
                      title={
                        projectId
                          ? "Save shared project (Ctrl+S)"
                          : "Save workspace (Ctrl+S)"
                      }
                      onClick={saveWorkspace}
                      disabled={savingWorkspace || projectLoading}
                    >
                      {savingWorkspace ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                    </ToolbarButton>
                    <ToolbarButton
                      title="Download file"
                      onClick={handleDownload}
                    >
                      <Download size={13} />
                    </ToolbarButton>
                  </div>
                </div>

                <textarea
                  ref={codeInputRef}
                  value={code}
                  onChange={(event) => updateActiveContent(event.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  spellCheck={false}
                  aria-label="Source code"
                  className="code-editor-textarea h-[340px] w-full resize-y bg-[#0b1022] p-4 font-mono text-[12px] leading-relaxed text-slate-200 outline-none"
                />

                {RUNNABLE_LANGUAGES.has(activeLanguage) && (
                  <div className="border-t border-white/[0.06] px-3 py-2.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Standard input (optional)
                    </p>
                    <input
                      value={stdin}
                      onChange={(event) => setStdin(event.target.value)}
                      placeholder="stdin passed to your program..."
                      className="h-9 w-full rounded-lg border border-white/[0.07] bg-[#0b1022] px-3 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-violet-500/50"
                    />
                  </div>
                )}

                <div className="code-editor-panel mt-auto border-t border-white/[0.06]">
                  <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setPanel("preview")}
                      disabled={!hasPreview}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                        panel === "preview"
                          ? "bg-violet-500/15 text-violet-200"
                          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <Eye size={11} />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanel("terminal")}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                        panel === "terminal"
                          ? "bg-violet-500/15 text-violet-200"
                          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      <Terminal size={11} />
                      Terminal
                    </button>

                    <div className="ml-auto flex items-center gap-0.5">
                      {panel === "preview" ? (
                        <>
                          <ToolbarButton
                            title="Desktop preview"
                            onClick={() => setDevice("desktop")}
                          >
                            <Monitor
                              size={12}
                              className={
                                device === "desktop"
                                  ? "text-violet-300"
                                  : undefined
                              }
                            />
                          </ToolbarButton>
                          <ToolbarButton
                            title="Tablet preview"
                            onClick={() => setDevice("tablet")}
                          >
                            <Tablet
                              size={12}
                              className={
                                device === "tablet"
                                  ? "text-violet-300"
                                  : undefined
                              }
                            />
                          </ToolbarButton>
                          <ToolbarButton
                            title="Mobile preview"
                            onClick={() => setDevice("mobile")}
                          >
                            <Smartphone
                              size={12}
                              className={
                                device === "mobile"
                                  ? "text-violet-300"
                                  : undefined
                              }
                            />
                          </ToolbarButton>
                          <ToolbarButton
                            title="Refresh preview"
                            onClick={() => setPreviewKey((key) => key + 1)}
                          >
                            <RefreshCw size={12} />
                          </ToolbarButton>
                          <ToolbarButton
                            title="Open preview in a new tab"
                            onClick={openPreviewWindow}
                          >
                            <ExternalLink size={12} />
                          </ToolbarButton>
                        </>
                      ) : (
                        <>
                          {RUNNABLE_LANGUAGES.has(activeLanguage) && (
                            <button
                              type="button"
                              onClick={runInContainer}
                              disabled={running || !code.trim()}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Play size={10} />
                              Run
                            </button>
                          )}
                          {output && (
                            <button
                              type="button"
                              onClick={copyOutput}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                            >
                              <Copy size={11} />
                              Copy
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {panel === "preview" ? (
                    hasPreview ? (
                      <div className="bg-[#070b16] p-3">
                        <div
                          className="mx-auto overflow-hidden rounded-lg border border-white/10 bg-white shadow-2xl transition-[width] duration-300"
                          style={{
                            width: PREVIEW_WIDTHS[device],
                            maxWidth: "100%",
                          }}
                        >
                          <iframe
                            key={previewKey}
                            srcDoc={previewDocument}
                            title="HTML preview"
                            sandbox="allow-scripts allow-forms allow-modals allow-popups"
                            className="code-editor-preview h-[300px] w-full border-0 bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid h-[300px] place-items-center bg-[#0b1022] px-6 text-center text-[11px] leading-relaxed text-slate-500">
                        Add an HTML file to the workspace to preview your page.
                      </div>
                    )
                  ) : (
                    <pre
                      ref={outputRef}
                      className={`code-editor-terminal h-[300px] overflow-auto bg-[#0b1022] p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap ${
                        outputTone === "error"
                          ? "text-red-300"
                          : outputTone === "success"
                            ? "text-emerald-200"
                            : "text-slate-300"
                      }`}
                    >
                      {output ||
                        "> Output will appear here after you run your code."}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </section>

          {aiOpen && (
            <section className="flex max-h-[820px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#11162b]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <span
                className={
                  aiBusy ? "ai-robot-avatar is-thinking" : "ai-robot-avatar"
                }
                aria-hidden="true"
              >
                <img src="/robot-ai.png?v=2" alt="" />
              </span>
              <p className="text-xs font-semibold text-white">AI Assistant</p>
              <span className="ml-auto rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Local AI
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] px-3 py-2.5">
              <button
                type="button"
                onClick={() => askAI("fix")}
                disabled={aiBusy}
                className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-red-300 ring-1 ring-red-400/15 transition hover:bg-red-500/15 disabled:opacity-50"
              >
                <Wand2 size={11} />
                Fix code
              </button>
              <button
                type="button"
                onClick={() => askAI("explain")}
                disabled={aiBusy}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-blue-300 ring-1 ring-blue-400/15 transition hover:bg-blue-500/15 disabled:opacity-50"
              >
                <Sparkles size={11} />
                Explain
              </button>
              <button
                type="button"
                onClick={() => askAI("refactor")}
                disabled={aiBusy}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/15 transition hover:bg-emerald-500/15 disabled:opacity-50"
              >
                <Check size={11} />
                Refactor
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {aiMessages.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
                  <div
                    className={
                      aiBusy ? "ai-robot-hero is-thinking" : "ai-robot-hero"
                    }
                  >
                    <span className="ai-robot-aura" aria-hidden="true" />
                    <img
                      src="/robot-ai.png?v=2"
                      alt="AI assistant robot"
                      className="ai-robot-image"
                    />
                    <span className="ai-robot-scan" aria-hidden="true" />
                    <span className="ai-robot-orbit" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>

                  <div
                    className={
                      aiBusy
                        ? "ai-robot-bubble is-thinking"
                        : "ai-robot-bubble"
                    }
                    role="status"
                    aria-live="polite"
                  >
                    <span>{aiBusy ? "Let me think" : typedGreeting}</span>
                    {aiBusy ? (
                      <span className="ai-robot-dots" aria-hidden="true">
                        <i></i>
                        <i></i>
                        <i></i>
                      </span>
                    ) : (
                      <span className="ai-robot-caret" aria-hidden="true" />
                    )}
                  </div>

                  <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
                    Ask a question about your code, or use Fix / Explain /
                    Refactor. Corrected code can be applied to the editor with
                    one click.
                  </p>
                </div>
              )}

              {aiMessages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${
                    message.role === "user"
                      ? "bg-violet-500/10 text-violet-100 ring-1 ring-violet-400/15"
                      : message.isError
                        ? "bg-red-500/[0.07] text-red-200 ring-1 ring-red-400/15"
                        : "bg-white/[0.03] text-slate-300 ring-1 ring-white/[0.05]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.model && (
                    <p className="mt-1.5 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                      {message.model}
                    </p>
                  )}
                </div>
              ))}

              {aiBusy && (
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[11px] text-slate-400 ring-1 ring-white/[0.05]">
                  <Loader2 size={12} className="animate-spin text-violet-300" />
                  Thinking...
                </div>
              )}

              {correctedCode && (
                <div className="overflow-hidden rounded-xl border border-emerald-400/20 bg-emerald-500/[0.05]">
                  <div className="flex items-center justify-between border-b border-emerald-400/15 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                      Corrected code
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        updateActiveContent(correctedCode);
                        setCorrectedCode("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
                    >
                      Apply to editor
                    </button>
                  </div>
                  <pre className="max-h-64 overflow-auto bg-[#0b1022] p-3 font-mono text-[10px] leading-relaxed text-emerald-100">
                    {correctedCode}
                  </pre>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={aiInput}
                  onChange={(event) => setAiInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      askAI("chat");
                    }
                  }}
                  rows={2}
                  placeholder="Ask about your code... (Enter to send)"
                  className="min-h-[52px] flex-1 resize-none rounded-xl border border-white/[0.08] bg-[#0b1022] px-3 py-2 text-[11px] leading-relaxed text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
                />
                <button
                  type="button"
                  onClick={() => askAI("chat")}
                  disabled={aiBusy}
                  aria-label="Send message to AI assistant"
                  className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-[0_12px_25px_-14px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                <AlertCircle size={10} />
                AI responses are generated by a local model.{" "}
                <Link
                  to="/ai-assistant"
                  className="font-semibold text-violet-300 transition hover:text-violet-200"
                >
                  Open full assistant →
                </Link>
              </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
