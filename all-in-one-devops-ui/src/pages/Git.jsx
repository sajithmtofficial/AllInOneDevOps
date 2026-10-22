import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  FileCode2,
  FileText,
  FolderGit2,
  GitBranch,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { GitHubIcon } from "../components/icons";
import { getProjects } from "../services/projects";
import {
  getGithubFileContent,
  getGithubFiles,
  getGithubInfo,
} from "../services/github";
import { getApiErrorMessage } from "../utils/apiError";

function RepoBrowser({ repo }) {
  const [info, setInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [defaultBranch, setDefaultBranch] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setInfo(null);
    setFiles([]);

    try {
      const [infoData, filesData] = await Promise.all([
        getGithubInfo(repo),
        getGithubFiles(repo),
      ]);

      setInfo(infoData);
      setDefaultBranch(filesData?.branch || infoData?.default_branch || "");
      setTruncated(Boolean(filesData?.truncated));
      setFiles(Array.isArray(filesData?.files) ? filesData.files : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    setActiveFile(null);
    setFileContent("");
    setFileError("");
    load();
  }, [load]);

  const openFile = async (path) => {
    setActiveFile(path);
    setFileLoading(true);
    setFileError("");
    setFileContent("");

    try {
      const data = await getGithubFileContent(repo, path);
      setFileContent(data.content ?? "");
    } catch (requestError) {
      setFileError(getApiErrorMessage(requestError));
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Files{defaultBranch ? ` · ${defaultBranch}` : ""}
          </p>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            title="Refresh repository"
            aria-label="Refresh repository files"
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-7 animate-pulse rounded-lg bg-white/[0.05]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/[0.06] p-3">
            <p className="text-[11px] leading-relaxed text-red-300">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 text-[11px] font-semibold text-red-200 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        ) : files.length === 0 ? (
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            No files returned for this repository.
          </p>
        ) : (
          <>
            <ul className="mt-3 max-h-[420px] space-y-1 overflow-y-auto pr-1">
              {files.map((file) => {
                const path = typeof file === "string" ? file : file.path;
                const isActive = activeFile === path;

                return (
                  <li key={path}>
                    <button
                      type="button"
                      onClick={() => openFile(path)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition ${
                        isActive
                          ? "bg-violet-500/15 text-violet-200"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <FileText size={13} className="shrink-0" />
                      <span className="truncate">{path}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {truncated && (
              <p className="mt-2 text-[10px] leading-relaxed text-amber-300/80">
                This repository is very large, so some files may not be listed.
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex min-h-[320px] flex-col rounded-2xl border border-white/[0.06] bg-[#11162b] p-4">
        {info && (
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-white/[0.06] pb-3">
            <p className="text-sm font-semibold text-white">{info.full_name}</p>
            {info.description && (
              <p className="min-w-0 truncate text-[11px] text-slate-400">
                {info.description}
              </p>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Star size={12} className="text-amber-300" />
              {info.stargazers_count ?? 0}
            </span>
            {info.private && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                <Lock size={10} /> Private
              </span>
            )}
          </div>
        )}

        {!activeFile ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-slate-500 ring-1 ring-white/[0.06]">
              <FileCode2 size={20} />
            </span>
            <p className="mt-3 text-xs font-medium text-slate-300">
              Select a file to preview its content
            </p>
            <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">
              File contents are loaded directly from GitHub.
            </p>
          </div>
        ) : fileLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 size={15} className="animate-spin text-violet-300" />
            Loading {activeFile}...
          </div>
        ) : fileError ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="max-w-md rounded-xl border border-red-400/15 bg-red-500/[0.06] p-4 text-center">
              <AlertCircle size={17} className="mx-auto text-red-400" />
              <p className="mt-2 text-[11px] leading-relaxed text-red-300">
                {fileError}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-2 truncate font-mono text-[11px] text-violet-300">
              {activeFile}
            </p>
            <pre className="max-h-[520px] flex-1 overflow-auto rounded-xl border border-white/[0.05] bg-[#0b1022] p-4 text-[11px] leading-relaxed text-slate-300">
              {fileContent || "(empty file)"}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

export default function Git() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [repoInput, setRepoInput] = useState("");
  const [activeRepo, setActiveRepo] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const data = await getProjects(controller.signal);
        setProjects(data.filter((project) => project.github_url));
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  const inspectRepo = (url) => {
    const trimmed = url.trim();

    if (!trimmed) {
      return;
    }

    setActiveRepo(trimmed);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
          Version Control
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          Git Repositories
        </h1>
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
          Inspect any GitHub repository — browse its metadata, file tree and
          file contents in one place.
        </p>
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Inspect a repository
        </p>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="url"
              value={repoInput}
              onChange={(event) => setRepoInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  inspectRepo(repoInput);
                }
              }}
              placeholder="https://github.com/owner/repository"
              aria-label="GitHub repository URL"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] pl-10 pr-4 text-xs text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
          <button
            type="button"
            onClick={() => inspectRepo(repoInput)}
            disabled={!repoInput.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-5 text-xs font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <GitHubIcon size={14} />
            Inspect
          </button>
        </div>
      </section>

      {activeRepo && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              Browsing{" "}
              <span className="font-mono text-violet-300">{activeRepo}</span>
            </p>
            <button
              type="button"
              onClick={() => setActiveRepo("")}
              className="text-[11px] font-medium text-slate-400 transition hover:text-white"
            >
              Close browser
            </button>
          </div>
          <RepoBrowser repo={activeRepo} />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <GitBranch size={15} className="text-violet-300" />
          <h2 className="text-sm font-semibold text-white">
            Project repositories
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-[#11162b]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.06] px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-xs leading-relaxed text-red-300">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#11162b]/60 px-6 py-12 text-center">
            <FolderGit2 size={28} className="mx-auto text-violet-400" />
            <p className="mt-3 text-sm font-medium text-slate-200">
              No projects with a GitHub URL yet
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
              Create a project and attach its GitHub repository URL to see it
              here.
            </p>
            <Link
              to="/projects?new=1"
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-white/[0.06] px-4 text-xs font-semibold text-white ring-1 ring-white/[0.08] transition hover:bg-white/[0.1]"
            >
              Create a project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
                    <GitHubIcon size={17} />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-slate-400 ring-1 ring-white/[0.06]">
                    <GitBranch size={11} />
                    {project.branch || "main"}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-semibold text-white">
                  {project.name}
                </h3>
                <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-slate-500">
                  {project.github_url}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRepoInput(project.github_url);
                      inspectRepo(project.github_url);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-3.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    <Search size={12} />
                    Inspect files
                  </button>
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    Open on GitHub
                  </a>
                  <Link
                    to="/cicd"
                    state={{ repoUrl: project.github_url, branch: project.branch }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/15"
                  >
                    Build
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
