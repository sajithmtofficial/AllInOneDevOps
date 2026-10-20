import { Link } from "react-router-dom";
import { Icon } from "./icons";

const tones = {
  purple: {
    bg: "from-[#7c3aed] via-[#6d28d9] to-[#4f46e5]",
    shadow: "hover:shadow-[0_24px_50px_-24px_rgba(124,58,237,0.95)]",
    orb: "bg-violet-300/25",
  },
  blue: {
    bg: "from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a]",
    shadow: "hover:shadow-[0_24px_50px_-24px_rgba(37,99,235,0.95)]",
    orb: "bg-blue-300/25",
  },
  green: {
    bg: "from-[#10b981] via-[#059669] to-[#047857]",
    shadow: "hover:shadow-[0_24px_50px_-24px_rgba(16,185,129,0.95)]",
    orb: "bg-emerald-300/25",
  },
  orange: {
    bg: "from-[#f97316] via-[#ea580c] to-[#c2410c]",
    shadow: "hover:shadow-[0_24px_50px_-24px_rgba(249,115,22,0.95)]",
    orb: "bg-orange-200/25",
  },
  pink: {
    bg: "from-[#ec4899] via-[#db2777] to-[#be185d]",
    shadow: "hover:shadow-[0_24px_50px_-24px_rgba(236,72,153,0.95)]",
    orb: "bg-pink-200/25",
  },
};

export default function QuickActionCard({ action }) {
  const tone = tones[action.tone] ?? tones.purple;

  return (
    <Link
      to={action.path}
      className={`group relative isolate flex h-full min-h-[92px] items-center gap-3.5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tone.bg} p-4 shadow-[0_18px_40px_-26px_rgba(2,6,23,0.9)] transition duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1f] ${tone.shadow}`}
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full ${tone.orb} blur-2xl transition duration-300 group-hover:scale-125`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.15),transparent_45%)]" />

      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-sm">
        <Icon name={action.icon} size={19} />
      </span>

      <div className="relative min-w-0">
        <h3 className="text-sm font-semibold text-white">{action.title}</h3>
        <p className="mt-0.5 text-[11px] leading-snug text-white/70">
          {action.description}
        </p>
      </div>
    </Link>
  );
}
