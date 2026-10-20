import { useEffect, useState } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";

const emptyProject = {
  name: "",
  description: "",
  language: "",
  github_url: "",
  branch: "main",
};

const languages = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Other",
];

export default function ProjectModal({
  open,
  project,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyProject);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({ ...emptyProject, ...(project || {}) });
    setValidationError("");
  }, [open, project]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, onClose]);

  if (!open) {
    return null;
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setValidationError("Project name is required.");
      return;
    }

    if (!form.description.trim()) {
      setValidationError("Description is required.");
      return;
    }

    if (!form.language.trim()) {
      setValidationError("Choose a language for this project.");
      return;
    }

    setValidationError("");
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      language: form.language.trim(),
      github_url: form.github_url.trim(),
      branch: form.branch.trim() || "main",
    });
  };

  const message = validationError || error;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#030617]/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/[0.08] bg-[#11162b] p-5 shadow-2xl shadow-black/60 sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400">
              {project ? "Update project" : "New project"}
            </p>
            <h2
              id="project-modal-title"
              className="mt-1.5 text-xl font-semibold tracking-tight text-white"
            >
              {project ? "Edit project" : "Create project"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {project
                ? "Changes are saved directly to the Django API."
                : "Add a project to your Django workspace."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close project form"
          >
            <X size={17} />
          </button>
        </div>

        {message && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.07] px-3.5 py-3"
          >
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-red-400"
            />
            <p className="text-[11px] leading-relaxed text-red-200">
              {message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
              Project name
            </span>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. Expense Tracker"
              autoFocus
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="What does this project do?"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 py-3 text-sm leading-relaxed text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Language
              </span>
              <select
                value={form.language}
                onChange={(event) =>
                  updateField("language", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-sm text-white outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
              >
                <option value="" className="bg-[#0b1022]">
                  Select language
                </option>
                {languages.map((language) => (
                  <option
                    key={language}
                    value={language}
                    className="bg-[#0b1022]"
                  >
                    {language}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Branch
              </span>
              <input
                value={form.branch}
                onChange={(event) =>
                  updateField("branch", event.target.value)
                }
                placeholder="main"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
              GitHub repository
              <span className="ml-1 text-slate-600">(optional)</span>
            </span>
            <input
              type="url"
              value={form.github_url}
              onChange={(event) =>
                updateField("github_url", event.target.value)
              }
              placeholder="https://github.com/owner/repository"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving
                ? "Saving..."
                : project
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
