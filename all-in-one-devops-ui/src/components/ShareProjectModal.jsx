import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Link2,
  Loader2,
  LogOut,
  RefreshCw,
  Share2,
  Trash2,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import {
  createProjectShare,
  getProjectShare,
  leaveProject,
  removeProjectMember,
  revokeProjectShare,
} from "../services/projects";
import { getApiErrorMessage } from "../utils/apiError";

export default function ShareProjectModal({
  open,
  project,
  onClose,
  onChanged,
}) {
  const [details, setDetails] = useState(null);
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const linkInput = useRef(null);

  const loadShare = useCallback(async () => {
    if (!project) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getProjectShare(project.id);
      setDetails(data.project);
      setShare(data.share);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (!open || !project) {
      setDetails(null);
      setShare(null);
      setError("");
      setCopied(false);
      return;
    }

    loadShare();
  }, [open, project, loadShare]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
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
  }, [open, busy, onClose]);

  if (!open || !project) {
    return null;
  }

  const activeProject = details || project;
  const members = activeProject.members || [];
  const ownerName = activeProject.owner_username || "Legacy workspace";
  const canManage = Boolean(activeProject.can_manage);

  const runAction = async (key, action) => {
    setBusy(key);
    setError("");

    try {
      await action();
      await loadShare();
      onChanged?.();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const handleCreate = () =>
    runAction("create", () => createProjectShare(project.id));

  const handleRotate = () => {
    const confirmed = window.confirm(
      "Regenerate this link? The current link will stop working immediately."
    );
    if (!confirmed) {
      return;
    }

    runAction("rotate", () => createProjectShare(project.id, true));
  };

  const handleRevoke = () => {
    const confirmed = window.confirm(
      "Revoke this share link? New collaborators will no longer be able to join."
    );
    if (!confirmed) {
      return;
    }

    runAction("revoke", () => revokeProjectShare(project.id));
  };

  const handleCopy = async () => {
    if (!share?.url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
    } catch {
      linkInput.current?.focus();
      linkInput.current?.select();
      document.execCommand("copy");
      setCopied(true);
    }
  };

  const handleRemoveMember = (member) => {
    const confirmed = window.confirm(
      `Remove ${member.username} from "${activeProject.name}"?`
    );
    if (!confirmed) {
      return;
    }

    runAction(`remove-${member.id}`, () =>
      removeProjectMember(project.id, member.id)
    );
  };

  const handleLeave = async () => {
    const confirmed = window.confirm(
      `Leave "${activeProject.name}"? You will lose access until you join again.`
    );
    if (!confirmed) {
      return;
    }

    setBusy("leave");
    setError("");

    try {
      await leaveProject(project.id);
      onChanged?.();
      onClose();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setBusy("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#030617]/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/[0.08] bg-[#11162b] p-5 shadow-2xl shadow-black/60 sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/15">
              <Share2 size={18} />
            </span>
            <div className="min-w-0">
              <h2
                id="share-modal-title"
                className="truncate text-base font-semibold text-white"
              >
                Share {activeProject.name}
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Anyone with the link can sign in, join, and edit this
                project's shared files.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busy)}
            aria-label="Close share dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-2.5"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[11px] leading-relaxed text-red-200">{error}</p>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#0b1022] p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-200">
            <Link2 size={14} className="text-violet-300" />
            Invite link
          </div>

          {loading ? (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              Loading link...
            </div>
          ) : share ? (
            <>
              <div className="mt-3 flex gap-2">
                <input
                  ref={linkInput}
                  readOnly
                  value={share.url}
                  aria-label="Project invite link"
                  onFocus={(event) => event.target.select()}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#11162b] px-3 text-[11px] text-slate-300 outline-none focus:border-violet-400/40"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-[11px] font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  {copied ? (
                    <Check size={13} className="text-emerald-400" />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  disabled={Boolean(busy)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={12}
                    className={busy === "rotate" ? "animate-spin" : ""}
                  />
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={Boolean(busy)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/15 bg-red-500/[0.06] px-2.5 py-1.5 text-[10px] font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Revoke link
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                No invite link is active for this project.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                disabled={Boolean(busy)}
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-3.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "create" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Link2 size={13} />
                )}
                Create invite link
              </button>
            </>
          )}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-200">
              <Users size={14} className="text-blue-300" />
              People with access
            </div>
            <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">
              {members.length + 1}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-slate-200">
                  {ownerName}
                </p>
                <p className="text-[10px] text-slate-500">
                  {activeProject.owner_username ? "Owner" : "Shared workspace"}
                </p>
              </div>
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-300">
                Owner
              </span>
            </div>

            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-500/10 text-[10px] font-semibold text-blue-300">
                    {member.username.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-200">
                      {member.username}
                    </p>
                    <p className="text-[10px] capitalize text-slate-500">
                      {member.role}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member)}
                    disabled={Boolean(busy)}
                    title={`Remove ${member.username}`}
                    aria-label={`Remove ${member.username}`}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === `remove-${member.id}` ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <UserMinus size={13} />
                    )}
                  </button>
                )}
              </div>
            ))}

            {members.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/[0.08] px-3 py-4 text-center text-[10px] text-slate-500">
                No collaborators have joined yet.
              </p>
            )}
          </div>
        </div>

        {activeProject.is_member && !activeProject.is_owner && (
          <button
            type="button"
            onClick={handleLeave}
            disabled={Boolean(busy)}
            className="mt-5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-400/15 bg-red-500/[0.06] text-[11px] font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "leave" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <LogOut size={13} />
            )}
            Leave project
          </button>
        )}
      </div>
    </div>
  );
}
