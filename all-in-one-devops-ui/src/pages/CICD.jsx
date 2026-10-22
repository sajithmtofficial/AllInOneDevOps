import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  Box,
  CheckCircle2,
  ChevronRight,
  Circle,
  ExternalLink,
  GitBranch,
  Globe,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  Server,
  XCircle,
} from "lucide-react";
import { getCurrentUser } from "../services/auth";
import { getProjects } from "../services/projects";
import {
  getPipelineConfig,
  getPipelineStatus,
  runPipeline,
} from "../services/pipelines";
import { getApiErrorMessage } from "../utils/apiError";

const stageTone = {
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  failed: "border-red-400/30 bg-red-500/10 text-red-300",
  running: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  skipped: "border-white/10 bg-white/[0.04] text-slate-400",
};

const statusTone = {
  success: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/15",
  failed: "bg-red-500/10 text-red-300 ring-red-400/15",
  running: "bg-violet-500/10 text-violet-300 ring-violet-400/15",
  queued: "bg-amber-500/10 text-amber-300 ring-amber-400/15",
};

function StageIcon({ status }) {
  if (status === "success") {
    return <CheckCircle2 size={16} className="text-emerald-400" />;
  }

  if (status === "failed") {
    return <XCircle size={16} className="text-red-400" />;
  }

  if (status === "running") {
    return <Loader2 size={16} className="animate-spin text-violet-300" />;
  }

  return <Circle size={16} className="text-slate-500" />;
}

