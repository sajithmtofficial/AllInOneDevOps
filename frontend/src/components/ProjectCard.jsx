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
        <strong>Language:</strong> {project.language}
      </div>

      <div className="project-buttons">
        <button className="btn btn-primary">
          <FaFolderOpen /> Open
        </button>

        <button className="btn btn-warning">
          <FaEdit /> Edit
        </button>

        <button className="btn btn-danger">
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;