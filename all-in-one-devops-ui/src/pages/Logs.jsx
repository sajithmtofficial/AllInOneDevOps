import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Server,
  XCircle,
} from "lucide-react";
import {
  getLastJobId,
  getPipelineRuns,
  getPipelineStatus,
} from "../services/pipelines";
import { getApiErrorMessage } from "../utils/apiError";

function stageTone(status) {
  if (status === "success") {
    return "border-emerald-400/25 bg-emerald-500/[0.06]";
  }

  if (status === "failed") {
    return "border-red-400/25 bg-red-500/[0.06]";
  }

  if (status === "running") {
    return "border-violet-400/25 bg-violet-500/[0.06]";
  }

  return "border-white/10 bg-white/[0.02]";
}

function jobFromRun(run) {
  return {
    id: run.external_id,
    engine: run.engine,
    status: run.status,
    repository: run.repository,
    branch: run.branch,
    started_at: run.started_at,
    finished_at: run.finished_at,
    stages: run.stages || [],
    image: run.image,
    deployment: run.deployment,
    error: run.error,
    notes: [],
    jenkins: run.jenkins_job
      ? {
          job: run.jenkins_job,
          build: run.jenkins_build,
          url: run.jenkins_url,
        }
      : null,
  };
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function StatusPill({ status }) {
  const tone =
    status === "success"
      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/15"
      : status === "failed"
        ? "bg-red-500/10 text-red-300 ring-red-400/15"
        : "bg-white/[0.04] text-slate-400 ring-white/[0.08]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${tone}`}
    >
      {status === "success" ? (
        <CheckCircle2 size={10} />
      ) : status === "failed" ? (
        <XCircle size={10} />
      ) : (
        <Clock size={10} />
      )}
      {String(status || "unknown").toUpperCase()}
    </span>
  );
}

