import { useNavigate } from "react-router-dom";
import { FaJenkins, FaRocket } from "react-icons/fa";
import "../styles/pages.css";

export default function Jenkins() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <p className="page-eyebrow">AUTOMATION SERVER</p>
      <h1>Jenkins</h1>
      <p className="page-sub">
        Build automation is available through the built-in CI/CD pipeline
        runner.
      </p>

      <div className="page-grid">
        <div className="page-card">
          <FaJenkins size={34} color="#D24939" />
          <h2>Pipeline Runner</h2>
          <p className="page-muted">
            Checkout, build, test and Docker-build any GitHub repository —
            the same jobs you would configure on a Jenkins server.
          </p>
          <button className="page-btn" onClick={() => navigate("/cicd")}>
            <FaRocket /> Open CI/CD
          </button>
        </div>

        <div className="page-card">
          <h2>How it works</h2>
          <p className="page-muted">
            1. Provide a GitHub repository URL and branch.
          </p>
          <p className="page-muted">
            2. The pipeline checks out the code and runs the build and tests.
          </p>
          <p className="page-muted">
            3. A Docker image is built when a Dockerfile exists.
          </p>
        </div>
      </div>
    </div>
  );
}
