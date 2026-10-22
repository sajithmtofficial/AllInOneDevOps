import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, GitBranch, Plus, User } from "lucide-react";
import { DockerWhale, InfinityLogo, Icon } from "./icons";
import { useAuth } from "../context/AuthContext";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-xl">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-indigo-200">
        <Calendar size={17} />
      </span>
      <div className="leading-tight">
        <p className="text-xs font-medium text-white/90">{date}</p>
        <p className="mt-0.5 font-mono text-[11px] tracking-wide text-indigo-200/80">
          {time}
        </p>
      </div>
    </div>
  );
}

function FloatingTile({ icon, className, delay = "0s" }) {
  return (
    <div
      className={`animate-float absolute z-20 grid h-14 w-14 place-items-center rounded-2xl border backdrop-blur-xl ${className}`}
      style={{ animationDelay: delay }}
    >
      {icon}
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="relative mx-auto h-[200px] w-full max-w-[450px]">
      <div className="hero-grid absolute inset-0 opacity-50" />
      <div className="animate-pulse-glow absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-24 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-2xl" />

      <FloatingTile
        delay="-1.2s"
        className="left-0 top-2 border-sky-300/25 bg-gradient-to-br from-sky-400/30 via-sky-500/10 to-blue-900/40 text-sky-300 shadow-[0_18px_45px_-18px_rgba(56,189,248,0.85)] sm:left-2 sm:top-3"
        icon={<DockerWhale className="h-7 w-8" />}
      />
      <FloatingTile
        delay="-3.4s"
        className="right-0 top-2 border-orange-300/25 bg-gradient-to-br from-orange-400/30 via-orange-500/10 to-red-900/40 text-orange-300 shadow-[0_18px_45px_-18px_rgba(251,146,60,0.85)] sm:right-2 sm:top-3"
        icon={<GitBranch size={24} />}
      />
      <FloatingTile
        delay="-2.1s"
        className="bottom-2 left-1 border-rose-300/25 bg-gradient-to-br from-rose-400/30 via-rose-500/10 to-purple-900/40 text-rose-300 shadow-[0_18px_45px_-18px_rgba(251,113,133,0.85)] sm:bottom-3 sm:left-3"
        icon={<User size={24} />}
      />
      <FloatingTile
        delay="-4.8s"
        className="bottom-2 right-0 border-violet-300/25 bg-gradient-to-br from-violet-400/30 via-violet-500/10 to-blue-900/40 text-violet-300 shadow-[0_18px_45px_-18px_rgba(167,139,250,0.85)] sm:bottom-3 sm:right-3"
        icon={<Icon name="cloud" size={24} />}
      />

      <div
        className="absolute left-1/2 top-1/2 z-10 w-[205px] sm:w-[245px]"
        style={{ transform: "translate(-50%, -50%) perspective(900px) rotateY(-6deg) rotateX(2deg)" }}
      >
        <div className="relative rounded-[22px] border border-white/15 bg-gradient-to-br from-slate-600/80 via-slate-800 to-slate-950 p-2 shadow-[0_40px_80px_-30px_rgba(2,6,23,1)]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[15px] border border-white/10 bg-[#080d21]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(99,102,241,0.38),transparent_62%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.07),transparent_40%)]" />

            <div className="absolute inset-0 grid place-items-center">
              <div className="relative">
                <div className="absolute inset-0 scale-125 rounded-full bg-indigo-500/25 blur-2xl" />
                <InfinityLogo className="relative h-20 w-20 drop-shadow-[0_0_28px_rgba(129,140,248,0.95)] sm:h-24 sm:w-24" />
              </div>
            </div>

            <div className="absolute left-3 top-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            </div>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-[8px] tracking-wide text-slate-300">
                devops@platform
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto h-2.5 w-[108%] -translate-x-[4%] rounded-b-[18px] bg-gradient-to-b from-slate-600 to-slate-900 shadow-lg" />
        <div className="mx-auto mt-1 h-1 w-[38%] rounded-full bg-white/10" />
      </div>

      <span className="absolute left-[18%] top-[38%] h-1.5 w-1.5 rounded-full bg-indigo-300 shadow-[0_0_12px_3px_rgba(165,180,252,0.6)]" />
      <span className="absolute right-[20%] top-[30%] h-1 w-1 rounded-full bg-violet-300 shadow-[0_0_10px_2px_rgba(196,181,253,0.6)]" />
      <span className="absolute bottom-[24%] left-[42%] h-1 w-1 rounded-full bg-sky-300 shadow-[0_0_10px_2px_rgba(125,211,252,0.6)]" />
    </div>
  );
}

export default function HeroBanner() {
  const { username } = useAuth();
  const displayName = username || "there";

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#2a145c] via-[#151d49] to-[#0b1b3f] shadow-[0_40px_100px_-50px_rgba(79,70,229,0.8)]">
      <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-violet-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_40%,rgba(96,165,250,0.16),transparent_45%)]" />

      <div className="relative z-10 grid items-center gap-6 p-5 sm:p-6 lg:p-6 xl:grid-cols-[1.05fr_0.95fr] xl:p-7">
        <div className="max-w-[600px]">
          <div className="mb-5 flex items-center justify-between gap-3 sm:hidden">
            <p className="text-sm font-medium text-violet-200/90">
              Good to see you again
            </p>
          </div>

          <p className="mb-3 hidden text-sm font-medium text-violet-200/90 sm:block">
            Good to see you again
          </p>

          <h1 className="text-[30px] font-bold leading-[1.12] tracking-tight text-white sm:text-[36px] lg:text-[40px] xl:text-[44px]">
            Welcome Back,{" "}
            <span className="text-gradient">{displayName}!</span>
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300/85 sm:text-[15px]">
            Manage your DevOps platform from one powerful dashboard.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/projects?new=1"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-16px_rgba(124,58,237,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151d49]"
            >
              <Plus size={17} />
              New Project
            </Link>

            <Link
              to="/editor"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151d49]"
            >
              <span className="font-mono text-[12px] text-violet-200">
                &lt;/&gt;
              </span>
              Open Code Editor
            </Link>
          </div>

          <div className="mt-5 sm:hidden">
            <LiveClock />
          </div>
        </div>

        <div className="relative flex flex-col">
          <div className="z-30 hidden justify-end sm:flex">
            <LiveClock />
          </div>
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
