import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar({ onMenuClick, softTheme, onToggleTheme, onLogout, onNotify }) {
  const { username } = useAuth();
  const displayName = username || "User";
  const initials = displayName.slice(0, 1).toUpperCase();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const panelRef = useRef(null);
  const [query, setQuery] = useState("");
  const [openPanel, setOpenPanel] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/projects") {
      return;
    }

    setQuery(new URLSearchParams(location.search).get("q") || "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape") {
        searchRef.current?.blur();
        setOpenPanel(null);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpenPanel(null);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();

    if (!term) {
      return;
    }

    navigate(`/projects?q=${encodeURIComponent(term)}`);
    setMobileSearchOpen(false);
  };

  const togglePanel = (panel) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0e1f]/80 backdrop-blur-xl">
      <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <button
          type="button"
          onClick={goBack}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        <form
          onSubmit={submitSearch}
          className="relative hidden min-w-0 flex-1 items-center sm:flex sm:max-w-[900px]"
          role="search"
        >
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 text-slate-500"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, repos, containers, builds..."
            aria-label="Search projects, repositories, containers and builds"
            className="h-12 w-full rounded-xl border border-white/[0.07] bg-[#11162b]/80 pl-11 pr-24 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-violet-500/60 focus:bg-[#11162b] focus:ring-4 focus:ring-violet-500/10"
          />
          <span className="pointer-events-none absolute right-3 inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-medium tracking-wide text-slate-400">
            Ctrl <span className="text-slate-600">+</span> K
          </span>
        </form>

        <button
          type="button"
          onClick={() => setMobileSearchOpen((current) => !current)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 sm:hidden"
          aria-label="Search"
          aria-expanded={mobileSearchOpen}
        >
          <Search size={18} />
        </button>

        <div
          ref={panelRef}
          className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3"
        >
          <button
            type="button"
            onClick={onToggleTheme}
            className="group grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 transition hover:border-violet-500/30 hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
            aria-label={softTheme ? "Switch to deep theme" : "Switch to soft theme"}
            aria-pressed={softTheme}
          >
            {softTheme ? (
              <Sun
                size={18}
                className="text-amber-300 transition-transform duration-300 group-hover:rotate-12"
              />
            ) : (
              <Moon
                size={18}
                className="text-violet-300 transition-transform duration-300 group-hover:-rotate-12"
              />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => togglePanel("notifications")}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
              aria-label="Notifications"
              aria-expanded={openPanel === "notifications"}
            >
              <Bell size={18} />
            </button>

            {openPanel === "notifications" && (
              <div className="fixed inset-x-4 top-[88px] z-50 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11162b] shadow-2xl shadow-black/50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-[320px]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <p className="text-sm font-semibold text-white">
                    Notifications
                  </p>
                </div>

                <div className="px-4 py-8 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/[0.04] text-slate-500 ring-1 ring-white/[0.06]">
                    <Bell size={17} />
                  </span>
                  <p className="mt-3 text-xs font-medium text-slate-300">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    Pipeline and deployment events will appear here.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenPanel(null);
                    navigate("/logs");
                  }}
                  className="w-full border-t border-white/[0.06] py-2.5 text-xs font-medium text-violet-300 transition hover:bg-white/[0.03] hover:text-violet-200"
                >
                  Open pipeline logs
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => togglePanel("profile")}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] py-1.5 pl-1.5 pr-2.5 transition hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
              aria-label="Open account menu"
              aria-expanded={openPanel === "profile"}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-[0_0_20px_-4px_rgba(124,58,237,0.9)]">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-slate-200 sm:block">
                {displayName}
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-500 transition-transform duration-200 ${
                  openPanel === "profile" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openPanel === "profile" && (
              <div className="fixed inset-x-4 top-[88px] z-50 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11162b] shadow-2xl shadow-black/50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-56">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="text-sm font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Signed in to All In One DevOps
                  </p>
                </div>

                <div className="p-1.5">
                  <Link
                    to="/settings"
                    onClick={() => setOpenPanel(null)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <User size={15} />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setOpenPanel(null)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <Settings size={15} />
                    Settings
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenPanel(null);
                    onLogout?.();
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-white/[0.06] px-4 py-3 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-white/[0.06] px-4 py-3 sm:hidden">
          <form onSubmit={submitSearch} className="relative flex items-center">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 text-slate-500"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder="Search projects, repos, containers..."
              aria-label="Search projects, repositories, containers and builds"
              className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#11162b] pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
            />
          </form>
        </div>
      )}
    </header>
  );
}

export default Navbar;
