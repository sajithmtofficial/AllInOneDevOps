import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
} from "react-icons/fa";

import { loginUser } from "../services/auth";
import { AuthContext } from "../context/AuthContext";

import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(username, password);

      login(data.access);

      localStorage.setItem("username", username);

      if (rememberMe) {
        localStorage.setItem("rememberedUser", username);
      } else {
        localStorage.removeItem("rememberedUser");
      }

      navigate("/");
    } catch (error) {
      console.error(error);
      setError("Invalid Username or Password.");
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

          <div className="login-cloud-logo">

            <svg
              width="58"
              height="45"
              viewBox="0 0 64 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 39H48C55.2 39 60 34.5 60 28.5C60 22.8 55.6 18.4 50 18C48.2 10.2 41.5 5 33.5 5C24.7 5 17.4 11.3 15.9 19.7C8.7 20.2 4 24.5 4 30.2C4 35.6 9.1 39 18 39Z"
                stroke="url(#cloudGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <defs>
                <linearGradient
                  id="cloudGradient"
                  x1="5"
                  y1="5"
                  x2="58"
                  y2="40"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#8B4CFF" />
                  <stop offset="1" stopColor="#4D8DFF" />
                </linearGradient>
              </defs>
            </svg>

          </div>


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

              <p>
                Login to your DevOps platform
              </p>

            </div>


            {/* FORM */}

            <form onSubmit={handleLogin}>


              {/* USERNAME */}

              <div className="login-input">

                <FaUser className="login-input-icon" />

                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  autoComplete="username"
                />

              </div>


              {/* PASSWORD */}

              <div className="login-input">

                <FaLock className="login-input-icon" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-eye"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label="Show or hide password"
                >

                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}

                </button>

              </div>


              {/* OPTIONS */}

              <div className="login-options">

                <label className="remember-me">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                  />

                  <span className="custom-check">
                    ✓
                  </span>

                  <span>
                    Remember me
                  </span>

                </label>


                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert(
                      "Forgot password functionality will be connected next."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>


              {/* ERROR */}

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >

                <span>
                  {loading
                    ? "Logging in..."
                    : "Login"}
                </span>

                {!loading && (
                  <FaArrowRight />
                )}

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

              <span>
                Don't have an account?
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/signup")
                }
              >
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

        <span>
          © 2026 AllInOneDevOps. All rights reserved.
        </span>

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

export default Login;