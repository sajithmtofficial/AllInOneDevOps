import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FilePlus2,
  FolderGit2,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Share2,
  ShieldAlert,
  Trash2,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { getProjects } from "../services/projects";
import {
  getHistory,
  getHistoryEntry,
  getProjectActivity,
  restoreHistoryEntry,
} from "../services/history";
import { getApiErrorMessage } from "../utils/apiError";

const PAGE_SIZE = 100;

const EMPTY_FILTERS = {
  q: "",
  user: "",
  file: "",
  project: "",
  module: "",
  action: "",
  status: "",
  date_from: "",
  date_to: "",
};

const ACTION_META = {
  "project.create": { label: "Project created", Icon: FolderGit2, tone: "violet" },
  "project.update": { label: "Project updated", Icon: Settings, tone: "sky" },
  "project.delete": { label: "Project deleted", Icon: Trash2, tone: "red" },
  "project.restore": { label: "Project restored", Icon: RotateCcw, tone: "emerald" },
  "project.file.create": { label: "File created", Icon: FilePlus2, tone: "emerald" },
  "project.file.update": { label: "File updated", Icon: Pencil, tone: "amber" },
  "project.file.rename": { label: "File renamed", Icon: ArrowRightLeft, tone: "sky" },
  "project.file.delete": { label: "File deleted", Icon: Trash2, tone: "red" },
  "project.join": { label: "Collaborator joined", Icon: UserPlus, tone: "emerald" },
  "project.leave": { label: "Collaborator left", Icon: UserMinus, tone: "slate" },
  "project.member.remove": { label: "Collaborator removed", Icon: UserMinus, tone: "red" },
  "project.share.create": { label: "Share link created", Icon: Share2, tone: "violet" },
  "project.share.rotate": { label: "Share link regenerated", Icon: Share2, tone: "violet" },
  "project.share.revoke": { label: "Share link revoked", Icon: Share2, tone: "red" },
};

const ACTION_TONES = {
  violet: "bg-violet-500/10 text-violet-300 ring-violet-400/20",
  sky: "bg-sky-500/10 text-sky-300 ring-sky-400/20",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
  red: "bg-red-500/10 text-red-300 ring-red-400/20",
  slate: "bg-white/[0.04] text-slate-400 ring-white/[0.08]",
};

const AVATAR_TONES = [
  "bg-violet-500/15 text-violet-200",
  "bg-emerald-500/15 text-emerald-200",
  "bg-sky-500/15 text-sky-200",
  "bg-amber-500/15 text-amber-200",
  "bg-rose-500/15 text-rose-200",
  "bg-cyan-500/15 text-cyan-200",
];

const ACTION_OPTIONS = [
  { group: "Files", values: ["project.file.create", "project.file.update", "project.file.rename", "project.file.delete"] },
  { group: "Project", values: ["project.create", "project.update", "project.delete", "project.restore"] },
  { group: "Collaboration", values: ["project.join", "project.leave", "project.member.remove", "project.share.create", "project.share.rotate", "project.share.revoke"] },
];

function actionMeta(action) {
  return (
    ACTION_META[action] || {
      label: String(action || "Activity").replace(/[._]/g, " "),
      Icon: Activity,
      tone: "slate",
    }
  );
}

function entryActionMeta(entry) {
  if (
    entry.action === "project.file.update" &&
    entry.metadata?.change === "renamed"
  ) {
    return ACTION_META["project.file.rename"];
  }

  return actionMeta(entry.action);
}

