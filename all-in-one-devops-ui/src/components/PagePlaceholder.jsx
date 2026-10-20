import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Sparkles,
} from "lucide-react";
import { Icon } from "./icons";

const tones = {
  purple: {
    icon: "bg-violet-500/12 text-violet-300 ring-violet-400/20",
    glow: "bg-violet-500/20",
    button: "from-[#7c3aed] to-[#4f46e5]",
  },
  blue: {
    icon: "bg-blue-500/12 text-blue-300 ring-blue-400/20",
    glow: "bg-blue-500/20",
    button: "from-blue-600 to-indigo-600",
  },
  green: {
    icon: "bg-emerald-500/12 text-emerald-300 ring-emerald-400/20",
    glow: "bg-emerald-500/20",
    button: "from-emerald-600 to-teal-600",
  },
  orange: {
    icon: "bg-orange-500/12 text-orange-300 ring-orange-400/20",
    glow: "bg-orange-500/20",
    button: "from-orange-600 to-amber-600",
  },
  pink: {
    icon: "bg-pink-500/12 text-pink-300 ring-pink-400/20",
    glow: "bg-pink-500/20",
    button: "from-pink-600 to-rose-600",
  },
};

const checklist = [
  "Layout and visual language are ready",
  "Mock data is wired into this module",
  "Connect your API when the backend is ready",
];

export default function PagePlaceholder({ page, path }) {
  const tone = tones[page.accent] ?? tones.purple;

  return (
    <div className="space-y-6">
      <div>
        <nav
          className="mb-4 flex items-center gap-1.5 text-[11px] text-slate-500"
          aria-label="Breadcrumb"
        >
          <Link
            to="/"
            className="transition hover:text-slate-300 focus:outline-none focus-visible:text-white"
          >
            Dashboard
          </Link>
          <ChevronRight size={12} />
          <span className="text-slate-400">{page.title}</span>
        </nav>

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="flex items-start gap-4">
            <span
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ${tone.icon}`}
            >
              <Icon name={page.icon} size={24} />
            </span>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400">
                {page.eyebrow}
              </p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {page.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                {page.description}
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
          >
            Back to Dashboard
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="card-glow relative isolate min-h-[360px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#11162b] p-6 sm:p-8">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div
            className={`absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl ${tone.glow}`}
          />

          <div className="relative flex h-full flex-col items-center justify-center py-10 text-center">
            <div className="relative">
              <div
                className={`absolute inset-0 scale-150 rounded-full blur-2xl ${tone.glow}`}
              />
              <span
                className={`relative grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] ring-1 ${tone.icon}`}
              >
                <Icon name={page.icon} size={32} />
              </span>
            </div>

            <p className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <Sparkles size={11} className="text-violet-300" />
              Module ready for integration
            </p>

            <h2 className="mt-4 text-xl font-semibold text-white">
              {page.title} is coming together
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              This route is part of the complete dashboard shell. The visual
              system, navigation and responsive layout are ready for your real
              API data.
            </p>

            <Link
              to="/"
              className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${tone.button} px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
            >
              Return to overview
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        <section className="card-glow rounded-2xl border border-white/[0.06] bg-[#11162b] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Module status
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Integration checklist
          </h2>

          <div className="mt-5 space-y-3">
            {checklist.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
              >
                {index < 2 ? (
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />
                ) : (
                  <Clock3
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-400"
                  />
                )}
                <p className="text-xs leading-relaxed text-slate-300">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-violet-400/15 bg-violet-500/[0.06] p-4">
            <p className="text-xs font-medium text-violet-200">
              Route: <span className="font-mono text-violet-300">{path}</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Replace this placeholder content with the real module when the
              backend endpoints are connected.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
