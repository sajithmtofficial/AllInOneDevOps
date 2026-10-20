import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [softTheme, setSoftTheme] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (message) => {
    setToast({ id: Date.now(), message });
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    notify("Signed out of the demo workspace.");
  };

  return (
    <div
      className={`app-shell min-h-screen transition-colors duration-300 ${
        softTheme ? "is-soft" : ""
      }`}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-[290px]">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          softTheme={softTheme}
          onToggleTheme={() => setSoftTheme((current) => !current)}
          onLogout={handleLogout}
          onNotify={notify}
        />

        <main className="mx-auto w-full max-w-[1560px] px-4 pb-8 pt-5 sm:px-6 sm:pt-0 lg:px-8">
          <Outlet />
        </main>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-4 z-[80] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-violet-400/20 bg-[#141a33]/95 px-4 py-3 text-sm text-slate-200 shadow-2xl shadow-black/50 backdrop-blur-xl sm:right-6"
        >
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-300">
            <Sparkles size={14} />
          </span>
          <p className="min-w-0 leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="mt-0.5 text-slate-500 transition hover:text-white"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
