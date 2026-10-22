import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { confirmPasswordReset } from "../services/auth";
import { getApiErrorMessage } from "../utils/apiError";

import "../styles/login.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { uid, token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.title = "Reset password · All In One DevOps";
    return () => {
      document.title = "All In One DevOps";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!uid || !token) {
      setError("This password reset link is invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await confirmPasswordReset(uid, token, password);

      setSuccess(
        data?.message || "Password reset successful. You can sign in now."
      );

      setTimeout(() => navigate("/login", { replace: true }), 1500);
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
          New <span>Password</span>
        </h1>

        <p>Choose a new password for your account</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="login-input">
          <LockKeyhole className="login-input-icon" size={24} />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
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

        <div className="login-input">
          <LockKeyhole className="login-input-icon" size={24} />

          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <button
            type="button"
            className="password-eye"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label="Show or hide password"
          >
            {showConfirm ? <EyeOff size={24} /> : <Eye size={24} />}
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        {success && <div className="login-success">{success}</div>}

        <button
          type="submit"
          className="login-button"
          disabled={loading || Boolean(success)}
        >
          <span>{loading ? "Resetting..." : "Reset password"}</span>
        </button>
      </form>

      <div className="login-divider">
        <span></span>
        <label>OR</label>
        <span></span>
      </div>

      <div className="signup-row">
        <span>Back to the platform?</span>

        <button type="button" onClick={() => navigate("/login")}>
          Sign in
        </button>
      </div>
    </AuthLayout>
  );
}