export default function Logs() {
  const [runs, setRuns] = useState([]);
  const [job, setJob] = useState(null);
  const [input, setInput] = useState(() => getLastJobId());
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [engineFilter, setEngineFilter] = useState("");

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPipelineRuns({
        limit: 50,
        status: statusFilter,
        engine: engineFilter,
      });
      setRuns(data.runs || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, engineFilter]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    const lastJobId = getLastJobId();

    if (!lastJobId) return undefined;

    let cancelled = false;

    getPipelineStatus(lastJobId)
      .then((data) => {
        if (!cancelled) {
          setJob(data.job);
          setInput(lastJobId);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const loadById = async () => {
    const id = input.trim();

    if (!id) {
      setJob(null);
      setError("");
      return;
    }

    setSearching(true);
    setError("");

    try {
      const data = await getPipelineStatus(id);
      setJob(data.job);
    } catch (requestError) {
      setJob(null);
      setError(getApiErrorMessage(requestError));
    } finally {
      setSearching(false);
    }
  };

  const selectRun = (run) => {
    setJob(jobFromRun(run));
    setInput(run.external_id);
    setError("");
  };

  const refreshSelected = async () => {
    if (!job?.id) {
      loadRuns();
      return;
    }

    setSearching(true);
    setError("");

    try {
      const data = await getPipelineStatus(job.id);
      setJob(data.job);
      await loadRuns();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
          Observability
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          Pipeline Logs
        </h1>
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
          Review persisted workflow runs and their real stage logs. Runs are
          stored in the database, not just the current browser session.
        </p>
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadById();
                }
              }}
              placeholder="Workflow ID (e.g. 3f9a1c2b4d5e)"
              aria-label="Workflow ID"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] pl-10 pr-4 font-mono text-xs text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
          <button
            type="button"
            onClick={loadById}
            disabled={searching}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-5 text-xs font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {searching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            Load run
          </button>
          <button
            type="button"
            onClick={refreshSelected}
            disabled={searching}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={searching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-300 outline-none"
          >
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
          </select>
          <select
            value={engineFilter}
            onChange={(event) => setEngineFilter(event.target.value)}
            className="h-9 rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-300 outline-none"
          >
            <option value="">All engines</option>
            <option value="builtin">Built-in</option>
            <option value="jenkins">Jenkins</option>
          </select>
          <button
            type="button"
            onClick={loadRuns}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Reload list
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed text-red-200">{error}</p>
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)]">
        <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              Saved runs ({runs.length})
            </h2>
            {loading && (
              <Loader2 size={13} className="animate-spin text-violet-300" />
            )}
          </div>

          {!loading && runs.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
              <FileText size={20} className="mx-auto text-slate-500" />
              <p className="mt-2 text-xs font-medium text-slate-300">
                No workflow runs yet
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Run a workflow from CI/CD and it will be saved here.
              </p>
              <Link
                to="/cicd"
                className="mt-3 inline-flex h-9 items-center rounded-xl bg-white/[0.06] px-3.5 text-[11px] font-semibold text-white ring-1 ring-white/[0.08] transition hover:bg-white/[0.1]"
              >
                Open CI/CD
              </Link>
            </div>
          ) : (
            <div className="mt-3 max-h-[560px] space-y-2 overflow-auto pr-1">
              {runs.map((run) => {
                const active = job?.id === run.external_id;
                return (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => selectRun(run)}
                    className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                      active
                        ? "border-violet-400/30 bg-violet-500/[0.08]"
                        : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-[11px] font-semibold text-white">
                        {run.external_id}
                      </p>
                      <StatusPill status={run.status} />
                    </div>
                    <p className="mt-1.5 truncate text-[10px] text-slate-400">
                      {run.project_name || run.repository}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        {run.engine === "jenkins" ? (
                          <Server size={9} />
                        ) : (
                          <Clock size={9} />
                        )}
                        {run.engine}
                      </span>
                      <span>{run.branch}</span>
                      <span>{formatWhen(run.started_at)}</span>
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {!job ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#11162b]/60 px-6 py-14 text-center">
            <FileText size={24} className="mx-auto text-slate-500" />
            <p className="mt-3 text-sm font-medium text-slate-200">
              No workflow selected
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
              Select a saved run or load one by ID to review its stage logs.
            </p>
          </div>
        ) : (
          <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/[0.06] pb-4">
              <p className="font-mono text-sm text-white">{job.id}</p>
              <p className="break-all text-[11px] text-slate-400">
                {job.repository} · {job.branch}
              </p>
              <p className="text-[11px] text-slate-500">
                {formatWhen(job.started_at)}
              </p>
              <StatusPill status={job.status} />
              <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                {job.engine}
              </span>
            </div>

            {job.error && (
              <p className="mt-3 rounded-lg border border-red-400/15 bg-red-500/[0.06] px-3 py-2 text-[11px] text-red-200">
                {job.error}
              </p>
            )}

            {job.deployment && (
              <div className="mt-3 grid gap-2 rounded-xl border border-blue-400/15 bg-blue-500/[0.05] p-3 text-[10px] sm:grid-cols-2">
                <p className="text-slate-400">
                  Container:{" "}
                  <span className="font-mono text-slate-200">
                    {job.deployment.container || "—"}
                  </span>
                </p>
                <p className="text-slate-400">
                  Image:{" "}
                  <span className="font-mono text-slate-200">
                    {job.deployment.image || job.image || "—"}
                  </span>
                </p>
                {job.deployment.url && (
                  <a
                    href={job.deployment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-blue-300 underline decoration-blue-400/30 underline-offset-2 sm:col-span-2"
                  >
                    {job.deployment.url}
                  </a>
                )}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {(job.stages || []).length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  This run has no stored stages yet.
                </p>
              ) : (
                job.stages.map((stage, index) => (
                  <div
                    key={`${stage.name}-${index}`}
                    className={`rounded-xl border p-4 ${stageTone(stage.status)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-white">
                        {stage.name}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                        {stage.status}
                        {stage.duration !== undefined &&
                        stage.duration !== null
                          ? ` · ${stage.duration}s`
                          : ""}
                      </span>
                    </div>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/[0.05] bg-[#0b1022] p-3 text-[10px] leading-relaxed text-slate-300">
                      {stage.logs || "(no logs for this stage)"}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
