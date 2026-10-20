import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Folder, MoreVertical } from "lucide-react";
import { Icon } from "./icons";

function StatusBadge({ status }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-400/15">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
      {status}
    </span>
  );
}

function ProjectRow({ project }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition duration-200 hover:border-violet-500/25 hover:bg-white/[0.04]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/15 text-violet-300 ring-1 ring-violet-400/20">
        <Icon name={project.icon} size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {project.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <p className="truncate text-xs text-slate-500">
            {project.description}
          </p>
          <span className="sm:hidden">
            <StatusBadge status={project.status} />
          </span>
        </div>
      </div>

      <span className="hidden sm:block">
        <StatusBadge status={project.status} />
      </span>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
          aria-label={`More actions for ${project.name}`}
          aria-expanded={menuOpen}
        >
          <MoreVertical size={17} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-xl border border-white/[0.08] bg-[#171d35] p-1 shadow-2xl shadow-black/50">
            <Link
              to="/projects"
              className="block rounded-lg px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Open project
            </Link>
            <Link
              to="/settings"
              className="block rounded-lg px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Project settings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecentProjects({
  projects = [],
  loading = false,
  error = "",
}) {
  return (
    <section className="card-glow flex h-full min-w-0 flex-col rounded-2xl border border-white/[0.06] bg-[#11162b] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
            <Folder size={16} />
          </span>
          <h2 className="text-[15px] font-semibold text-white">
            Recent Projects
          </h2>
        </div>

        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 transition hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
        >
          View All
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-white/[0.08]" />
                <div className="h-2.5 w-48 rounded bg-white/[0.05]" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/15 bg-red-500/[0.06] px-4 py-3">
            <p className="text-[11px] leading-relaxed text-red-300">
              {error}
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-6 text-center">
            <p className="text-xs font-medium text-slate-300">
              No projects yet
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Create your first project to see it here.
            </p>
            <Link
              to="/projects?new=1"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 transition hover:text-violet-200"
            >
              Create project
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <ProjectRow project={projects[0]} />
        )}
      </div>
    </section>
  );
}
