import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  ExternalLink,
  FolderGit2,
  FolderPlus,
  GitBranch,
  Languages,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import ProjectModal from "../components/ProjectModal";
import { GitHubIcon } from "../components/icons";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../services/projects";
import { formatDate } from "../utils/format";
import { getApiErrorMessage } from "../utils/apiError";

function sortByNewest(projects) {
  return [...projects].sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime()
  );
}

function SummaryCard({ icon: IconComponent, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#11162b] px-4 py-3.5">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${accent}`}
      >
        <IconComponent size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none text-white">{value}</p>
        <p className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function ProjectCard({ project, deleting, onEdit, onDelete }) {
  return (
    <article
      className={`card-glow flex min-w-0 flex-col rounded-2xl border border-white/[0.06] bg-[#11162b] p-5 transition ${
        deleting ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
          <Code2 size={19} />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>

      <h3 className="mt-4 truncate text-[15px] font-semibold text-white">
        {project.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 min-h-[34px] text-xs leading-relaxed text-slate-400">
        {project.description || "No description provided."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/[0.08] px-2 py-1 text-[10px] font-medium text-blue-300 ring-1 ring-blue-400/10">
          <Code2 size={11} />
          {project.language || "Unknown"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-slate-400 ring-1 ring-white/[0.06]">
          <GitBranch size={11} />
          {project.branch || "main"}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <span className="min-w-0 truncate text-[10px] text-slate-500">
          Created {formatDate(project.created_at)}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noreferrer"
              title="Open GitHub repository"
              aria-label={`Open ${project.name} on GitHub`}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
            >
              <GitHubIcon size={15} />
            </a>
          )}
          <button
            type="button"
            onClick={() => onEdit(project)}
            title="Edit project"
            aria-label={`Edit ${project.name}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(project)}
            disabled={deleting}
            title="Delete project"
            aria-label={`Delete ${project.name}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const loadProjects = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const data = await getProjects(signal);
      setProjects(Array.isArray(data) ? data : []);
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }

      setError(getApiErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProjects(controller.signal);

    return () => controller.abort();
  }, [loadProjects]);

  useEffect(() => {
    if (searchParams.get("new") !== "1") {
      return;
    }

    setEditing(null);
    setModalError("");
    setModalOpen(true);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("new");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timer = setTimeout(() => setFeedback(""), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const filteredProjects = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = sortByNewest(projects);

    if (!needle) {
      return sorted;
    }

    return sorted.filter((project) =>
      [project.name, project.description, project.language, project.branch].some(
        (value) => String(value || "").toLowerCase().includes(needle)
      )
    );
  }, [projects, query]);

  const languageCount = useMemo(
    () => new Set(projects.map((project) => project.language).filter(Boolean)).size,
    [projects]
  );

  const githubCount = useMemo(
    () => projects.filter((project) => project.github_url).length,
    [projects]
  );

  const openCreate = () => {
    setEditing(null);
    setModalError("");
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setModalError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditing(null);
    setModalError("");
  };

  const handleSave = async (payload) => {
    setSaving(true);
    setModalError("");

    try {
      if (editing) {
        await updateProject(editing.id, payload);
      } else {
        await createProject(payload);
      }

      setModalOpen(false);
      setEditing(null);
      setFeedback(editing ? "Project updated." : "Project created.");
      await loadProjects();
    } catch (requestError) {
      setModalError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(project.id);
    setError("");

    try {
      await deleteProject(project.id);
      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );
      setFeedback("Project deleted.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
            Projects
          </p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
            Your Projects
          </h1>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
            Manage every project in your Django workspace, from repository
            details to the branch that ships it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadProjects()}
            disabled={loading}
            title="Sync with backend"
            aria-label="Sync projects with backend"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-5 text-sm font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 sm:flex-none"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={FolderGit2}
          label="Total projects"
          value={loading ? "—" : projects.length}
          accent="bg-violet-500/10 text-violet-300 ring-violet-400/15"
        />
        <SummaryCard
          icon={Languages}
          label="Languages"
          value={loading ? "—" : languageCount}
          accent="bg-blue-500/10 text-blue-300 ring-blue-400/15"
        />
        <SummaryCard
          icon={GitHubIcon}
          label="GitHub linked"
          value={loading ? "—" : githubCount}
          accent="bg-emerald-500/10 text-emerald-300 ring-emerald-400/15"
        />
      </section>

      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.07] px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <p className="text-xs font-medium text-emerald-200">{feedback}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback("")}
            aria-label="Dismiss message"
            className="grid h-7 w-7 place-items-center rounded-lg text-emerald-300/70 transition hover:bg-emerald-500/10 hover:text-emerald-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-xs font-semibold text-red-200">
                Could not load projects
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-red-300/80">
                {error}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadProjects()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, languages, branches..."
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#11162b] pl-10 pr-10 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear project search"
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          {loading
            ? "Loading projects..."
            : `${filteredProjects.length} of ${projects.length} project${
                projects.length === 1 ? "" : "s"
              }`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-white/[0.06] bg-[#11162b] p-5"
            >
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-white/[0.06]" />
                <div className="h-6 w-16 rounded-full bg-white/[0.05]" />
              </div>
              <div className="mt-4 h-4 w-36 rounded bg-white/[0.07]" />
              <div className="mt-2 h-3 w-full rounded bg-white/[0.04]" />
              <div className="mt-1.5 h-3 w-2/3 rounded bg-white/[0.04]" />
              <div className="mt-4 flex gap-2">
                <div className="h-6 w-20 rounded-lg bg-white/[0.05]" />
                <div className="h-6 w-16 rounded-lg bg-white/[0.04]" />
              </div>
              <div className="mt-6 h-8 rounded-lg bg-white/[0.03]" />
            </div>
          ))}
        </div>
      ) : !error && filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#11162b]/60 px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
            <FolderPlus size={24} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-white">
            {projects.length === 0
              ? "No projects yet"
              : "No matching projects"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            {projects.length === 0
              ? "Create your first project and it will be stored in the Django backend."
              : "Try a different search term or clear the filter to see everything."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (projects.length === 0) {
                openCreate();
              } else {
                setQuery("");
              }
            }}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-4 text-xs font-semibold text-white ring-1 ring-white/[0.08] transition hover:bg-white/[0.1]"
          >
            {projects.length === 0 ? (
              <>
                <Plus size={14} />
                Create your first project
              </>
            ) : (
              "Clear search"
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              deleting={deletingId === project.id}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3.5 py-2.5 text-[10px] text-slate-500">
        <ExternalLink size={12} />
        Projects are synced with the Django REST API at
        <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-slate-400">
          /api/projects/
        </code>
      </div>

      <ProjectModal
        open={modalOpen}
        project={editing}
        saving={saving}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSave}
      />
    </div>
  );
}
