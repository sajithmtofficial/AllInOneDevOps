import { useState } from "react";
import "../styles/cicd.css";

const API_URL = "http://127.0.0.1:8000/api";

export default function CICD() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [buildDocker, setBuildDocker] = useState(true);
  const [running, setRunning] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  const runPipeline = async () => {
    if (!repoUrl.trim()) {
      setError("Enter a GitHub repository URL.");
      return;
    }

    setRunning(true);
    setError("");
    setJob(null);

    try {
      const response = await fetch(`${API_URL}/pipeline/run/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_url: repoUrl.trim(),
          branch: branch.trim() || "main",
          build_docker: buildDocker,
        }),
      });

     const data = await response.json();

/*
  The backend returns HTTP 400 when a pipeline stage fails,
  but it still sends the complete job object with stage logs.

  Always display that job so we can see the actual failure.
*/
if (data.job) {
  setJob(data.job);
}

if (!response.ok) {
  throw new Error(
    data.job?.error ||
    data.error ||
    "Pipeline failed. Check the stage logs below."
  );
}
    } catch (err) {
      setError(err.message || "Could not start the pipeline.");
    } finally {
      setRunning(false);
    }
  };

  const stageIcon = (status) => {
    if (status === "success") return "✓";
    if (status === "failed") return "✕";
    if (status === "running") return "⟳";
    return "○";
  };

  return (
    <div className="cicd-page">
      <div className="cicd-header">
        <div>
          <p className="cicd-eyebrow">DEVOPS AUTOMATION</p>
          <h1>CI/CD Pipeline</h1>
          <p>
            Checkout, build, test and Docker-build your Git repository from
            one place.
          </p>
        </div>
      </div>

      <section className="cicd-card cicd-config">
        <h2>Pipeline Configuration</h2>

        <label>GitHub Repository URL</label>
        <input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/username/repository"
        />

        <div className="cicd-row">
          <div>
            <label>Branch</label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
          </div>

          <label className="docker-option">
            <input
              type="checkbox"
              checked={buildDocker}
              onChange={(e) => setBuildDocker(e.target.checked)}
            />
            Build Docker image when Dockerfile exists
          </label>
        </div>

        <button
          className="pipeline-button"
          onClick={runPipeline}
          disabled={running}
        >
          {running ? "Running Pipeline..." : "▶ Run Pipeline"}
        </button>

        {error && <div className="cicd-error">{error}</div>}
      </section>

      {running && (
        <section className="cicd-card running-card">
          <div className="spinner" />
          <div>
            <h2>Pipeline is running</h2>
            <p>
              Git checkout, build/test and Docker stages are being executed.
            </p>
          </div>
        </section>
      )}

      {job && (
        <section className="cicd-card">
          <div className="pipeline-summary">
            <div>
              <span>Pipeline ID</span>
              <strong>{job.id}</strong>
            </div>
            <div>
              <span>Branch</span>
              <strong>{job.branch}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong className={`status-${job.status}`}>
                {job.status.toUpperCase()}
              </strong>
            </div>
          </div>

          <div className="pipeline-track">
            {job.stages.map((stage, index) => (
              <div className="pipeline-stage" key={`${stage.name}-${index}`}>
                <div className={`stage-icon stage-${stage.status}`}>
                  {stageIcon(stage.status)}
                </div>
                <div className="stage-name">{stage.name}</div>
                <div className={`stage-status stage-${stage.status}`}>
                  {stage.status}
                </div>

                {stage.logs && (
                  <pre className="stage-logs">{stage.logs}</pre>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