function StatusBadge({ status }) {
  return (
    <span
      className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${statusTone[status] || "bg-white/[0.04] text-slate-400 ring-white/[0.08]"}`}
    >
      {status === "success" && <CheckCircle2 size={11} />}
      {status === "failed" && <XCircle size={11} />}
      {status === "running" && <Loader2 size={11} className="animate-spin" />}
      {status === "queued" && <RefreshCw size={11} className="animate-spin" />}
      {String(status || "unknown").toUpperCase()}
    </span>
  );
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function CICD() {
  const location = useLocation();
  const [repoUrl, setRepoUrl] = useState(location.state?.repoUrl || "");
  const [branch, setBranch] = useState(location.state?.branch || "main");
  const [projectId, setProjectId] = useState("");
  const [engine, setEngine] = useState("auto");
  const [jenkinsJob, setJenkinsJob] = useState("");
  const [buildDocker, setBuildDocker] = useState(true);
  const [deploy, setDeploy] = useState(true);
  const [running, setRunning] = useState(false);
  const [job, setJob] = useState(null);
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [config, setConfig] = useState(null);
  const [me, setMe] = useState(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    getProjects(controller.signal)
      .then((data) =>
        setProjects(data.filter((project) => project.github_url))
      )
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    getPipelineConfig()
      .then((data) => setConfig(data))
      .catch(() => setConfig(null));

    getCurrentUser()
      .then((data) => setMe(data))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (job && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [job]);

  useEffect(() => {
    if (!job || job.engine !== "jenkins" || job.status !== "queued") {
      return undefined;
    }

    const timer = setTimeout(() => {
      getPipelineStatus(job.id)
        .then((data) => {
          setJob(data.job);
          if (data.run) setRun(data.run);
        })
        .catch(() => {});
    }, 5000);

    return () => clearTimeout(timer);
  }, [job]);

  const selectProject = (value) => {
    setProjectId(value);

    if (!value) return;

    const project = projects.find(
      (candidate) => String(candidate.id) === String(value)
    );

    if (project) {
      setRepoUrl(project.github_url || "");
      setBranch(project.branch || "main");
    }
  };

  const handleRun = useCallback(async () => {
    if (!repoUrl.trim()) {
      setError("Enter a GitHub repository URL.");
      return;
    }

    setRunning(true);
    setError("");
    setJob(null);
    setRun(null);

    try {
      const data = await runPipeline({
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || "main",
        buildDocker,
        deploy,
        projectId: projectId || null,
        engine,
        jenkinsJob,
      });

      setJob(data.job || null);
      setRun(data.run || null);

      if (!data.success) {
        setError(data.error || "Pipeline failed. Check the stage logs below.");
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setRunning(false);
    }
  }, [
    repoUrl,
    branch,
    buildDocker,
    deploy,
    projectId,
    engine,
    jenkinsJob,
  ]);

  const refreshJob = async () => {
    if (!job?.id) return;

    try {
      const data = await getPipelineStatus(job.id);
      setJob(data.job);
      if (data.run) setRun(data.run);
      setError("");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const jenkinsConfig = config?.engines?.jenkins;
  const jenkinsAvailable = Boolean(
    jenkinsConfig?.configured && jenkinsConfig?.reachable
  );
  const jenkinsAllowed = Boolean(me?.is_staff);
  const deployment = job?.deployment || run?.deployment || null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
          DevOps Automation
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          CI/CD Pipeline
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
          Run a real workflow against a GitHub repository: checkout, build, test,
          Docker image, deployment and verification. Built-in runs execute here;
          Jenkins runs execute on your Jenkins server.
        </p>
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Pipeline configuration
        </p>

        <div className="mt-4 space-y-4">
          {projects.length > 0 && (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Project
              </span>
              <select
                value={projectId}
                onChange={(event) => selectProject(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-xs text-white outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
              >
                <option value="">Custom repository</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-500">
                Selecting a project links the workflow and history to that
                project.
              </p>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
              GitHub repository URL
            </span>
            <input
              type="url"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-xs text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Branch
              </span>
              <input
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                placeholder="main"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-xs text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Execution engine
              </span>
              <select
                value={engine}
                onChange={(event) => setEngine(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-xs text-white outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
              >
                <option value="auto">Auto</option>
                <option value="builtin">Built-in runner</option>
                <option
                  value="jenkins"
                  disabled={!jenkinsAvailable || !jenkinsAllowed}
                >
                  Jenkins
                  {!jenkinsAvailable
                    ? " (not available)"
                    : !jenkinsAllowed
                      ? " (staff only)"
                      : ""}
                </option>
              </select>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                {engine === "auto"
                  ? "Auto uses Jenkins when it is available to staff, otherwise the built-in runner."
                  : engine === "jenkins"
                    ? "Jenkins executes the build. Use the Jenkins page for live console output."
                    : "The built-in runner executes every stage on this server."}
              </p>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Jenkins job
              </span>
              <input
                value={jenkinsJob}
                onChange={(event) => setJenkinsJob(event.target.value)}
                disabled={engine === "builtin"}
                placeholder={jenkinsConfig?.default_job || "Optional job name"}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3.5 text-xs text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={buildDocker}
                onChange={(event) => setBuildDocker(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-[#0b1022] accent-violet-500"
              />
              Build Docker image when a Dockerfile exists
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={deploy}
                onChange={(event) => setDeploy(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-[#0b1022] accent-violet-500"
              />
              Deploy the image as a managed container
            </label>
          </div>

          {config && !jenkinsAvailable && (
            <p className="text-[10px] leading-relaxed text-slate-500">
              Jenkins is not available
              {jenkinsConfig?.reason ? `: ${jenkinsConfig.reason}` : "."} Use the
              built-in runner or configure Jenkins on the Jenkins page.
            </p>
          )}

          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-6 text-sm font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {running ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Play size={15} />
            )}
            {running ? "Workflow running..." : "Run workflow"}
          </button>

          <p className="text-[10px] leading-relaxed text-slate-500">
            A built-in run returns the real stage logs when it finishes. A
            Jenkins run is queued and can be followed here and on the Jenkins
            page. Duplicate active workflows are rejected.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.07] px-3.5 py-3"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed text-red-200">{error}</p>
          </div>
        )}
      </section>

      {running && (
        <section className="flex items-center gap-4 rounded-2xl border border-violet-400/15 bg-violet-500/[0.05] p-5">
          <Loader2 size={22} className="shrink-0 animate-spin text-violet-300" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              Workflow is running
            </h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
              The backend is executing real stages. This page updates when the
              run returns.
            </p>
          </div>
        </section>
      )}

      {job && (
        <section
          ref={resultsRef}
          className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5"
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-white/[0.06] pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Workflow ID
              </p>
              <p className="mt-0.5 font-mono text-sm text-white">{job.id}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Engine
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-white">
                {job.engine === "jenkins" ? (
                  <Server size={13} className="text-violet-300" />
                ) : (
                  <Rocket size={13} className="text-violet-300" />
                )}
                {job.engine === "jenkins" ? "Jenkins" : "Built-in"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Branch
              </p>
              <p className="mt-0.5 text-sm text-white">{job.branch}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Started
              </p>
              <p className="mt-0.5 text-sm text-white">
                {formatWhen(job.started_at)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Status
              </p>
              <StatusBadge status={job.status} />
            </div>

            {(job.status === "queued" || job.status === "running") && (
              <button
                type="button"
                onClick={refreshJob}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                <RefreshCw size={12} />
                Refresh status
              </button>
            )}
          </div>

          {job.error && (
            <div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-3">
              <p className="text-[11px] leading-relaxed text-red-200">
                {job.error}
              </p>
            </div>
          )}

          {(job.notes || []).length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {job.notes.map((note, index) => (
                <li
                  key={`${note}-${index}`}
                  className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-400"
                >
                  <Circle size={5} className="mt-1.5 shrink-0 text-violet-400" />
                  {note}
                </li>
              ))}
            </ul>
          )}

          {deployment && (
            <div className="mt-4 grid gap-3 rounded-xl border border-blue-400/15 bg-blue-500/[0.05] p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-blue-300/70">
                  Container
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-white">
                  {deployment.container || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-blue-300/70">
                  Image
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-white">
                  {deployment.image || job.image || "—"}
                </p>
              </div>
              {deployment.url && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-blue-300/70">
                    Live URL
                  </p>
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 break-all text-[11px] font-semibold text-blue-300 underline decoration-blue-400/30 underline-offset-2 hover:text-blue-200"
                  >
                    <Globe size={12} />
                    {deployment.url}
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          )}

          {job.jenkins && (
            <div className="mt-4 rounded-xl border border-violet-400/15 bg-violet-500/[0.05] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-violet-300/70">
                    Jenkins
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-white">
                    {job.jenkins.job}
                    {job.jenkins.build
                      ? ` · build #${job.jenkins.build}`
                      : " · queued"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {job.jenkins.url && (
                    <a
                      href={job.jenkins.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 text-[10px] font-semibold text-violet-300 transition hover:bg-violet-500/15"
                    >
                      Open in Jenkins <ExternalLink size={11} />
                    </a>
                  )}
                  <Link
                    to="/jenkins"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    Jenkins page
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {(job.stages || []).map((stage, index) => (
              <div
                key={`${stage.name}-${index}`}
                className={`rounded-xl border p-4 ${stageTone[stage.status] || stageTone.skipped}`}
              >
                <div className="flex items-center gap-3">
                  <StageIcon status={stage.status} />
                  <p className="text-xs font-semibold text-white">
                    {stage.name}
                  </p>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    {stage.status}
                    {stage.duration !== undefined && stage.duration !== null
                      ? ` · ${stage.duration}s`
                      : ""}
                  </span>
                </div>

                {stage.logs && (
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-white/[0.05] bg-[#0b1022] p-3 text-[10px] leading-relaxed text-slate-300">
                    {stage.logs}
                  </pre>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/logs"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            >
              Open saved runs
              <ChevronRight size={13} />
            </Link>
            <Link
              to="/docker"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3.5 text-[11px] font-semibold text-blue-300 transition hover:bg-blue-500/15"
            >
              <Box size={13} />
              Docker resources
            </Link>
            <Link
              to="/jenkins"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3.5 text-[11px] font-semibold text-violet-300 transition hover:bg-violet-500/15"
            >
              <GitBranch size={13} />
              Jenkins
            </Link>
          </div>
        </section>
      )}

      {!job && !running && (
        <section className="rounded-2xl border border-dashed border-white/10 bg-[#11162b]/60 px-6 py-10 text-center">
          <Rocket size={20} className="mx-auto text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-200">
            No workflow run yet
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
            Configure a repository above and run the workflow. The run is saved
            with its real stages, image, container and deployment details.
          </p>
        </section>
      )}
    </div>
  );
}
