import { useNavigate } from "react-router-dom";
import { FaDocker, FaRocket, FaFolder } from "react-icons/fa";
import "../styles/pages.css";

export default function Docker() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <p className="page-eyebrow">CONTAINERS</p>
      <h1>Docker</h1>
      <p className="page-sub">
        Docker images are built automatically as part of the CI/CD pipeline.
      </p>

      <div className="page-grid">
        <div className="page-card">
          <FaDocker size={34} color="#2563EB" />
          <h2>Image Builds</h2>
          <p className="page-muted">
            When a project contains a Dockerfile, the pipeline builds an image
            for every successful run.
          </p>
          <button
            className="page-btn"
            onClick={() => navigate("/cicd")}
          >
            <FaRocket /> Run a Pipeline
          </button>
        </div>

        <div className="page-card">
          <FaFolder size={34} color="#8b5cf6" />
          <h2>Projects with Dockerfiles</h2>
          <p className="page-muted">
            Open a project to view its files and check whether a Dockerfile is
            present.
          </p>
          <button
            className="page-btn secondary"
            onClick={() => navigate("/projects")}
          >
            Browse Projects
          </button>
        </div>
      </div>
    </div>
  );
}
