import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaGithub,
  FaCode,
} from "react-icons/fa";

function ProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const project = location.state?.project;

  if (!project) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Project not found</h2>

        <button onClick={() => navigate("/")}>
          Go Back
        </button>
      </div>
    );
  }

  // Open the Code Editor
  const openCodeEditor = () => {
    navigate("/editor", {
      state: {
        project: project,
      },
    });
  };

  return (
    <div style={{ padding: "40px" }}>

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "30px",
          padding: "10px 16px",
          cursor: "pointer",
        }}
      >
        <FaArrowLeft />
        Back to Dashboard
      </button>

      {/* Project Name */}
      <h1>{project.name}</h1>

      {/* Description */}
      <p>
        {project.description || "No description available"}
      </p>

      <hr />

      {/* Project Information */}
      <h3>Project Information</h3>

      <p>
        <strong>Language:</strong>{" "}
        {project.language || "Not specified"}
      </p>

      <p>
        <strong>Branch:</strong>{" "}
        {project.branch || "main"}
      </p>

      {/* GitHub Repository */}
      {project.github_url && (
        <p>
          <strong>GitHub:</strong>{" "}

          <a
            href={project.github_url}
            target="_blank"
            rel="noreferrer"
          >
            <FaGithub /> Open Repository
          </a>
        </p>
      )}

      {/* Code Editor */}
      <div style={{ marginTop: "35px" }}>

        <button
          onClick={openCodeEditor}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "13px 22px",
            border: "none",
            borderRadius: "8px",
            background: "#4f46e5",
            color: "white",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <FaCode />
          Open Code Editor
        </button>

      </div>

    </div>
  );
}

export default ProjectDetails;