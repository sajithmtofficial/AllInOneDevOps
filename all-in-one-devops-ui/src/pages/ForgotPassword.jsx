import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { requestPasswordReset } from "../services/auth";
import { getApiErrorMessage } from "../utils/apiError";

import "../styles/login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.title = "Forgot password · All In One DevOps";
    return () => {
      document.title = "All In One DevOps";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const data = await requestPasswordReset(email.trim());

      setSuccess(
        data?.message ||
          "If an account with that email exists, a password reset link has been sent."
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-heading">
        <h1>
          Reset <span>Password</span>
        </h1>

        <p>Enter your account email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="login-input">
          <Mail className="login-input-icon" size={24} />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        {success && <div className="login-success">{success}</div>}

        <button type="submit" className="login-button" disabled={loading}>
          <span>{loading ? "Sending..." : "Send reset link"}</span>

          {!loading && <ArrowRight size={22} />}
        </button>
      </form>

      <div className="login-divider">
        <span></span>
        <label>OR</label>
        <span></span>
      </div>

      <div className="signup-row">
        <span>Remembered your password?</span>

        <button type="button" onClick={() => navigate("/login")}>
          Sign in
        </button>
      </div>
    </AuthLayout>
  );
}
