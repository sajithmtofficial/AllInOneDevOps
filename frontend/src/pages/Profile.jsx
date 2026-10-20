import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaCog } from "react-icons/fa";
import "../styles/pages.css";

export default function Profile() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const email = localStorage.getItem("email") || "No email set";

  return (
    <div className="page">
      <p className="page-eyebrow">ACCOUNT</p>
      <h1>My Profile</h1>
      <p className="page-sub">Your account information.</p>

      <section className="page-card">
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <FaUserCircle size={64} color="#8b5cf6" />

          <div>
            <h2 style={{ margin: "0 0 6px" }}>{username}</h2>
            <p className="page-muted" style={{ margin: 0 }}>{email}</p>
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <button
            className="page-btn"
            onClick={() => navigate("/settings")}
          >
            <FaCog /> Edit Settings
          </button>
        </div>
      </section>
    </div>
  );
}
