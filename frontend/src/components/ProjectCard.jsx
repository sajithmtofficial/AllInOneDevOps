import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/cards.css";

import {
  FaFolderOpen,
  FaEdit,
  FaTrash,
  FaStar,
  FaCodeBranch,
  FaUser,
  FaCode,
} from "react-icons/fa";

import { getGithubInfo } from "../services/github";

function ProjectCard({ project }) {
  const navigate = useNavigate();

  const [githubData, setGithubData] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState(false);

  // ==============================
  // LOAD GITHUB INFORMATION
  // ==============================
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


  // ==============================
  // OPEN PROJECT DETAILS
  // ==============================
  const handleOpen = () => {
    navigate(`/project/${project.id}`, {
      state: {
        project: project,
      },
    });
  };


  // ==============================
  // OPEN CODE EDITOR
  // ==============================
  const handleCodeEditor = () => {
    navigate("/editor", {
      state: {
        project: project,
      },
    });
  };


  return (
    <div className="project-card">

      {/* ==============================
          PROJECT HEADER
      ============================== */}

      <div className="project-header">

        <div>
          <h2>{project.name}</h2>
        </div>

        <span className="status">
          ● Active
        </span>

      </div>


      {/* ==============================
          PROJECT DESCRIPTION
      ============================== */}

      <p className="project-description">
        {project.description || "No description available"}
      </p>


      {/* ==============================
          PROJECT INFORMATION
      ============================== */}

      <div className="project-info">

        {/* Language */}
        <div className="info-row">

          <span className="info-label">
            Language
          </span>

          <span className="info-value">
            {project.language || "Not specified"}
          </span>

        </div>


        {/* GitHub */}
        <div className="info-row">

          <span className="info-label">
            GitHub
          </span>

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


        {/* Branch */}
        <div className="info-row">

          <span className="info-label">
            Branch
          </span>

          <span className="info-value">
            {project.branch || "main"}
          </span>

        </div>

      </div>


      {/* ==============================
          GITHUB REPOSITORY
      ============================== */}

      {project.github_url && (

        <div className="github-section">

          {/* GitHub Header */}

          <div className="github-section-header">

            <div>

              <h3>
                GitHub Repository
              </h3>

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

                  {/* Stars */}

                  <div className="github-stat">

                    <FaStar className="stat-icon" />

                    <div>

                      <span className="stat-label">
                        Stars
                      </span>

                      <strong>
                        {githubData.stargazers_count ?? 0}
                      </strong>

                    </div>

                  </div>


                  {/* Forks */}

                  <div className="github-stat">

                    <div className="stat-icon fork-icon">
                      ⑂
                    </div>

                    <div>

                      <span className="stat-label">
                        Forks
                      </span>

                      <strong>
                        {githubData.forks_count ?? 0}
                      </strong>

                    </div>

                  </div>


                  {/* Branch */}

                  <div className="github-stat">

                    <FaCodeBranch className="stat-icon" />

                    <div>

                      <span className="stat-label">
                        Branch
                      </span>

                      <strong>
                        {githubData.default_branch || "main"}
                      </strong>

                    </div>

                  </div>

                </div>


                {/* Repository Details */}

                <div className="github-details">

                  {/* Owner */}

                  <div className="github-detail">

                    <FaUser />

                    <div>

                      <span>
                        Owner
                      </span>

                      <strong>
                        {githubData.owner?.login || "Unknown"}
                      </strong>

                    </div>

                  </div>


                  {/* Repository Name */}

                  <div className="github-detail">

                    <span className="detail-symbol">
                      ●
                    </span>

                    <div>

                      <span>
                        Repository
                      </span>

                      <strong>
                        {githubData.name || project.name}
                      </strong>

                    </div>

                  </div>


                  {/* Last Updated */}

                  <div className="github-detail">

                    <span className="detail-symbol">
                      ↻
                    </span>

                    <div>

                      <span>
                        Last Updated
                      </span>

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


      {/* ==============================
          PROJECT BUTTONS
      ============================== */}

      <div className="project-buttons">

        {/* OPEN */}

        <button
          className="open-btn"
          onClick={handleOpen}
        >

          <FaFolderOpen />

          Open

        </button>


        {/* CODE EDITOR */}

        <button
          className="code-editor-btn"
          onClick={handleCodeEditor}
        >

          <FaCode />

          Code Editor

        </button>


        {/* EDIT */}

        <button
          className="edit-btn"
          onClick={() => {
            console.log(
              "Edit project:",
              project.id
            );
          }}
        >

          <FaEdit />

          Edit

        </button>


        {/* DELETE */}

        <button
          className="delete-btn"
          onClick={() => {
            console.log(
              "Delete project:",
              project.id
            );
          }}
        >

          <FaTrash />

          Delete

        </button>

      </div>

    </div>
  );
}

export default ProjectCard;