
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaFolderOpen, FaGithub, FaCode } from "react-icons/fa";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/projects/")
      .then((response) => {
        setProjects(
          Array.isArray(response.data)
            ? response.data
            : response.data.results || []
        );
      })
      .catch((err) => {
        console.error("Failed to load projects:", err);
        setError("Could not load projects. Check that Django is running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#0f172a",
        color: "#f8fafc",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Projects</h1>

      <p style={{ color: "#94a3b8", marginBottom: "30px" }}>
        View and open your existing DevOps projects.
      </p>

      {loading && <p>Loading projects...</p>}

      {error && (
        <p style={{ color: "#f87171" }}>{error}</p>
      )}

      {!loading && !error && projects.length === 0 && (
        <div
          style={{
            padding: "30px",
            border: "1px solid #334155",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <FaFolderOpen size={35} color="#8b5cf6" />

          <h3>No projects found</h3>

          <p style={{ color: "#94a3b8" }}>
            Create a project from your Dashboard first.
          </p>

          <button
            onClick={() => navigate("/")}
            style={buttonStyle}
          >
            Go to Dashboard
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {projects.map((project) => (
          <div
            key={project.id}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "12px",
              padding: "22px",
              overflowWrap: "anywhere",
            }}
          >
            <FaFolderOpen size={25} color="#a78bfa" />

            <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
              {project.name}
            </h2>

            <p style={{ color: "#cbd5e1", minHeight: "44px" }}>
              {project.description || "No description available"}
            </p>

            <p style={{ color: "#94a3b8" }}>
              Language: {project.language || "Not specified"}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() =>
                  navigate(`/project/${project.id}`, {
                    state: { project },
                  })
                }
                style={buttonStyle}
              >
                <FaFolderOpen /> Open
              </button>

              <button
                onClick={() =>
                  navigate("/editor", {
                    state: { project },
                  })
                }
                style={buttonStyle}
              >
                <FaCode /> Editor
              </button>

              {project.github_url && (
                <button
                  onClick={() =>
                    window.open(
                      project.github_url,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  style={buttonStyle}
                >
                  <FaGithub /> GitHub
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 14px",
  border: "none",
  borderRadius: "8px",
  background: "#6d4aff",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};
