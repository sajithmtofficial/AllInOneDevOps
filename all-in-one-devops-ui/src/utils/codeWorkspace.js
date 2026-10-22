const STORAGE_KEY = "allinone-devops:code-workspace:v1";

const MAX_FILE_BYTES = 256 * 1024;
const MAX_FOLDER_FILES = 80;

const LANGUAGE_LABELS = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  c: "C",
  cpp: "C++",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  markdown: "Markdown",
  plaintext: "Text",
};

const EXTENSION_LANGUAGE = {
  py: "python",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "javascript",
  tsx: "javascript",
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
  markdown: "markdown",
  txt: "plaintext",
  text: "plaintext",
  csv: "plaintext",
  xml: "plaintext",
  svg: "plaintext",
};

const EDITABLE_EXTENSIONS = new Set(Object.keys(EXTENSION_LANGUAGE));

const TEMPLATES = {
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My First Page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="card">
      <span class="badge">Live Preview</span>
      <h1>Hello, World!</h1>
      <p>Edit the files in the explorer and watch this page update.</p>
      <button id="greet">Say hello</button>
      <p id="message" class="message"></p>
    </main>
    <script src="script.js"></script>
  </body>
</html>
`,
  css: `:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  background: radial-gradient(circle at 20% 20%, #1e1b4b, #080b16 65%);
  color: #e2e8f0;
}

.card {
  width: min(100%, 420px);
  padding: 36px 32px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 30px 80px -30px rgba(59, 130, 246, 0.55);
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.16);
  color: #93c5fd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  margin: 16px 0 8px;
  font-size: 34px;
  line-height: 1.1;
}

p {
  margin: 0 0 20px;
  color: #94a3b8;
  line-height: 1.6;
}

button {
  padding: 10px 20px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px -14px rgba(124, 58, 237, 0.9);
}

.message {
  min-height: 1.4em;
  margin: 18px 0 0;
  color: #7dd3fc;
  font-weight: 600;
}
`,
  javascript: `const button = document.getElementById("greet");
const message = document.getElementById("message");

const greetings = [
  "Hello there!",
  "Welcome aboard!",
  "Nice to meet you!",
];

let index = 0;

button?.addEventListener("click", () => {
  message.textContent = greetings[index % greetings.length];
  index += 1;
});
`,
  python: 'print("Hello, World!")\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
  json: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}\n',
  markdown: "# My Project\n\nWrite your notes here.\n",
  plaintext: "",
};

export function languageFromName(name = "") {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";

  return EXTENSION_LANGUAGE[extension] || "plaintext";
}

export function languageLabel(language) {
  return LANGUAGE_LABELS[language] || "Text";
}

export function templateForLanguage(language) {
  return TEMPLATES[language] ?? "";
}

export function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createFile(name, content) {
  return { id: createId(), name, content };
}

export function createDefaultFiles() {
  return [
    createFile("index.html", TEMPLATES.html),
    createFile("styles.css", TEMPLATES.css),
    createFile("script.js", TEMPLATES.javascript),
    createFile("main.py", TEMPLATES.python),
  ];
}

export function loadWorkspace() {
  const fallback = createDefaultFiles();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed?.files) && parsed.files.length > 0) {
        const files = parsed.files
          .filter(
            (file) =>
              file &&
              typeof file.name === "string" &&
              typeof file.content === "string"
          )
          .map((file) => ({
            id: file.id || createId(),
            name: file.name,
            content: file.content,
          }));

        if (files.length > 0) {
          const active =
            files.find((file) => file.name === parsed.activeName) || files[0];

          return { files, activeId: active.id };
        }
      }
    }
  } catch {
    // Ignore malformed or unavailable local storage.
  }

  return { files: fallback, activeId: fallback[0].id };
}

export function persistWorkspace(files, activeId) {
  const active = files.find((file) => file.id === activeId);

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        files,
        activeName: active?.name || files[0]?.name || "",
      })
    );

    return true;
  } catch {
    return false;
  }
}

export function isEditableFileName(name) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";

  return EDITABLE_EXTENSIONS.has(extension);
}

export async function readFolderEntries(fileList) {
  const entries = Array.from(fileList || []).filter(
    (file) => isEditableFileName(file.name) && file.size <= MAX_FILE_BYTES
  );

  const sliced = entries.slice(0, MAX_FOLDER_FILES);
  const loaded = [];

  for (const file of sliced) {
    try {
      loaded.push(
        createFile(
          file.webkitRelativePath || file.name,
          await file.text()
        )
      );
    } catch {
      // Skip files that cannot be read as text.
    }
  }

  loaded.sort((left, right) => {
    const leftIsIndex = /(^|\/)index\.html?$/i.test(left.name);
    const rightIsIndex = /(^|\/)index\.html?$/i.test(right.name);

    if (leftIsIndex && !rightIsIndex) {
      return -1;
    }

    if (!leftIsIndex && rightIsIndex) {
      return 1;
    }

    return left.name.localeCompare(right.name);
  });

  return loaded;
}

function findLocalFile(files, reference) {
  if (!reference || /^(https?:)?\/\//i.test(reference)) {
    return null;
  }

  const clean = reference.split(/[?#]/)[0].replace(/^\.\//, "");

  return (
    files.find((file) => file.name === clean) ||
    files.find((file) => file.name.endsWith(`/${clean}`)) ||
    files.find(
      (file) =>
        file.name.split("/").pop() === clean.split("/").pop()
    ) ||
    null
  );
}

function inlineScript(file, tag = "") {
  const type = /type\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
  const typeAttribute = type ? ` type="${type}"` : "";

  return `<script${typeAttribute}>\n${file.content.replace(
    /<\/script/gi,
    "<\\/script"
  )}\n</script>`;
}

function inlineStyle(file) {
  return `<style data-file="${file.name}">\n${file.content}\n</style>`;
}

export function buildPreviewDocument(files, activeId) {
  const active = files.find((file) => file.id === activeId);

  const htmlFile =
    (active && languageFromName(active.name) === "html" && active) ||
    files.find((file) => /(^|\/)index\.html?$/i.test(file.name)) ||
    files.find((file) => languageFromName(file.name) === "html");

  if (!htmlFile) {
    return "";
  }

  let markup = htmlFile.content;
  const linkedStyles = new Set();

  markup = markup.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const file = findLocalFile(files, href);

    if (file && languageFromName(file.name) === "css") {
      linkedStyles.add(file.id);

      return inlineStyle(file);
    }

    return tag;
  });

  if (linkedStyles.size === 0) {
    const styles = files.filter(
      (file) => languageFromName(file.name) === "css"
    );

    if (styles.length > 0) {
      const block = styles.map(inlineStyle).join("\n");

      markup = markup.includes("</head>")
        ? markup.replace("</head>", `${block}\n</head>`)
        : `${block}\n${markup}`;
    }
  }

  markup = markup.replace(
    /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (tag, source) => {
      const file = findLocalFile(files, source);

      return file ? inlineScript(file, tag) : tag;
    }
  );

  return markup;
}

export function downloadFile(name, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = name.split("/").pop() || "file.txt";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
