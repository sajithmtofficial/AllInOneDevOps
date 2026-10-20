import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaGithub, FaGitAlt, FaRocket } from "react-icons/fa";
import "../styles/pages.css";

export default function Git() {
  const [projects, setProjects] = useState([]);
  const [repoUrl, setRepoUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/projects/")
      .then((response) => {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setProjects(data.filter((p) => p.github_url));
      })
      .catch((error) => {
        console.error("Failed to load projects:", error);
      });
  }, []);

  const openRepo = () => {
    if (repoUrl.trim()) {
      window.open(repoUrl.trim(), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="page">
      <p className="page-eyebrow">VERSION CONTROL</p>
      <h1>Git</h1>
      <p className="page-sub">
        Open your GitHub repositories and jump into a pipeline build.
      </p>

      <section className="page-card">
        <h2>Open a Repository</h2>
        <label className="page-label">GitHub Repository URL</label>
        <input
          className="page-input"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/username/repository"
        />
        <button className="page-btn" onClick={openRepo}>
          <FaGithub /> Open on GitHub
        </button>
      </section>

      <section className="page-card">
        <h2>Project Repositories</h2>

        {projects.length === 0 ? (
          <div className="page-empty">
            <FaGitAlt size={30} color="#8b5cf6" />
            <p className="page-muted">
              No projects with a GitHub repository yet. Create one from the
              Dashboard first.
            </p>
            <button className="page-btn" onClick={() => navigate("/")}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="page-grid">
            {projects.map((project) => (
              <div className="page-card" key={project.id}>
                <h2 style={{ marginBottom: "8px" }}>{project.name}</h2>
                <p className="page-muted" style={{ overflowWrap: "anywhere" }}>
                  {project.github_url}
                </p>
                <p className="page-muted">
                  Branch: {project.branch || "main"}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <a
                    className="page-btn secondary"
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGithub /> View
                  </a>

                  <button
                    className="page-btn"
                    onClick={() => navigate("/cicd")}
                  >
                    <FaRocket /> Build
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
