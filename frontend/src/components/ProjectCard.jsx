import { useEffect, useState } from "react";
import "../styles/cards.css";

import {
  FaFolderOpen,
  FaEdit,
  FaTrash,
  FaStar,
  FaCodeBranch,
  FaUser,
} from "react-icons/fa";

import { getGithubInfo } from "../services/github";

function ProjectCard({ project }) {
  const [githubData, setGithubData] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState(false);

  useEffect(() => {
    if (!project.github_url) {
      setGithubData(null);
      return;
    }

    const fetchGithubData = async () => {
      try {
        setGithubLoading(true);
        setGithubError(false);

        const data = await getGithubInfo(project.github_url);

        setGithubData(data);
      } catch (error) {
        console.error("GitHub API Error:", error);
        setGithubError(true);
      } finally {
        setGithubLoading(false);
      }
    };

    fetchGithubData();
  }, [project.github_url]);

  return (
    <div className="project-card">

      {/* Project Header */}
      <div className="project-header">
        <div>
          <h2>{project.name}</h2>
        </div>

        <span className="status">● Active</span>
      </div>

      {/* Description */}
      <p className="project-description">
        {project.description}
      </p>

      {/* Project Information */}
      <div className="project-info">

        <div className="info-row">
          <span className="info-label">Language</span>
          <span className="info-value">
            {project.language || "Not specified"}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">GitHub</span>

          <span className="info-value">
            {project.github_url ? (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="github-link"
              >
                Repository
              </a>
            ) : (
              "Not Connected"
            )}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Branch</span>
          <span className="info-value">
            {project.branch || "main"}
          </span>
        </div>

      </div>

      {/* GitHub Section */}
      {project.github_url && (
        <div className="github-section">

          <div className="github-section-header">
            <div>
              <h3>GitHub Repository</h3>
              <span className="github-repository-name">
                {githubData?.name || "Repository"}
              </span>
            </div>

            {githubData && (
              <a
                href={githubData.html_url}
                target="_blank"
                rel="noreferrer"
                className="github-view-btn"
              >
                View on GitHub
              </a>
            )}
          </div>

          {/* Loading */}
          {githubLoading && (
            <div className="github-loading">
              Loading repository information...
            </div>
          )}

          {/* Error */}
          {githubError && (
            <div className="github-error">
              Unable to load GitHub information.
            </div>
          )}

          {/* GitHub Data */}
          {githubData &&
            !githubLoading &&
            !githubError && (
              <>
                {/* Statistics */}
                <div className="github-stats">

                  <div className="github-stat">
                    <FaStar className="stat-icon" />
                    <div>
                      <span className="stat-label">Stars</span>
                      <strong>
                        {githubData.stargazers_count ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="github-stat">
                    <div className="stat-icon fork-icon">
                      ⑂
                    </div>

                    <div>
                      <span className="stat-label">Forks</span>
                      <strong>
                        {githubData.forks_count ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="github-stat">
                    <FaCodeBranch className="stat-icon" />
                    <div>
                      <span className="stat-label">Branch</span>
                      <strong>
                        {githubData.default_branch || "main"}
                      </strong>
                    </div>
                  </div>

                </div>

                {/* Repository Details */}
                <div className="github-details">

                  <div className="github-detail">
                    <FaUser />
                    <div>
                      <span>Owner</span>
                      <strong>
                        {githubData.owner?.login || "Unknown"}
                      </strong>
                    </div>
                  </div>

                  <div className="github-detail">
                    <span className="detail-symbol">●</span>
                    <div>
                      <span>Repository</span>
                      <strong>
                        {githubData.name || project.name}
                      </strong>
                    </div>
                  </div>

                  <div className="github-detail">
                    <span className="detail-symbol">↻</span>
                    <div>
                      <span>Last Updated</span>
                      <strong>
                        {githubData.updated_at
                          ? new Date(
                              githubData.updated_at
                            ).toLocaleDateString()
                          : "Not available"}
                      </strong>
                    </div>
                  </div>

                </div>
              </>
            )}

        </div>
      )}

      {/* Buttons */}
      <div className="project-buttons">

        <button className="open-btn">
          <FaFolderOpen />
          Open
        </button>

        <button className="edit-btn">
          <FaEdit />
          Edit
        </button>

        <button className="delete-btn">
          <FaTrash />
          Delete
        </button>

      </div>

    </div>
  );
}

export default ProjectCard;