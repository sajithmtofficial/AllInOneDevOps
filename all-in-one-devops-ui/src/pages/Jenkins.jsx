import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  GitBranch,
  Loader2,
  Play,
  RefreshCw,
  Server,
  Terminal,
} from "lucide-react";
import { getCurrentUser } from "../services/auth";
import {
  getJenkinsBuild,
  getJenkinsBuilds,
  getJenkinsConsole,
  getJenkinsJobs,
  getJenkinsStatus,
  triggerJenkinsBuild,
} from "../services/jenkins";
import { getApiErrorMessage } from "../utils/apiError";

function StatusPill({ tone, children }) {
  const tones = {
    success: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/15",
    danger: "bg-red-500/10 text-red-300 ring-red-400/15",
    warning: "bg-amber-500/10 text-amber-300 ring-amber-400/15",
    muted: "bg-white/[0.04] text-slate-400 ring-white/[0.08]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${tones[tone] || tones.muted}`}
    >
      {children}
    </span>
  );
}

function buildTone(result, building) {
  if (building) return "warning";
  if (result === "SUCCESS") return "success";
  if (result === "FAILURE" || result === "ABORTED") return "danger";
  return "muted";
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "Unknown time";
  return new Date(timestamp).toLocaleString();
}

function formatDuration(duration) {
  if (!duration) return "0s";
  const seconds = Math.round(duration / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

export default function Jenkins() {
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [buildDetail, setBuildDetail] = useState(null);
  const [consoleText, setConsoleText] = useState("");
  const [loading, setLoading] = useState(true);
  const [buildsLoading, setBuildsLoading] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [queueUrl, setQueueUrl] = useState("");

  const loadConnection = useCallback(async () => {
    setError("");
    setMessage("");

    try {
      const currentUser = await getCurrentUser();
      setMe(currentUser);
    } catch {
      setMe(null);
    }

    let statusData;
    try {
      statusData = await getJenkinsStatus();
    } catch (requestError) {
      statusData = requestError.data || {
        configured: false,
        reachable: false,
        error: getApiErrorMessage(requestError),
      };
    }

    setStatus(statusData);

    if (!statusData.configured) {
      setJobs([]);
      setBuilds([]);
      setSelectedJob("");
      setLoading(false);
      return;
    }

    try {
      const jobData = await getJenkinsJobs();
      setJobs(jobData.jobs || []);

      if (statusData.reachable) {
        const preferred = statusData.default_job;
        const names = (jobData.jobs || []).map((job) => job.name);
        const nextJob = names.includes(preferred)
          ? preferred
          : names[0] || "";
        setSelectedJob(nextJob);
      }
    } catch (requestError) {
      const data = requestError.data;
      if (data) {
        setStatus((previous) => ({
          ...previous,
          reachable: false,
          error: data.error || getApiErrorMessage(requestError),
          help: data.help || previous?.help || "",
        }));
      } else {
        setError(getApiErrorMessage(requestError));
      }
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  const loadBuilds = useCallback(async (jobName) => {
    if (!jobName) {
      setBuilds([]);
      return;
    }

    setBuildsLoading(true);
    setSelectedBuild(null);
    setBuildDetail(null);
    setConsoleText("");

    try {
      const data = await getJenkinsBuilds(jobName);
      setBuilds(data.builds || []);
    } catch (requestError) {
      const data = requestError.data;
      setActionError(
        data?.error || getApiErrorMessage(requestError)
      );
      setBuilds([]);
    } finally {
      setBuildsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuilds(selectedJob);
  }, [loadBuilds, selectedJob]);

  const refresh = () => {
    setLoading(true);
    setActionError("");
    setSelectedBuild(null);
    setBuildDetail(null);
    setConsoleText("");
    loadConnection();
  };

  const openBuild = async (build) => {
    setSelectedBuild(build);
    setBuildLoading(true);
    setBuildDetail(null);
    setConsoleText("");
    setActionError("");

    const job = selectedJob;

    try {
      const [detailData, consoleData] = await Promise.all([
        getJenkinsBuild(job, build.number),
        getJenkinsConsole(job, build.number),
      ]);
      setBuildDetail(detailData.build || null);
      setConsoleText(consoleData.console || "");
    } catch (requestError) {
      const data = requestError.data;
      setActionError(data?.error || getApiErrorMessage(requestError));
    } finally {
      setBuildLoading(false);
    }
  };

  const triggerBuild = async () => {
    if (!selectedJob) return;

    if (!window.confirm(`Queue a Jenkins build for "${selectedJob}"?`)) {
      return;
    }

    setBusy(true);
    setActionError("");
    setMessage("");
    setQueueUrl("");

    try {
      const data = await triggerJenkinsBuild(selectedJob);
      setMessage(data.message || `Build queued for ${selectedJob}.`);
      setQueueUrl(data.queue_url || "");
      await loadBuilds(selectedJob);
    } catch (requestError) {
      const data = requestError.data;
      setActionError(data?.error || getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const configured = Boolean(status?.configured);
  const reachable = Boolean(status?.reachable);
  const canTrigger = Boolean(me?.is_staff);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
            Automation
          </p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
            Jenkins
          </h1>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
            Monitor the Jenkins server configured for this platform, inspect
            jobs and builds, and open real console output.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            to="/cicd"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-3.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5"
          >
            <GitBranch size={13} />
            Run CI/CD
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
              <Server size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Jenkins server</p>
              <p className="mt-0.5 break-all text-[11px] text-slate-400">
                {configured
                  ? status.url
                  : "JENKINS_URL is not configured"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status && (
              <StatusPill
                tone={
                  reachable ? "success" : configured ? "danger" : "muted"
                }
              >
                {reachable ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <AlertCircle size={11} />
                )}
                {reachable
                  ? "Connected"
                  : configured
                    ? "Unreachable"
                    : "Not configured"}
              </StatusPill>
            )}
            {status?.credentials_configured && (
              <StatusPill tone="muted">Credentials configured</StatusPill>
            )}
            {status?.version && (
              <StatusPill tone="muted">Jenkins {status.version}</StatusPill>
            )}
          </div>
        </div>

        {!configured && status && (
          <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
            <p className="text-xs font-semibold text-amber-200">
              {status.error || "Jenkins is not configured."}
            </p>
            {status.help && (
              <p className="mt-1 text-[11px] leading-relaxed text-amber-200/80">
                {status.help}
              </p>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-amber-200/70">
              Credentials are read on the backend and are never sent to this
              page. Set JENKINS_URL, JENKINS_USER, JENKINS_API_TOKEN and
              optionally JENKINS_JOB in the backend environment or the project
              .env file, then restart the Django server.
            </p>
          </div>
        )}

        {configured && !reachable && (
          <div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/[0.06] p-4">
            <p className="text-xs font-semibold text-red-200">
              {status?.error || "Jenkins could not be reached."}
            </p>
            {status?.help && (
              <p className="mt-1 text-[11px] leading-relaxed text-red-200/80">
                {status.help}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 text-[11px] text-red-300">{error}</p>
        )}

        {actionError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed text-red-200">
              {actionError}
            </p>
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] px-3.5 py-3">
            <p className="text-[11px] leading-relaxed text-emerald-200">
              {message}
            </p>
            {queueUrl && (
              <a
                href={queueUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 underline decoration-emerald-400/30 underline-offset-2"
              >
                Open queue item <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
      </section>

      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin text-violet-300" />
            Loading Jenkins...
          </p>
        </div>
      ) : configured && reachable ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">
                Jobs ({jobs.length})
              </h2>
              {status?.default_job && (
                <StatusPill tone="muted">
                  Default: {status.default_job}
                </StatusPill>
              )}
            </div>

            {jobs.length === 0 ? (
              <p className="mt-4 text-[11px] text-slate-500">
                The Jenkins server did not return any jobs.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {jobs.map((job) => {
                  const active = job.name === selectedJob;
                  return (
                    <button
                      key={job.name}
                      type="button"
                      onClick={() => setSelectedJob(job.name)}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                        active
                          ? "border-violet-400/30 bg-violet-500/[0.08]"
                          : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="break-all font-mono text-[11px] font-semibold text-white">
                          {job.name}
                        </p>
                        <ChevronRight
                          size={13}
                          className={active ? "text-violet-300" : "text-slate-600"}
                        />
                      </div>
                      {job.description && (
                        <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                          {job.description}
                        </p>
                      )}
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        {job.last_build?.number
                          ? `Last build #${job.last_build.number} · ${job.last_build.result || "running"}`
                          : "No builds yet"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Builds{selectedJob ? ` · ${selectedJob}` : ""}
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {canTrigger
                    ? "You can queue a new build."
                    : "Only staff users can queue Jenkins builds."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadBuilds(selectedJob)}
                  disabled={!selectedJob || buildsLoading}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    size={12}
                    className={buildsLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={triggerBuild}
                  disabled={!selectedJob || busy || !canTrigger}
                  title={
                    canTrigger
                      ? "Queue a Jenkins build"
                      : "Staff permission is required"
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-2.5 text-[10px] font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Play size={12} />
                  )}
                  {canTrigger ? "Queue build" : "Staff only"}
                </button>
              </div>
            </div>

            {buildsLoading ? (
              <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                <Loader2 size={13} className="animate-spin text-violet-300" />
                Loading builds...
              </p>
            ) : builds.length === 0 ? (
              <p className="mt-4 text-[11px] text-slate-500">
                No builds were returned for this job.
              </p>
            ) : (
              <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
                {builds.map((build) => {
                  const active = selectedBuild?.number === build.number;
                  return (
                    <button
                      key={build.number}
                      type="button"
                      onClick={() => openBuild(build)}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                        active
                          ? "border-violet-400/30 bg-violet-500/[0.08]"
                          : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-[11px] font-semibold text-white">
                          Build #{build.number}
                        </p>
                        <StatusPill
                          tone={buildTone(build.result, build.building)}
                        >
                          {build.building ? "RUNNING" : build.result || "UNKNOWN"}
                        </StatusPill>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={10} />
                          {formatTimestamp(build.timestamp)}
                        </span>
                        <span>{formatDuration(build.duration)}</span>
                        {build.displayName && (
                          <span className="truncate">{build.displayName}</span>
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedBuild && (
              <div className="mt-4 rounded-xl border border-white/[0.05] bg-[#0b1022] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[11px] font-semibold text-white">
                    Build #{selectedBuild.number} details
                  </p>
                  {selectedBuild.url && (
                    <a
                      href={selectedBuild.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-300 hover:text-violet-200"
                    >
                      Open in Jenkins <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                {buildLoading ? (
                  <p className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                    <Loader2 size={12} className="animate-spin text-violet-300" />
                    Loading build details and console...
                  </p>
                ) : (
                  <>
                    {buildDetail && (
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <dt className="text-slate-500">Result</dt>
                          <dd className="mt-0.5 text-slate-200">
                            {buildDetail.building
                              ? "BUILDING"
                              : buildDetail.result || "UNKNOWN"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Duration</dt>
                          <dd className="mt-0.5 text-slate-200">
                            {formatDuration(buildDetail.duration)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Started</dt>
                          <dd className="mt-0.5 text-slate-200">
                            {formatTimestamp(buildDetail.timestamp)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Display name</dt>
                          <dd className="mt-0.5 truncate text-slate-200">
                            {buildDetail.displayName || "—"}
                          </dd>
                        </div>
                      </dl>
                    )}

                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <Terminal size={11} />
                      Console output
                    </div>
                    <pre className="mt-1.5 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/[0.05] bg-[#080c1a] p-3 text-[10px] leading-relaxed text-slate-300">
                      {consoleText || "(no console output)"}
                    </pre>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
