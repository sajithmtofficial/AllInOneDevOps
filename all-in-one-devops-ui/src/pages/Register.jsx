import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, AtSign, Eye, EyeOff, Loader2, LockKeyhole, Rocket, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";

export default function Register() {
  const navigate = useNavigate();
  const { token, register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.title = "Create account · All In One DevOps";
    return () => {
      document.title = "All In One DevOps";
    };
  }, []);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      await register(username.trim(), email.trim(), password);
      setSuccess("Account created. Redirecting to sign in...");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[420px] w-[420px] rounded-full bg-indigo-600/12 blur-3xl" />
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#11162b]/90 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="border-b border-white/[0.06] bg-gradient-to-br from-[#2a145c] via-[#151d49] to-[#0b1b3f] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur">
              <Rocket size={20} />
            </span>
            <p className="text-lg font-semibold tracking-tight text-white">
              All In One <span className="text-violet-300">DevOps</span>
            </p>
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Create your account
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300/80">
            Create your account to start building and deploying with confidence.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Username
              </span>
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="your-username"
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Email
              </span>
              <div className="relative">
                <AtSign
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-slate-300">
                Password
              </span>
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0b1022] pl-10 pr-11 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-500/[0.07] px-3.5 py-3"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-[11px] leading-relaxed text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.07] px-3.5 py-3"
              >
                <p className="text-[11px] leading-relaxed text-emerald-200">
                  {success}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-sm font-semibold text-white shadow-[0_16px_35px_-16px_rgba(124,58,237,1)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-semibold text-violet-300 transition hover:text-violet-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
