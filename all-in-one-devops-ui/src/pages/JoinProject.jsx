import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Code2,
  GitBranch,
  Loader2,
  Share2,
  Users,
} from "lucide-react";
import {
  getProjectSharePreview,
  joinProjectShare,
} from "../services/projects";
import { getApiErrorMessage } from "../utils/apiError";

export default function JoinProject() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getProjectSharePreview(token);
        if (active) {
          setPreview(data);
        }
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      active = false;
    };
  }, [token]);

  const openProject = () => {
    navigate(`/editor?project=${preview.project.id}`);
  };

  const handleJoin = async () => {
    setJoining(true);
    setError("");

    try {
      const data = await joinProjectShare(token);
      setPreview((current) => ({
        ...(current || {}),
        project: data.project,
        joined: true,
        is_member: !data.project.is_owner,
      }));
      navigate(`/editor?project=${data.project.id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-3xl border border-white/[0.08] bg-[#11162b] p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400">
          <Share2 size={13} />
          Project invite
        </div>

        {loading ? (
          <div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
            <Loader2 size={28} className="animate-spin text-violet-300" />
            <p className="mt-4 text-sm font-medium text-slate-200">
              Checking your invite link...
            </p>
          </div>
        ) : error && !preview ? (
          <div className="mt-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-300 ring-1 ring-red-400/15">
              <AlertCircle size={24} />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-white">
              Invite unavailable
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-400">
              {error}
            </p>
            <Link
              to="/projects"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
            >
              Go to projects
            </Link>
          </div>
        ) : (
          preview && (
            <>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                {preview.project.name}
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {preview.project.description || "No description provided."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/[0.08] px-2 py-1 text-[10px] font-medium text-blue-300 ring-1 ring-blue-400/10">
                  <Code2 size={11} />
                  {preview.project.language || "Unknown"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-slate-400 ring-1 ring-white/[0.06]">
                  <GitBranch size={11} />
                  {preview.project.branch || "main"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/[0.08] px-2 py-1 text-[10px] font-medium text-violet-300 ring-1 ring-violet-400/10">
                  <Users size={11} />
                  {preview.project.member_count + 1} people
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0b1022] p-4">
                <p className="text-[11px] font-medium text-slate-200">
                  Shared by{" "}
                  {preview.project.owner_username || "the workspace"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Joining gives you shared access to this project and its
                  files. Your saves are shown in the owner's Change History.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3.5 py-2.5 text-[11px] text-red-200"
                >
                  {error}
                </div>
              )}

              {preview.joined ? (
                <div className="mt-6">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] px-3.5 py-2.5 text-[11px] text-emerald-200">
                    <CheckCircle2 size={14} />
                    You already have access to this project.
                  </div>
                  <button
                    type="button"
                    onClick={openProject}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-sm font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5"
                  >
                    Open project
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joining}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-sm font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {joining ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Users size={16} />
                    )}
                    Join and edit
                  </button>
                  <Link
                    to="/projects"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    Not now
                  </Link>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
