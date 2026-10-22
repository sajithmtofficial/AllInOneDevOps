import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, Zap } from "lucide-react";
import HeroBanner from "../components/HeroBanner";
import StatCard from "../components/StatCard";
import RecentProjects from "../components/RecentProjects";
import RecentActivity from "../components/RecentActivity";
import QuickActionCard from "../components/QuickActionCard";
import { quickActions } from "../data/navigation";
import { getProjects } from "../services/projects";
import { getDockerContainers, getDockerStatus } from "../services/docker";
import { getPipelineRuns } from "../services/pipelines";
import { getRecentActivity } from "../services/history";
import { timeAgo } from "../utils/format";

function sortByNewest(projects) {
  return [...projects].sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime()
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [containerState, setContainerState] = useState({
    loading: true,
    available: false,
    containers: [],
  });
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  const loadProjects = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const data = await getProjects(signal);
      setProjects(data);
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }

      setError(
        requestError.message ||
          "Could not load your projects. Check your connection and try again."
      );
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
    let cancelled = false;

    Promise.all([
      getDockerStatus().catch((requestError) => requestError.data || {
        available: false,
        error: requestError.message,
      }),
      getDockerContainers().catch(() => ({ containers: [] })),
      getPipelineRuns({ limit: 100 }).catch(() => ({ runs: [] })),
      getRecentActivity(6).catch(() => ({ activities: [] })),
    ]).then(([dockerStatus, dockerContainers, pipelineRuns, recentActivity]) => {
      if (cancelled) return;

      setContainerState({
        loading: false,
        available: Boolean(dockerStatus.available),
        containers: dockerContainers.containers || [],
      });
      setRuns(pipelineRuns.runs || []);
      setRunsLoading(false);
      setActivities(
        (recentActivity.activities || []).map((item) => ({
          ...item,
          time: timeAgo(item.created_at),
        }))
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const buildsToday = runs.filter(
      (run) => run.started_at && new Date(run.started_at).toDateString() === today
    ).length;
    const deployments = runs.filter(
      (run) => run.deployment?.container || run.container
    ).length;
    const runningContainers = containerState.containers.filter(
      (container) => container.State === "running"
    ).length;

    return [
      {
        id: "projects",
        label: "Total Projects",
        value: loading ? "—" : String(projects.length),
        change: loading ? null : "Live",
        live: true,
        note: "All projects",
        tone: "purple",
        icon: "folder",
      },
      {
        id: "containers",
        label: "Running Containers",
        value: containerState.loading
          ? "—"
          : containerState.available
            ? String(runningContainers)
            : "—",
        change:
          !containerState.loading && containerState.available ? "Live" : null,
        live: true,
        note: containerState.loading
          ? "Loading Docker"
          : containerState.available
            ? `${containerState.containers.length} total containers`
            : "Docker offline",
        tone: "blue",
        icon: "container",
      },
      {
        id: "builds",
        label: "Builds Today",
        value: runsLoading ? "—" : String(buildsToday),
        change: runsLoading ? null : "Live",
        live: true,
        note: runsLoading ? "Loading CI/CD" : `${runs.length} recent runs`,
        tone: "green",
        icon: "wrench",
      },
      {
        id: "deployments",
        label: "Deployments",
        value: runsLoading ? "—" : String(deployments),
        change: runsLoading ? null : "Recorded",
        live: true,
        note: "With a saved container",
        tone: "orange",
        icon: "rocket",
      },
    ];
  }, [
    loading,
    projects.length,
    containerState.loading,
    containerState.available,
    containerState.containers,
    runs,
    runsLoading,
  ]);

  const recentProjects = useMemo(
    () =>
      sortByNewest(projects)
        .slice(0, 1)
        .map((project) => ({
          id: project.id,
          name: project.name,
          description:
            project.description || project.language || "No description",
          status: project.language || "No language",
          icon: "code",
          tone: "purple",
          path: "/projects",
        })),
    [projects]
  );

  return (
    <div className="space-y-4">
      <HeroBanner />

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0 text-red-400"
            />
            <div>
              <p className="text-xs font-semibold text-red-200">
                Could not load your projects
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

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Workspace statistics"
        aria-busy={loading}
      >
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <RecentProjects
          projects={recentProjects}
          loading={loading}
          error={error}
        />
        <RecentActivity
          activities={activities}
          loading={loading}
          error={error}
        />
      </div>

      <section aria-labelledby="quick-actions-title">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
            <Zap size={14} />
          </span>
          <h2
            id="quick-actions-title"
            className="text-[15px] font-semibold text-white"
          >
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </section>
    </div>
  );
}
