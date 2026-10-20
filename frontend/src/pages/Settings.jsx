import { useState } from "react";
import { FaSave } from "react-icons/fa";
import "../styles/pages.css";

export default function Settings() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [saved, setSaved] = useState(false);

  const save = (e) => {
    e.preventDefault();

    localStorage.setItem("username", username.trim() || "User");
    localStorage.setItem("email", email.trim());

    setSaved(true);
  };

  return (
    <div className="page">
      <p className="page-eyebrow">PREFERENCES</p>
      <h1>Settings</h1>
      <p className="page-sub">Manage your account preferences.</p>

      <section className="page-card">
        <h2>Profile</h2>

        <form onSubmit={save}>
          <label className="page-label">Display Name</label>
          <input
            className="page-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
          />

          <label className="page-label">Email</label>
          <input
            className="page-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <button className="page-btn" type="submit">
            <FaSave /> Save Changes
          </button>

          {saved && <p className="page-success">Settings saved.</p>}
        </form>
      </section>
    </div>
  );
}
