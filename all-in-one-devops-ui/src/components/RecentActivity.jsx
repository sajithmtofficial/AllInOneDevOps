import { Link } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { Icon } from "./icons";

const tones = {
  green: {
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_12px_2px_rgba(52,211,153,0.5)]",
  },
  blue: {
    dot: "bg-blue-400",
    glow: "shadow-[0_0_12px_2px_rgba(96,165,250,0.5)]",
  },
  purple: {
    dot: "bg-violet-400",
    glow: "shadow-[0_0_12px_2px_rgba(167,139,250,0.5)]",
  },
  red: {
    dot: "bg-rose-400",
    glow: "shadow-[0_0_12px_2px_rgba(251,113,133,0.5)]",
  },
};

export default function RecentActivity({
  activities = [],
  loading = false,
  error = "",
}) {
  return (
    <section className="card-glow flex h-full min-w-0 flex-col rounded-2xl border border-white/[0.06] bg-[#11162b] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/15">
            <Activity size={16} />
          </span>
          <h2 className="text-[15px] font-semibold text-white">
            Recent Activity
          </h2>
        </div>

        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 transition hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
        >
          View All
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="relative mt-6 flex-1">
        {loading ? (
          <div className="animate-pulse space-y-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                <span className="h-9 w-9 rounded-full bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded bg-white/[0.07]" />
                  <div className="h-2.5 w-36 rounded bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/15 bg-red-500/[0.06] px-4 py-3">
            <p className="text-[11px] leading-relaxed text-red-300">
              {error}
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-6 text-center">
            <p className="text-xs font-medium text-slate-300">
              No activity yet
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Activity will appear as you use the workspace.
            </p>
          </div>
        ) : (
          <>
            <span className="absolute bottom-5 left-[4px] top-5 w-px bg-gradient-to-b from-emerald-400/40 via-blue-400/30 to-transparent" />

            <ul className="space-y-5">
              {activities.map((item) => {
                const tone = tones[item.tone] ?? tones.green;

                return (
                  <li key={item.id} className="relative flex items-center gap-3">
                    <span
                      className={`relative z-10 h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot} ${tone.glow}`}
                    />

                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.06] bg-[#0d1226] text-slate-300">
                      <Icon name={item.icon} size={15} />
                    </span>

                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-100">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {item.subtitle}
                        </p>
                      </div>
                      <span className="shrink-0 pt-0.5 text-[10px] text-slate-500">
                        {item.time}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
