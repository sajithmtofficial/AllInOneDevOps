import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, LogOut, Moon, Sun, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { username, logout } = useAuth();
  const [softTheme, setSoftTheme] = useState(
    () => localStorage.getItem("softTheme") === "1"
  );
  const [saved, setSaved] = useState(false);

  const toggleTheme = () => {
    const next = !softTheme;
    setSoftTheme(next);
    localStorage.setItem("softTheme", next ? "1" : "0");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-400">
          Preferences
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          Settings
        </h1>
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-[13px]">
          Manage your account and personalise how your workspace looks.
        </p>
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <div className="flex items-center gap-2">
          <User size={15} className="text-violet-300" />
          <h2 className="text-sm font-semibold text-white">Account</h2>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white shadow-[0_0_25px_-6px_rgba(124,58,237,0.9)]">
            {(username || "U").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-base font-semibold text-white">
              {username || "Unknown user"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Signed in to your workspace
            </p>
          </div>
          <Link
            to="/login"
            onClick={logout}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 text-xs font-semibold text-red-300 transition hover:bg-red-500/15"
          >
            <LogOut size={14} />
            Sign out
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-[#11162b] p-5">
        <div className="flex items-center gap-2">
          {softTheme ? (
            <Sun size={15} className="text-amber-300" />
          ) : (
            <Moon size={15} className="text-violet-300" />
          )}
          <h2 className="text-sm font-semibold text-white">Appearance</h2>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          <div>
            <p className="text-xs font-semibold text-slate-200">Soft theme</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Use a lighter background tone across the dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            role="switch"
            aria-checked={softTheme}
            aria-label="Toggle soft theme"
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              softTheme ? "bg-violet-500" : "bg-white/10"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                softTheme ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {saved && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
            <CheckCircle2 size={13} />
            Preference saved.
          </p>
        )}
      </section>

    </div>
  );
}
