import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, Zap } from "lucide-react";
import HeroBanner from "../components/HeroBanner";
import StatCard from "../components/StatCard";
import RecentProjects from "../components/RecentProjects";
import RecentActivity from "../components/RecentActivity";
import QuickActionCard from "../components/QuickActionCard";
import { quickActions } from "../data/mockData";
import { getProjects } from "../services/projects";
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
          "Could not reach the Django API. Make sure the backend is running."
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

  const stats = useMemo(
    () => [
      {
        id: "projects",
        label: "Total Projects",
        value: loading ? "—" : String(projects.length),
        change: loading ? null : "Live",
        live: true,
        note: "from Django API",
        tone: "purple",
        icon: "folder",
      },
      {
        id: "containers",
        label: "Running Containers",
        value: "0",
        change: null,
        note: "No API endpoint yet",
        tone: "blue",
        icon: "container",
      },
      {
        id: "builds",
        label: "Builds Today",
        value: "0",
        change: null,
        note: "No API endpoint yet",
        tone: "green",
        icon: "wrench",
      },
      {
        id: "deployments",
        label: "Deployments",
        value: "0",
        change: null,
        note: "No API endpoint yet",
        tone: "orange",
        icon: "rocket",
      },
    ],
    [loading, projects.length]
  );

  const recentProjects = useMemo(
    () =>
      sortByNewest(projects)
        .slice(0, 1)
        .map((project) => ({
          id: project.id,
          name: project.name,
          description:
            project.description || project.language || "No description",
          status: "Active",
          icon: "code",
          tone: "purple",
          path: "/projects",
        })),
    [projects]
  );

  const activities = useMemo(() => {
    const projectActivities = sortByNewest(projects)
      .slice(0, 2)
      .map((project) => ({
        id: `project-${project.id}`,
        title: "Project created",
        subtitle: project.name,
        time: timeAgo(project.created_at),
        icon: "folder",
        tone: "green",
      }));

    return [
      {
        id: "workspace-synced",
        title: "Workspace synced",
        subtitle: "Django REST API",
        time: "Just now",
        icon: "settings",
        tone: "blue",
      },
      ...projectActivities,
    ].slice(0, 3);
  }, [projects]);

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
                Backend connection failed
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
