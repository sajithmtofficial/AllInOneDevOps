import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { sidebarSections } from "../data/navigation";
import { Icon } from "./icons";
import BrandMark from "./BrandMark";

function navLinkClass({ isActive }) {
  return [
    "group relative flex items-center gap-3 rounded-xl px-3.5 py-2 text-[15px] font-medium sm:py-2.5",
    "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70",
    isActive
      ? "bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.95)]"
      : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
  ].join(" ");
}

export default function Sidebar({ open, onClose, onLogout }) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#030617]/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-white/[0.06] bg-[#0b1022]/95 backdrop-blur-xl transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Primary navigation"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.16),transparent_65%)] pointer-events-none" />

        <div className="relative flex h-20 shrink-0 items-center gap-3 border-b border-white/[0.06] px-6">
          <BrandMark className="h-11 w-11" iconClassName="h-7 w-7" />

          <p className="min-w-0 truncate text-[16px] font-semibold tracking-tight text-white sm:text-[18px]">
            All In One <span className="text-violet-400">DevOps</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto px-4 py-5">
          <div className="px-2">
            <NavLink
              to="/"
              end
              onClick={onClose}
              className={navLinkClass}
            >
              <Icon name="home" size={19} />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {sidebarSections.map((section) => (
            <div key={section.label} className="mt-6">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {section.label}
              </p>

              <div className="space-y-1.5">
                {section.items.map((item) =>
                  item.action === "logout" ? (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        onClose?.();
                        onLogout?.();
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-[15px] font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 sm:py-2.5"
                    >
                      <Icon name={item.icon} size={19} />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      onClick={onClose}
                      className={navLinkClass}
                    >
                      <Icon name={item.icon} size={19} />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
