import "../styles/cards.css";
import { FaFolderOpen, FaEdit, FaTrash } from "react-icons/fa";

function ProjectCard({ project }) {
  return (
    <div className="project-card">
      <div className="project-header">
        <h2>{project.name}</h2>

        <span className="status">● Active</span>
      </div>

      <p>{project.description}</p>

      <div className="project-info">
  <p>
    <strong>Language:</strong> {project.language}
  </p>

  <p>
    <strong>GitHub:</strong>{" "}
    {project.github_url ? (
      <a
        href={project.github_url}
        target="_blank"
        rel="noreferrer"
        style={{ color: "#60A5FA" }}
      >
        Repository
      </a>
    ) : (
      "Not Connected"
    )}
  </p>

  <p>
    <strong>Branch:</strong> {project.branch}
  </p>
</div>

      <div className="project-buttons">
        <button className="open-btn">
          <FaFolderOpen /> Open
        </button>

        <button className="edit-btn">
          <FaEdit /> Edit
        </button>

        <button className="delete-btn">
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;