function initialsFor(name) {
  const value = String(name || "").trim();
  if (!value) return "?";

  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function avatarTone(name) {
  const value = String(name || "");
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function entryFilePath(entry) {
  if (entry.resource_type !== "project_file" && !entry.metadata?.file_name) {
    return "";
  }

  return entry.metadata?.file_name || entry.resource_id || "";
}

function ActorAvatar({ username, size = 22 }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${avatarTone(
        username
      )}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initialsFor(username)}
    </span>
  );
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function ResultPill({ result }) {
  const success = result === "success";
  const failed = result === "failed";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${
        success
          ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/15"
          : failed
            ? "bg-red-500/10 text-red-300 ring-red-400/15"
            : "bg-white/[0.04] text-slate-400 ring-white/[0.08]"
      }`}
    >
      {success ? (
        <CheckCircle2 size={10} />
      ) : failed ? (
        <XCircle size={10} />
      ) : (
        <Clock3 size={10} />
      )}
      {String(result || "recorded").toUpperCase()}
    </span>
  );
}

const FILE_CHANGE_LABELS = {
  created: "Created",
  updated: "Updated",
  renamed: "Renamed",
  deleted: "Deleted",
};

function FileChangeSnapshot({ entry }) {
  const before = entry.before || null;
  const after = entry.after || null;
  const metadata = entry.metadata || {};
  const label = FILE_CHANGE_LABELS[metadata.change] || "Changed";
  const sizeDelta = metadata.size_delta;
  const rows = [
    { label: "Name", before: before?.name, after: after?.name },
    { label: "Lines", before: before?.lines, after: after?.lines },
    { label: "Size", before: before?.size, after: after?.size },
    {
      label: "Checksum",
      before: before?.checksum,
      after: after?.checksum,
      mono: true,
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.05] bg-[#0b1022] p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Recorded change
        </p>
        <p className="text-[11px] font-semibold text-slate-100">
          {label} {metadata.file_name || entry.resource_id || "file"}
        </p>
        {typeof metadata.lines_added === "number" &&
          metadata.lines_added > 0 && (
            <span className="text-[10px] font-semibold text-emerald-400">
              +{metadata.lines_added} lines
            </span>
          )}
        {typeof metadata.lines_removed === "number" &&
          metadata.lines_removed > 0 && (
            <span className="text-[10px] font-semibold text-red-400">
              −{metadata.lines_removed} lines
            </span>
          )}
        {typeof sizeDelta === "number" && sizeDelta !== 0 && (
          <span
            className={`text-[10px] font-semibold ${
              sizeDelta > 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {sizeDelta > 0 ? "+" : "−"}
            {Math.abs(sizeDelta)} B
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1 text-[10px]">
        <span />
        <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
          Before
        </span>
        <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
          After
        </span>
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <span className="text-slate-500">{row.label}</span>
            <span
              className={`truncate text-slate-300 ${row.mono ? "font-mono" : ""}`}
            >
              {row.before ?? "—"}
            </span>
            <span
              className={`truncate text-slate-300 ${row.mono ? "font-mono" : ""}`}
            >
              {row.after ?? "—"}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        File contents are not stored in the audit trail; the size, line count,
        and checksum verify each change.
      </p>
    </div>
  );
}

function JsonBlock({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <pre className="mt-1.5 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-white/[0.05] bg-[#0b1022] p-3 text-[10px] leading-relaxed text-slate-300">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}

export default function History() {
  const [searchParams] = useSearchParams();
  const initialProject = searchParams.get("project") || "";
  const initialFilters = { ...EMPTY_FILTERS, project: initialProject };

  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [live, setLive] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [newIds, setNewIds] = useState(() => new Set());
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canAudit, setCanAudit] = useState(true);
  const [stats, setStats] = useState(null);

  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const highlightTimerRef = useRef(null);
  const entriesRef = useRef([]);

  useEffect(() => {
    const controller = new AbortController();

    getProjects(controller.signal)
      .then((data) => setProjects(data))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const applyResponse = useCallback(
    (nextEntries, pagination = {}, { append = false } = {}) => {
      if (append) {
        const previous = entriesRef.current;
        const seen = new Set(previous.map((entry) => entry.id));
        const merged = [
          ...previous,
          ...nextEntries.filter((entry) => !seen.has(entry.id)),
        ];

        entriesRef.current = merged;
        knownIdsRef.current = new Set(merged.map((entry) => entry.id));
        setEntries(merged);
      } else {
        const previousIds = knownIdsRef.current;
        const fresh = initializedRef.current
          ? nextEntries.filter((entry) => !previousIds.has(entry.id))
          : [];

        knownIdsRef.current = new Set(nextEntries.map((entry) => entry.id));
        initializedRef.current = true;
        entriesRef.current = nextEntries;
        setEntries(nextEntries);

        if (fresh.length > 0) {
          setNewIds(new Set(fresh.map((entry) => entry.id)));

          if (highlightTimerRef.current) {
            clearTimeout(highlightTimerRef.current);
          }

          highlightTimerRef.current = setTimeout(() => {
            setNewIds(new Set());
          }, 12000);
        }
      }

      if (typeof pagination.total === "number") {
        setTotal(pagination.total);
      }

      setHasMore(Boolean(pagination.has_more));
      setLastSynced(new Date());
    },
    []
  );

  const fetchEntries = useCallback(
    (params) =>
      appliedFilters.project
        ? getProjectActivity(appliedFilters.project, params)
        : getHistory(params),
    [appliedFilters.project]
  );

  const load = useCallback(
    async ({ silent = false, limit = PAGE_SIZE } = {}) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      try {
        const data = await fetchEntries({
          ...appliedFilters,
          offset: 0,
          limit,
        });
        applyResponse(data.history || data.activities || [], data);
        setStats(data.stats || null);
        setCanAudit(data.can_audit !== false);
      } catch (requestError) {
        if (!silent) {
          setError(getApiErrorMessage(requestError));
          entriesRef.current = [];
          setEntries([]);
          setTotal(0);
          setHasMore(false);
          setStats(null);
          knownIdsRef.current = new Set();
          initializedRef.current = false;
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [appliedFilters, applyResponse, fetchEntries]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (entries.length === 0) {
      if (selected) {
        setSelected(null);
      }
      return;
    }

    if (!selected || !entries.some((entry) => entry.id === selected.id)) {
      setSelected(entries[0]);
    }
  }, [entries, loading, selected]);

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    setError("");

    try {
      const data = await fetchEntries({
        ...appliedFilters,
        offset: entriesRef.current.length,
        limit: PAGE_SIZE,
      });
      applyResponse(data.history || data.activities || [], data, {
        append: true,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!live) {
      return undefined;
    }

    const tick = () => {
      if (!document.hidden) {
        load({
          silent: true,
          limit: Math.min(
            500,
            Math.max(PAGE_SIZE, entriesRef.current.length)
          ),
        });
      }
    };

    const interval = setInterval(tick, 4000);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [live, load]);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    },
    []
  );

  const resetLiveTracking = () => {
    knownIdsRef.current = new Set();
    initializedRef.current = false;
    setNewIds(new Set());

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
  };

  const applyFilters = () => {
    resetLiveTracking();
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    resetLiveTracking();
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const openEntry = async (entry) => {
    setSelected(entry);
    setDetailLoading(true);
    setActionError("");
    setMessage("");

    try {
      const data = await getHistoryEntry(entry.id);
      setSelected(data.entry);
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  };

  const restore = async () => {
    if (!selected?.reversible) return;

    const confirmed = window.confirm(
      `Restore "${selected.summary}"?\n\nThis will create a new history entry and will not delete or modify the original entry.`
    );

    if (!confirmed) return;

    setRestoring(true);
    setActionError("");
    setMessage("");

    try {
      const data = await restoreHistoryEntry(selected.id, true);
      setMessage(data.message || "Change restored.");
      await load();

      try {
        const fresh = await getHistoryEntry(selected.id);
        setSelected(fresh.entry);
      } catch {
        // The original entry remains selected even if refreshing it fails.
      }
    } catch (requestError) {
      const data = requestError.data;
      setActionError(
        data?.recovery
          ? `${data.error || getApiErrorMessage(requestError)} ${data.recovery}`
          : data?.error || getApiErrorMessage(requestError)
      );
    } finally {
      setRestoring(false);
    }
  };

  const activeFilters = Object.values(appliedFilters).filter(Boolean).length;
  const selectedProject = projects.find(
    (project) => String(project.id) === String(appliedFilters.project)
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
          Audit trail
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          {appliedFilters.project
            ? canAudit
              ? "Project Change History"
              : "Your Project Changes"
            : "Change History"}
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
          {appliedFilters.project
            ? canAudit
              ? `Every file and collaboration change in ${
                  selectedProject?.name || "this project"
                } is recorded with the authenticated actor. Secrets are redacted.`
              : `Showing only the changes you made in ${
                  selectedProject?.name || "this project"
                }. The project owner can review every collaborator's activity.`
            : "Platform actions across projects, Docker, Jenkins, CI/CD, and shared project files are appended to this audit trail. Secrets are redacted."}{" "}
          Project changes that can be reversed offer a restore action, which
          creates a new entry instead of rewriting history.
        </p>
      </div>

      {appliedFilters.project && stats && (
        <section
          className={`grid grid-cols-2 gap-3 ${
            canAudit ? "sm:grid-cols-4" : "sm:grid-cols-3"
          }`}
          aria-label="Activity summary"
        >
          {[
            {
              label: canAudit ? "Total changes" : "Your changes",
              value: stats.total ?? 0,
            },
            {
              label: canAudit ? "Contributors" : "Files touched",
              value: canAudit
                ? stats.contributors ?? 0
                : stats.files ?? 0,
            },
            {
              label: canAudit ? "Files touched" : "Last change",
              value: canAudit ? stats.files ?? 0 : formatWhen(stats.last_change),
              compact: !canAudit,
            },
            ...(canAudit
              ? [
                  {
                    label: "Last change",
                    value: formatWhen(stats.last_change),
                    compact: true,
                  },
                ]
              : []),
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/[0.06] bg-[#11162b] px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p
                className={`mt-1 font-semibold text-white ${
                  item.compact ? "text-[11px]" : "text-lg"
                }`}
              >
                {item.value ?? "—"}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-[10px] font-medium text-slate-400">
              Search changes
            </span>
            <input
              value={filters.q}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  q: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters();
                }
              }}
              placeholder="Project, action, person, or summary"
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50"
            />
          </label>

          {(!appliedFilters.project || canAudit) && (
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium text-slate-400">
                User
              </span>
              <input
                value={filters.user}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    user: event.target.value,
                  }))
                }
                placeholder="Username"
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-400">
              File path
            </span>
            <input
              value={filters.file}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  file: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters();
                }
              }}
              placeholder="src/components/Navbar.jsx"
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 font-mono text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-400">
              Project
            </span>
            <select
              value={filters.project}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  project: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-300 outline-none focus:border-violet-500/50"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-400">
              Module
            </span>
            <select
              value={filters.module}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  module: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-300 outline-none focus:border-violet-500/50"
            >
              <option value="">All modules</option>
              <option value="projects">Projects</option>
              <option value="docker">Docker</option>
              <option value="jenkins">Jenkins</option>
              <option value="cicd">CI/CD</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-400">
              Result
            </span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-300 outline-none focus:border-violet-500/50"
            >
              <option value="">All results</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-400">
              Action type
            </span>
            <select
              value={filters.action}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  action: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-300 outline-none focus:border-violet-500/50"
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.values.map((value) => (
                    <option key={value} value={value}>
                      {ACTION_META[value]?.label || value}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-400">
              From
            </span>
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  date_from: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-300 outline-none focus:border-violet-500/50"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium text-slate-400">
              To
            </span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  date_to: event.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b1022] px-2.5 text-[11px] text-slate-300 outline-none focus:border-violet-500/50"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={loading}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-3 text-[11px] font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Search size={12} />
              Apply
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
              aria-label="Reload history"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-slate-500">
            Showing {entries.length} of {total} {total === 1 ? "entry" : "entries"}
            {activeFilters ? ` matching ${activeFilters} filter(s)` : ""}.{" "}
            {appliedFilters.project && !canAudit
              ? "You are seeing only the changes you made; the project owner sees all activity."
              : "Staff users and project owners see all activity; collaborators only see the changes they made themselves."}
          </p>

          <div className="flex items-center gap-2">
            {live && lastSynced && (
              <span className="text-[10px] text-slate-500">
                Synced {lastSynced.toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={() => setLive((value) => !value)}
              aria-pressed={live}
              title={
                live
                  ? "Live updates are on. Click to pause."
                  : "Live updates are paused. Click to resume."
              }
              className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold transition ${
                live
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                  : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {live && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    live ? "bg-emerald-400" : "bg-slate-500"
                  }`}
                />
              </span>
              <Activity size={11} />
              {live ? "Live" : "Paused"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed text-red-200">{error}</p>
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
          <h2 className="text-sm font-semibold text-white">
            Entries ({total})
          </h2>

          {loading ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin text-violet-300" />
              Loading history...
            </p>
          ) : entries.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-[11px] text-slate-500">
              No history entries match the current filters.
            </p>
          ) : (
            <div className="mt-3 max-h-[680px] overflow-auto pr-1">
              <div>
                <div className="space-y-1.5">
                  {entries.map((entry) => {
                    const active = selected?.id === entry.id;
                    const isNew = newIds.has(entry.id);
                    const meta = entryActionMeta(entry);
                    const Icon = meta.Icon;
                    const filePath = entryFilePath(entry);
                    const previousPath = entry.metadata?.previous_name;
                    const linesAdded = entry.metadata?.lines_added;
                    const linesRemoved = entry.metadata?.lines_removed;

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => openEntry(entry)}
                        className={`relative flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? "border-violet-400/30 bg-violet-500/[0.08]"
                            : isNew
                              ? "border-amber-400/25 bg-amber-500/[0.06] hover:border-amber-400/40"
                              : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ${
                            ACTION_TONES[meta.tone] || ACTION_TONES.slate
                          }`}
                        >
                          <Icon size={14} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <ActorAvatar username={entry.username} size={18} />
                            <span className="text-[11px] font-semibold text-white">
                              {entry.username || "unknown"}
                            </span>
                            <span className="text-[10px] text-slate-500">·</span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {meta.label}
                            </span>
                            {isNew && (
                              <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-300">
                                New
                              </span>
                            )}
                          </span>

                          <span className="mt-1 block text-[11px] font-semibold leading-relaxed text-slate-100">
                            {entry.summary || entry.action}
                          </span>

                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                            {filePath && (
                              <span className="inline-flex max-w-full items-center gap-1 font-mono text-violet-300/90">
                                <span className="truncate">
                                  {previousPath && previousPath !== filePath
                                    ? `${previousPath} → ${filePath}`
                                    : filePath}
                                </span>
                              </span>
                            )}
                            {!appliedFilters.project && entry.project_name && (
                              <span className="inline-flex items-center gap-1">
                                <FolderGit2 size={9} />
                                {entry.project_name}
                              </span>
                            )}
                            <span>{formatWhen(entry.created_at)}</span>
                            {typeof linesAdded === "number" &&
                              linesAdded > 0 && (
                                <span className="text-emerald-400">
                                  +{linesAdded}
                                </span>
                              )}
                            {typeof linesRemoved === "number" &&
                              linesRemoved > 0 && (
                                <span className="text-red-400">
                                  −{linesRemoved}
                                </span>
                              )}
                            {entry.reversible && (
                              <span className="text-emerald-300">
                                reversible
                              </span>
                            )}
                          </span>
                        </span>

                        <span className="shrink-0">
                          <ResultPill result={entry.result} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <ChevronRight size={13} className="rotate-90" />
                  )}
                  {loadingMore
                    ? "Loading more..."
                    : `Load more (${total - entries.length} remaining)`}
                </button>
              )}

              <p className="mt-2 text-center text-[10px] text-slate-500">
                Showing {entries.length} of {total}
              </p>
            </div>
          )}
        </section>

        {!selected ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#11162b]/60 px-6 py-14 text-center">
            {loading ? (
              <Loader2
                size={24}
                className="mx-auto animate-spin text-violet-300"
              />
            ) : entries.length === 0 ? (
              <Search size={24} className="mx-auto text-slate-500" />
            ) : (
              <Clock3 size={24} className="mx-auto text-slate-500" />
            )}
            <p className="mt-3 text-sm font-medium text-slate-200">
              {loading
                ? "Loading change details..."
                : entries.length === 0
                  ? "No changes match these filters"
                  : "Select a history entry"}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
              {loading
                ? "The newest matching change is selected automatically."
                : entries.length === 0
                  ? "Adjust the filters above, or clear them to see the full activity feed."
                  : "Review the actor, before and after snapshots, and restore options."}
            </p>
            {!loading && entries.length === 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                  {(() => {
                    const meta = entryActionMeta(selected);
                    const Icon = meta.Icon;

                    return (
                      <>
                        <Icon size={11} />
                        {meta.label} · #{selected.id} · {selected.module}
                      </>
                    );
                  })()}
                </p>
                <h2 className="mt-1 text-sm font-semibold leading-relaxed text-white">
                  {selected.summary}
                </h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <ActorAvatar username={selected.username} size={16} />
                    {selected.username || "unknown"}
                  </span>
                  {selected.project_name && (
                    <span className="inline-flex items-center gap-1">
                      <FolderGit2 size={10} />
                      {selected.project_name}
                    </span>
                  )}
                  <span>{formatWhen(selected.created_at)}</span>
                  <ResultPill result={selected.result} />
                  {entryFilePath(selected) && (
                    <span className="font-mono text-violet-300/90">
                      {entryFilePath(selected)}
                    </span>
                  )}
                  {typeof selected.metadata?.lines_added === "number" &&
                    selected.metadata.lines_added > 0 && (
                      <span className="font-semibold text-emerald-400">
                        +{selected.metadata.lines_added}
                      </span>
                    )}
                  {typeof selected.metadata?.lines_removed === "number" &&
                    selected.metadata.lines_removed > 0 && (
                      <span className="font-semibold text-red-400">
                        −{selected.metadata.lines_removed}
                      </span>
                    )}
                  {selected.resource_type &&
                    !entryFilePath(selected) && (
                      <span className="font-mono">
                        {selected.resource_type}:{selected.resource_id}
                      </span>
                    )}
                </p>
              </div>

              {selected.reversible ? (
                <button
                  type="button"
                  onClick={restore}
                  disabled={restoring || detailLoading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/15 disabled:opacity-50"
                >
                  {restoring ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RotateCcw size={13} />
                  )}
                  Restore
                </button>
              ) : (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[10px] font-semibold text-slate-500">
                  <ShieldAlert size={13} />
                  Not reversible
                </span>
              )}
            </div>

            {message && (
              <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] px-3.5 py-3">
                <p className="text-[11px] text-emerald-200">{message}</p>
              </div>
            )}

            {actionError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-3">
                <AlertCircle
                  size={15}
                  className="mt-0.5 shrink-0 text-red-400"
                />
                <p className="text-[11px] leading-relaxed text-red-200">
                  {actionError}
                </p>
              </div>
            )}

            {!selected.reversible && selected.metadata?.recovery && (
              <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                  Recovery instructions
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-200/90">
                  {selected.metadata.recovery}
                </p>
              </div>
            )}

            {!selected.reversible && selected.metadata?.note && (
              <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                  Note
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-200/90">
                  {selected.metadata.note}
                </p>
              </div>
            )}

            {detailLoading ? (
              <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                <Loader2 size={13} className="animate-spin text-violet-300" />
                Loading entry details...
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {selected.resource_type === "project_file" ? (
                  <FileChangeSnapshot entry={selected} />
                ) : (
                  <>
                    <JsonBlock label="Before" value={selected.before} />
                    <JsonBlock label="After" value={selected.after} />
                  </>
                )}
                <JsonBlock label="Metadata" value={selected.metadata} />
              </div>
            )}

            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500">
              <ChevronRight size={11} />
              Original audit entries are never edited or deleted. A restore is
              recorded as a new entry.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
