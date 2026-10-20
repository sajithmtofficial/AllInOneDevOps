import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import "../styles/pages.css";

const LANGUAGES = [
  "Python",
  "Java",
  "JavaScript",
  "C++",
  "Go",
  "C#",
];

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    language: "Python",
    github_url: "",
    branch: "main",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/projects/${id}/`)
      .then((response) => {
        setForm({
          name: response.data.name || "",
          description: response.data.description || "",
          language: response.data.language || "Python",
          github_url: response.data.github_url || "",
          branch: response.data.branch || "main",
        });
      })
      .catch(() => {
        setError("Could not load this project. Check that Django is running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const update = (field) => (e) => {
    setForm((previous) => ({ ...previous, [field]: e.target.value }));
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/projects/${id}/`,
        form
      );

      navigate(`/project/${id}`, { state: { project: response.data } });
    } catch (err) {
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not save the project."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p className="page-muted">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <p className="page-eyebrow">PROJECT</p>
      <h1>Edit Project</h1>
      <p className="page-sub">Update your project details.</p>

      <section className="page-card" style={{ maxWidth: "600px" }}>
        <form onSubmit={save}>
          <label className="page-label">Project Name</label>
          <input
            className="page-input"
            value={form.name}
            onChange={update("name")}
            placeholder="My project"
          />

          <label className="page-label">Description</label>
          <textarea
            className="page-textarea"
            value={form.description}
            onChange={update("description")}
            placeholder="What is this project about?"
          />

          <label className="page-label">Language</label>
          <select
            className="page-select"
            value={form.language}
            onChange={update("language")}
          >
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>

          <label className="page-label">GitHub Repository URL</label>
          <input
            className="page-input"
            type="url"
            value={form.github_url}
            onChange={update("github_url")}
            placeholder="https://github.com/username/repository"
          />

          <label className="page-label">Branch</label>
          <input
            className="page-input"
            value={form.branch}
            onChange={update("branch")}
            placeholder="main"
          />

          {error && <p className="page-error">{error}</p>}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button className="page-btn" type="submit" disabled={saving}>
              <FaSave /> {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              className="page-btn secondary"
              type="button"
              onClick={() => navigate(`/project/${id}`)}
            >
              <FaArrowLeft /> Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
