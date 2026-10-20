import { ArrowUp } from "lucide-react";
import { DockerWhale, Icon } from "./icons";

const tones = {
  purple: {
    border: "border-violet-500/20 hover:border-violet-400/35",
    icon: "bg-gradient-to-br from-violet-500/25 to-indigo-600/10 text-violet-300 ring-violet-400/20",
    line: "from-violet-400/80 via-violet-500/20 to-transparent",
    glow: "group-hover:shadow-[0_22px_50px_-28px_rgba(139,92,246,0.75)]",
    tint: "bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_55%)]",
  },
  blue: {
    border: "border-blue-500/20 hover:border-blue-400/35",
    icon: "bg-gradient-to-br from-blue-500/25 to-cyan-600/10 text-blue-300 ring-blue-400/20",
    line: "from-blue-400/80 via-blue-500/20 to-transparent",
    glow: "group-hover:shadow-[0_22px_50px_-28px_rgba(59,130,246,0.75)]",
    tint: "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_55%)]",
  },
  green: {
    border: "border-emerald-500/20 hover:border-emerald-400/35",
    icon: "bg-gradient-to-br from-emerald-500/25 to-teal-600/10 text-emerald-300 ring-emerald-400/20",
    line: "from-emerald-400/80 via-emerald-500/20 to-transparent",
    glow: "group-hover:shadow-[0_22px_50px_-28px_rgba(16,185,129,0.7)]",
    tint: "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_55%)]",
  },
  orange: {
    border: "border-orange-500/20 hover:border-orange-400/35",
    icon: "bg-gradient-to-br from-orange-500/25 to-amber-600/10 text-orange-300 ring-orange-400/20",
    line: "from-orange-400/80 via-orange-500/20 to-transparent",
    glow: "group-hover:shadow-[0_22px_50px_-28px_rgba(249,115,22,0.7)]",
    tint: "bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_55%)]",
  },
};

function StatCard({ stat }) {
  const tone = tones[stat.tone] ?? tones.purple;

  return (
    <article
      className={`card-glow group relative overflow-hidden rounded-2xl border bg-[#11162b] p-5 transition duration-300 hover:-translate-y-1 ${tone.border} ${tone.glow}`}
    >
      <div className={`pointer-events-none absolute inset-0 ${tone.tint}`} />
      <div
        className={`absolute inset-x-5 top-0 h-px bg-gradient-to-r ${tone.line}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${tone.icon}`}
          >
            {stat.icon === "container" ? (
              <DockerWhale className="h-5 w-6" />
            ) : (
              <Icon name={stat.icon} size={21} />
            )}
          </span>

          <div className="min-w-0">
            <p className="text-[13px] font-medium leading-snug text-slate-400">
              {stat.label}
            </p>
            <p className="mt-1 text-[30px] font-bold leading-none tracking-tight text-white">
              {stat.value}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          {stat.change ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${
                stat.live
                  ? "bg-violet-500/10 text-violet-300 ring-violet-400/10"
                  : "bg-emerald-500/10 text-emerald-400 ring-emerald-400/10"
              }`}
            >
              {!stat.live && <ArrowUp size={12} />}
              {stat.change}
            </span>
          ) : null}
          <p className="mt-1.5 max-w-[84px] text-[10px] leading-tight text-slate-500">
            {stat.note || "vs last week"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default StatCard;
