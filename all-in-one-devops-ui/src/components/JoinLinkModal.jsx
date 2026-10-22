import { useEffect, useState } from "react";
import { AlertCircle, Link2, Loader2, LogIn, X } from "lucide-react";
import { joinProjectShare } from "../services/projects";
import { getApiErrorMessage } from "../utils/apiError";

const TOKEN_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export default function JoinLinkModal({ open, onClose, onJoined }) {
  const [link, setLink] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setLink("");
      setError("");
      setJoining(false);
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !joining) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, joining, onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = link.match(TOKEN_PATTERN)?.[0];

    if (!token) {
      setError("Paste the full invite link or the invite token.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      const data = await joinProjectShare(token);
      onJoined(data.project);
      onClose();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#030617]/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !joining) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-link-title"
        className="w-full rounded-t-3xl border border-white/[0.08] bg-[#11162b] p-5 shadow-2xl shadow-black/60 sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/15">
              <Link2 size={18} />
            </span>
            <div>
              <h2
                id="join-link-title"
                className="text-base font-semibold text-white"
              >
                Join with a link
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Paste the invite link a project owner shared with you.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={joining}
            aria-label="Close join dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-[10px] font-medium text-slate-400">
            Invite link
          </span>
          <input
            autoFocus
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="http://localhost:5173/join/..."
            aria-label="Invite link"
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] px-3 text-[11px] text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
          />
        </label>

        {error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3 py-2.5"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed text-red-200">{error}</p>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={joining}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-xs font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joining ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogIn size={14} />
            )}
            {joining ? "Joining..." : "Join project"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={joining}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
