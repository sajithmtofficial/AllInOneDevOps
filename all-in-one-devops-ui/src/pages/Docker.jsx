import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Rocket,
  Square,
  Terminal,
  Trash2,
} from "lucide-react";
import { DockerWhale } from "../components/icons";
import {
  getContainerLogs,
  getDockerContainers,
  getDockerImages,
  getDockerStatus,
  inspectContainer,
  removeContainer,
  removeImage,
  startContainer,
  stopContainer,
} from "../services/docker";
import { getApiErrorMessage } from "../utils/apiError";

function StatusPill({ tone, children }) {
  const tones = {
    success: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/15",
    danger: "bg-red-500/10 text-red-300 ring-red-400/15",
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

export default function Docker() {
  const [status, setStatus] = useState(null);
  const [images, setImages] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState("");
  const [details, setDetails] = useState(null);
  const [logs, setLogs] = useState(null);

  const load = useCallback(async () => {
    setActionError("");

    let statusData;
    try {
      statusData = await getDockerStatus();
    } catch (requestError) {
      statusData = requestError.data || {
        available: false,
        error: getApiErrorMessage(requestError),
        setup: "",
      };
    }

    setStatus(statusData);

    if (!statusData.available) {
      setImages([]);
      setContainers([]);
      setLoading(false);
      return;
    }

    try {
      const [imageData, containerData] = await Promise.all([
        getDockerImages(),
        getDockerContainers(),
      ]);
      setImages(imageData.images || []);
      setContainers(containerData.containers || []);
      setError("");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    setError("");
    load();
  };

  const handleStart = async (name) => {
    setBusy(`start:${name}`);
    setActionError("");
    try {
      await startContainer(name);
      await load();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const handleStop = async (name) => {
    if (!window.confirm(`Stop container "${name}"?`)) {
      return;
    }

    setBusy(`stop:${name}`);
    setActionError("");
    try {
      await stopContainer(name);
      await load();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const handleRemoveContainer = async (name) => {
    if (
      !window.confirm(
        `Remove container "${name}"? This is destructive and cannot be undone.`
      )
    ) {
      return;
    }

    setBusy(`remove:${name}`);
    setActionError("");
    try {
      await removeContainer(name);
      if (details?.name === name) {
        setDetails(null);
      }
      if (logs?.name === name) {
        setLogs(null);
      }
      await load();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const handleRemoveImage = async (image) => {
    if (
      !window.confirm(
        `Remove image "${image}"? This is destructive and cannot be undone.`
      )
    ) {
      return;
    }

    setBusy(`image:${image}`);
    setActionError("");
    try {
      await removeImage(image);
      await load();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const handleInspect = async (name) => {
    setBusy(`inspect:${name}`);
    setActionError("");
    try {
      const data = await inspectContainer(name);
      setDetails({ name, data: data.inspect });
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const handleLogs = async (name) => {
    setBusy(`logs:${name}`);
    setActionError("");
    try {
      const data = await getContainerLogs(name);
      setLogs({ name, text: data.logs || "(no log output)" });
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const available = Boolean(status?.available);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
          Containers
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          Docker
        </h1>
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
          Inspect the real Docker Engine on this machine. Images built by CI/CD
          and containers deployed by the workflow appear here.
        </p>
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/15">
              <DockerWhale className="h-6 w-8" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Docker Engine</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {available
                  ? `Connected${status.version ? ` · Server ${status.version}` : ""}`
                  : "Not available"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status && (
              <StatusPill tone={available ? "success" : "danger"}>
                {available ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <AlertCircle size={11} />
                )}
                {available ? "Online" : "Offline"}
              </StatusPill>
            )}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {!available && status && (
          <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
            <p className="text-xs font-semibold text-amber-200">
              {status.error || "Docker is not available."}
            </p>
            {status.setup && (
              <p className="mt-1 text-[11px] leading-relaxed text-amber-200/80">
                {status.setup}
              </p>
            )}
          </div>
        )}

        {actionError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed text-red-200">
              {actionError}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed text-red-200">{error}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package size={15} className="text-blue-300" />
            <h2 className="text-sm font-semibold text-white">
              Images ({images.length})
            </h2>
          </div>
          <Link
            to="/cicd"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-3.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5"
          >
            <Rocket size={13} />
            Build image via CI/CD
          </Link>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Image builds start from the CI/CD workflow so the build, test and
          Docker stages stay in one execution record.
        </p>

        {loading ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin text-violet-300" />
            Loading Docker resources...
          </p>
        ) : images.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
            <p className="text-xs font-medium text-slate-300">No images found</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Run a CI/CD workflow for a repository that contains a Dockerfile.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {images.map((image) => {
              const name = `${image.Repository}:${image.Tag}`;
              return (
                <article
                  key={`${image.ID}-${image.Tag}`}
                  className="flex flex-col gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all font-mono text-xs text-white">
                        {name}
                      </p>
                      {image.managed ? (
                        <StatusPill tone="success">Platform image</StatusPill>
                      ) : (
                        <StatusPill tone="muted">External image</StatusPill>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-500">
                      ID {image.ID} · {image.Size} · {image.CreatedSince}
                    </p>
                  </div>

                  {image.managed && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(name)}
                      disabled={busy === `image:${name}`}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-500/10 px-3 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                    >
                      {busy === `image:${name}` ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      Remove
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <div className="flex items-center gap-2">
          <Terminal size={15} className="text-violet-300" />
          <h2 className="text-sm font-semibold text-white">
            Containers ({containers.length})
          </h2>
        </div>

        {loading ? (
          <p className="mt-4 text-xs text-slate-400">Loading containers...</p>
        ) : containers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
            <p className="text-xs font-medium text-slate-300">
              No containers found
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Enable deployment in CI/CD to create a container.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {containers.map((container) => {
              const name = container.Names;
              const running = container.State === "running";
              const managed = Boolean(container.managed);

              return (
                <article
                  key={container.ID}
                  className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all font-mono text-xs text-white">
                          {name}
                        </p>
                        <StatusPill tone={running ? "success" : "danger"}>
                          {container.State}
                        </StatusPill>
                        {managed ? (
                          <StatusPill tone="muted">Platform container</StatusPill>
                        ) : (
                          <StatusPill tone="muted">External container</StatusPill>
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        ID {container.ID} · {container.Image}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {container.Status}
                        {container.Ports ? ` · ${container.Ports}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspect(name)}
                        disabled={busy === `inspect:${name}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                      >
                        <ChevronRight size={12} />
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogs(name)}
                        disabled={busy === `logs:${name}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                      >
                        <Terminal size={12} />
                        Logs
                      </button>

                      {managed && !running && (
                        <button
                          type="button"
                          onClick={() => handleStart(name)}
                          disabled={busy === `start:${name}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-500/15 disabled:opacity-50"
                        >
                          <Play size={12} />
                          Start
                        </button>
                      )}

                      {managed && running && (
                        <button
                          type="button"
                          onClick={() => handleStop(name)}
                          disabled={busy === `stop:${name}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 text-[10px] font-semibold text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
                        >
                          <Square size={12} />
                          Stop
                        </button>
                      )}

                      {managed && (
                        <button
                          type="button"
                          onClick={() => handleRemoveContainer(name)}
                          disabled={busy === `remove:${name}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 text-[10px] font-semibold text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {details?.name === name && (
                    <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-white/[0.05] bg-[#0b1022] p-3 text-[10px] leading-relaxed text-slate-300">
                      {JSON.stringify(details.data, null, 2)}
                    </pre>
                  )}

                  {logs?.name === name && (
                    <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-white/[0.05] bg-[#0b1022] p-3 text-[10px] leading-relaxed text-slate-300">
                      {logs.text}
                    </pre>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
