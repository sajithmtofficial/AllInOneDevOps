import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  FolderGit2,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { API_BASE } from "../services/api";
import { getProjects } from "../services/projects";
import { getPipelineRuns } from "../services/pipelines";
import { getDockerStatus } from "../services/docker";
import { getJenkinsStatus } from "../services/jenkins";

function fetchWithTimeout(url, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

export default function Monitoring() {
  const [backendStatus, setBackendStatus] = useState("checking");
  const [backendMessage, setBackendMessage] = useState("");
  const [projects, setProjects] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [dockerStatus, setDockerStatus] = useState(null);
  const [jenkinsStatus, setJenkinsStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkBackend = useCallback(async () => {
    setChecking(true);
    setBackendStatus("checking");
    setBackendMessage("");

    try {
      const response = await fetchWithTimeout(`${API_BASE}/health/`);

      if (response.ok) {
        const data = await response.json().catch(() => null);

        if (data) {
          setBackendStatus(data.status === "ok" ? "online" : "degraded");
          setBackendMessage(
            data.status === "ok"
              ? "Service and database are responding normally."
              : "The service is running with limited availability."
          );
        } else {
          setBackendStatus("online");
          setBackendMessage("The service is reachable.");
        }
      } else {
        setBackendStatus("degraded");
        setBackendMessage("The service responded with an error. Please try again.");
      }
    } catch {
      setBackendStatus("offline");
      setBackendMessage(
        "Could not reach the service. Please check your connection and try again."
      );
    }

    try {
      setProjects(await getProjects());
    } catch {
      setProjects([]);
    }

    try {
      const runs = await getPipelineRuns({ limit: 1 });
      setPipeline(runs.runs?.[0] || null);
    } catch {
      setPipeline(null);
    }

    try {
      setDockerStatus(await getDockerStatus());
    } catch (requestError) {
      setDockerStatus(
        requestError.data || {
          available: false,
          error: requestError.message || "Docker could not be reached.",
        }
      );
    }

    try {
      setJenkinsStatus(await getJenkinsStatus());
    } catch (requestError) {
      setJenkinsStatus(
        requestError.data || {
          configured: false,
          reachable: false,
          error: requestError.message || "Jenkins could not be reached.",
        }
      );
    }

    setChecking(false);
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const statusTone = {
    online: {
      card: "border-emerald-400/20 bg-emerald-500/[0.05]",
      badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/15",
      icon: <CheckCircle2 size={13} />,
      label: "Online",
    },
    degraded: {
      card: "border-amber-400/20 bg-amber-500/[0.05]",
      badge: "bg-amber-500/10 text-amber-300 ring-amber-400/15",
      icon: <AlertCircle size={13} />,
      label: "Degraded",
    },
    offline: {
      card: "border-red-400/20 bg-red-500/[0.05]",
      badge: "bg-red-500/10 text-red-300 ring-red-400/15",
      icon: <XCircle size={13} />,
      label: "Offline",
    },
    checking: {
      card: "border-white/[0.06] bg-[#11162b]",
      badge: "bg-white/[0.05] text-slate-300 ring-white/[0.08]",
      icon: <RefreshCw size={13} className="animate-spin" />,
      label: "Checking...",
    },
  };

  const tone = statusTone[backendStatus] || statusTone.checking;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
            Observability
          </p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
            Monitoring
          </h1>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
            Live health of the services this dashboard depends on.
          </p>
        </div>

        <button
          type="button"
          onClick={checkBackend}
          disabled={checking}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
          Re-check
        </button>
      </div>

      <section className={`rounded-2xl border p-5 ${tone.card}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-slate-300 ring-1 ring-white/[0.06]">
              <Server size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                Platform API
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Core service status
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${tone.badge}`}
          >
            {tone.icon}
            {tone.label}
          </span>
        </div>

        {backendMessage && (
          <p className="mt-3 break-words text-[11px] leading-relaxed text-slate-400">
            {backendMessage}
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
              <FolderGit2 size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Projects</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Workspace overview
              </p>
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">
            {projects === null ? "—" : projects.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {projects === null
              ? "Loading..."
              : `${projects.filter((project) => project.github_url).length} linked to GitHub`}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/15">
              <Activity size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Last pipeline</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Most recent run
              </p>
            </div>
          </div>
          {pipeline ? (
            <>
              <p
                className={`mt-4 text-2xl font-semibold ${
                  pipeline.status === "success"
                    ? "text-emerald-300"
                    : pipeline.status === "queued" || pipeline.status === "running"
                      ? "text-amber-300"
                      : "text-red-300"
                }`}
              >
                {String(pipeline.status).toUpperCase()}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
                {pipeline.external_id || pipeline.id} · {pipeline.repository}
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 text-2xl font-semibold text-slate-500">—</p>
              <p className="mt-1 text-[11px] text-slate-400">
                No workflow runs recorded yet.
              </p>
              <Link
                to="/cicd"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 transition hover:text-violet-200"
              >
                Run a pipeline
              </Link>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/15">
              <Server size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Docker</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Engine on this server
              </p>
            </div>
          </div>
          <p
            className={`mt-4 text-2xl font-semibold ${
              dockerStatus?.available ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {dockerStatus === null
              ? "—"
              : dockerStatus.available
                ? "ONLINE"
                : "OFFLINE"}
          </p>
          <p className="mt-1 break-words text-[11px] text-slate-400">
            {dockerStatus === null
              ? "Checking..."
              : dockerStatus.available
                ? `Server version ${dockerStatus.version || "unknown"}`
                : dockerStatus.error || "Docker could not be reached."}
          </p>
          <Link
            to="/docker"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 transition hover:text-blue-200"
          >
            Open Docker
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
              <Server size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Jenkins</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                External CI server
              </p>
            </div>
          </div>
          <p
            className={`mt-4 text-2xl font-semibold ${
              jenkinsStatus?.reachable
                ? "text-emerald-300"
                : jenkinsStatus === null
                  ? "text-slate-500"
                  : "text-red-300"
            }`}
          >
            {jenkinsStatus === null
              ? "—"
              : jenkinsStatus.reachable
                ? "ONLINE"
                : jenkinsStatus.configured
                  ? "UNREACHABLE"
                  : "NOT CONFIGURED"}
          </p>
          <p className="mt-1 break-words text-[11px] text-slate-400">
            {jenkinsStatus === null
              ? "Checking..."
              : jenkinsStatus.reachable
                ? jenkinsStatus.url
                : jenkinsStatus.error || "Jenkins is not configured."}
          </p>
          <Link
            to="/jenkins"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 transition hover:text-violet-200"
          >
            Open Jenkins
          </Link>
        </div>
      </section>

    </div>
  );
}
