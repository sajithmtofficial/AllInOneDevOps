import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";
import BrandMark from "../components/BrandMark";

import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, login } = useAuth();

  const [username, setUsername] = useState(
    localStorage.getItem("rememberedUser") || ""
  );
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    document.title = "Sign in · All In One DevOps";
    return () => {
      document.title = "All In One DevOps";
    };
  }, []);

  if (token) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      await login(username.trim(), password);

      localStorage.setItem("username", username.trim());

      if (rememberMe) {
        localStorage.setItem("rememberedUser", username.trim());
      } else {
        localStorage.removeItem("rememberedUser");
      }

      navigate(from, { replace: true });
    } catch (requestError) {
      setError(
        requestError.status === 401
          ? "Invalid username or password."
          : getApiErrorMessage(requestError)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ================= BACKGROUND ================= */}

      <div className="login-circle login-circle-left"></div>
      <div className="login-circle login-circle-right"></div>

      <div className="login-glow login-glow-left"></div>
      <div className="login-glow login-glow-right"></div>

      {/* ================= HEADER ================= */}

      <header className="login-header">
        <div className="login-brand">
          <BrandMark
            className="h-9 w-9 rounded-xl sm:h-[52px] sm:w-[52px] sm:rounded-[15px]"
            iconClassName="h-5 w-5 sm:h-8 sm:w-8"
          />

          <div className="login-brand-name">
            AllInOne<span>DevOps</span>
          </div>
        </div>

        <nav className="login-nav">
          <span>Build</span>
          <b>•</b>
          <span>Deploy</span>
          <b>•</b>
          <span>Monitor</span>
          <b>•</b>
          <span>Innovate</span>
        </nav>
      </header>

      {/* ================= MAIN ================= */}

      <main className="login-main">
        {/* ================= LOGIN CARD ================= */}

        <section className="login-card">
          <div className="login-card-content">
            {/* HEADING */}

            <div className="login-heading">
              <h1>
                Welcome <span>Back</span>
              </h1>

              <p>Login to your DevOps platform</p>
            </div>

            {/* FORM */}

            <form onSubmit={handleLogin}>
              {/* USERNAME */}

              <div className="login-input">
                <User className="login-input-icon" size={24} />

                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* PASSWORD */}

              <div className="login-input">
                <LockKeyhole className="login-input-icon" size={24} />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Show or hide password"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>

              {/* OPTIONS */}

              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />

                  <span className="custom-check">✓</span>

                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              {/* ERROR */}

              {error && <div className="login-error">{error}</div>}

              {/* LOGIN BUTTON */}

              <button type="submit" className="login-button" disabled={loading}>
                <span>{loading ? "Logging in..." : "Login"}</span>

                {!loading && <ArrowRight size={22} />}
              </button>
            </form>

            {/* OR */}

            <div className="login-divider">
              <span></span>
              <label>OR</label>
              <span></span>
            </div>

            {/* SIGN UP */}

            <div className="signup-row">
              <span>Don't have an account?</span>

              <button type="button" onClick={() => navigate("/register")}>
                Sign up
              </button>
            </div>
          </div>
        </section>

        {/* ================= QUOTE ================= */}

        <div className="login-quote">
          <p>
            "Automate today
            <br />
            for a better tomorrow"
          </p>

          <div className="quote-line"></div>
        </div>
      </main>

      {/* ================= WAVES ================= */}

      <div className="login-waves">
        <div className="login-wave wave-back"></div>
        <div className="login-wave wave-middle"></div>
        <div className="login-wave wave-front"></div>
      </div>

      {/* ================= FOOTER ================= */}

      <footer className="login-footer">
        <span>© 2026 AllInOneDevOps. All rights reserved.</span>

        <div className="footer-links">
          <button>Privacy</button>
          <i>|</i>
          <button>Terms</button>
          <i>|</i>
          <button>Help</button>
        </div>
      </footer>
    </div>
  );
}
