import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProjectCard.css";

import { getGithubInfo } from "../services/github";

/* =========================================================
   INLINE ICONS
   ========================================================= */

const Icon = {
  Star: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2.5l2.9 6.32 6.9.68-5.2 4.72 1.5 6.78L12 17.9l-6.1 3.1 1.5-6.78-5.2-4.72 6.9-.68z" />
    </svg>
  ),

  Fork: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="12" cy="18" r="2.4" />
      <path d="M6 8.4V12a4 4 0 0 0 4 4M18 8.4V12a4 4 0 0 1-4 4" />
    </svg>
  ),

  Branch: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <circle cx="6" cy="5" r="2.4" />
      <circle cx="6" cy="19" r="2.4" />
      <circle cx="17" cy="12" r="2.4" />
      <path d="M6 7.4V16.6M6 9c0 3.5 3 4.5 8.4 4.7" />
    </svg>
  ),

  User: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6.4 7-6.4s7 2.8 7 6.4" />
    </svg>
  ),

  Repo: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 3.5v17M8 8h8M8 12h8" />
    </svg>
  ),

  Clock: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),

  GitHub: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2C6.48 2 2 6.58 2 12.19c0 4.49 2.87 8.3 6.84 9.65.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.46-1.19-1.11-1.51-1.11-1.51-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.55 2.34 1.11 2.91.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.13-4.56-5.03 0-1.11.39-2.02 1.03-2.73 0 0-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.04a9.3 9.3 0 0 1 5 0c1.91-1.31 2.75-1.04 2.75-1.04.55 1.42.2 2.47.1 2.73.64.71 1.03 1.62 1.03 2.73 0 3.91-2.34 4.77-4.57 5.02.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.19C22 6.58 17.52 2 12 2z" />
    </svg>
  ),

  Open: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h3l2 2h6A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
    </svg>
  ),

  Code: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <path d="M9 6 3 12l6 6M15 6l6 6-6 6" />
    </svg>
  ),

  Edit: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M13.5 7 17 10.5" />
    </svg>
  ),

  Trash: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
    </svg>
  ),
};


/* =========================================================
   STAT TILE
   ========================================================= */

function StatTile({ icon, label, value, accent }) {
  return (
    <div className="stat-tile">
      <span className={`stat-tile-icon accent-${accent}`}>
        {icon}
      </span>

      <div className="stat-tile-text">
        <span className="stat-tile-label">
          {label}
        </span>

        <span className="stat-tile-value">
          {value}
        </span>
      </div>
    </div>
  );
}


/* =========================================================
   PROJECT CARD
   ========================================================= */

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  const [githubData, setGithubData] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState(false);

  /* ---------------------------------------------------------
     GITHUB INFORMATION
     --------------------------------------------------------- */

  useEffect(() => {
    if (!project?.github_url) {
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
  }, [project?.github_url]);


  /* ---------------------------------------------------------
     OPEN PROJECT
     --------------------------------------------------------- */

  const handleOpen = () => {
    if (!project?.id) {
      console.error("Project ID is missing");
      return;
    }

    navigate(`/project/${project.id}`, {
      state: {
        project: project,
      },
    });
  };


  /* ---------------------------------------------------------
     CODE EDITOR
     --------------------------------------------------------- */

  const handleCodeEditor = () => {
    if (!project) {
      console.error("Project information is missing");
      return;
    }

    navigate("/editor", {
      state: {
        project: project,
      },
    });
  };


  /* ---------------------------------------------------------
     EDIT PROJECT
     --------------------------------------------------------- */

  const handleEdit = () => {
    if (!project?.id) {
      console.error("Project ID is missing");
      return;
    }

    navigate(`/project/${project.id}/edit`, {
      state: {
        project: project,
      },
    });
  };


  /* ---------------------------------------------------------
     DELETE PROJECT
     
     IMPORTANT:
     This currently preserves your previous behavior.
     If you already have a delete API, we can connect it later.
     --------------------------------------------------------- */

  const handleDelete = () => {
    if (!project?.id) {
      console.error("Project ID is missing");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) {
      return;
    }

    console.log("Delete project:", project.id);

    /*
      Your old ProjectCard only logged the delete action.

      We keep that behavior here instead of inventing
      a backend delete API that may not exist yet.
    */
  };


  /* ---------------------------------------------------------
     SAFE VALUES
     --------------------------------------------------------- */

  const projectName =
    project?.name || "My project";

  const projectDescription =
    project?.description || "No description available";

  const projectLanguage =
    project?.language || "Not specified";

  const projectBranch =
    project?.branch || "main";

  const projectStatus =
    project?.status || "Active";

  const hasGithub =
    Boolean(project?.github_url);


  /* ---------------------------------------------------------
     GITHUB VALUES
     --------------------------------------------------------- */

  const repositoryName =
    githubData?.name ||
    (project?.github_url
      ? "Repository"
      : projectName);

  const repositoryOwner =
    githubData?.owner?.login ||
    "Unknown";

  const repositoryStars =
    githubData?.stargazers_count ?? 0;

  const repositoryForks =
    githubData?.forks_count ?? 0;

  const repositoryBranch =
    githubData?.default_branch ||
    projectBranch ||
    "main";

  const repositoryUpdated =
    githubData?.updated_at
      ? new Date(
          githubData.updated_at
        ).toLocaleDateString()
      : "Not available";

  const githubUrl =
    githubData?.html_url ||
    project?.github_url ||
    "#";


  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="project-card">

      {/* =====================================================
          TOP SECTION
          ===================================================== */}

      <div className="project-card-top">

        <div>
          <h2 className="project-name">
            {projectName}
          </h2>

          <p className="project-desc">
            {projectDescription}
          </p>
        </div>

        <span className="status-badge">
          <span className="status-dot" />
          {projectStatus}
        </span>

      </div>


      {/* =====================================================
          PROJECT INFORMATION
          ===================================================== */}

      <div className="project-meta">

        {/* Language */}

        <div className="meta-row">

          <span className="meta-label">
            Language
          </span>

          <span className="meta-pill lang-pill">
            {projectLanguage}
          </span>

        </div>


        {/* GitHub */}

        <div className="meta-row">

          <span className="meta-label">
            GitHub
          </span>

          {hasGithub ? (
            <a
              href={project.github_url}
              target="_blank"
              rel="noreferrer"
              className="meta-link"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Repository
            </a>
          ) : (
            <span className="meta-value">
              Not Connected
            </span>
          )}

        </div>


        {/* Branch */}

        <div className="meta-row">

          <span className="meta-label">
            Branch
          </span>

          <span className="meta-value">
            {projectBranch}
          </span>

        </div>

      </div>


      {/* =====================================================
          GITHUB PANEL
          ===================================================== */}

      {hasGithub && (
        <div className="repo-panel">

          {/* Repository Header */}

          <div className="repo-panel-header">

            <div>

              <span className="repo-panel-label">

                <Icon.GitHub
                  className="repo-panel-icon"
                />

                GitHub Repository

              </span>

              <h3 className="repo-panel-name">
                {repositoryName}
              </h3>

            </div>


            {/* View GitHub */}

            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              View on GitHub
            </a>

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


          {/* Repository Data */}

          {!githubLoading &&
            !githubError &&
            githubData && (

              <div className="stat-grid">

                <StatTile
                  icon={<Icon.Star />}
                  label="Stars"
                  value={repositoryStars}
                  accent="amber"
                />

                <StatTile
                  icon={<Icon.Fork />}
                  label="Forks"
                  value={repositoryForks}
                  accent="blue"
                />

                <StatTile
                  icon={<Icon.Branch />}
                  label="Branch"
                  value={repositoryBranch}
                  accent="violet"
                />

                <StatTile
                  icon={<Icon.User />}
                  label="Owner"
                  value={repositoryOwner}
                  accent="pink"
                />

                <StatTile
                  icon={<Icon.Repo />}
                  label="Repository"
                  value={repositoryName}
                  accent="cyan"
                />

                <StatTile
                  icon={<Icon.Clock />}
                  label="Last Updated"
                  value={repositoryUpdated}
                  accent="green"
                />

              </div>
            )}

        </div>
      )}


      {/* =====================================================
          ACTION BUTTONS
          ===================================================== */}

      <div className="project-actions">

        {/* OPEN */}

        <button
          type="button"
          className="btn btn-blue"
          onClick={handleOpen}
        >
          <Icon.Open className="btn-icon" />
          Open
        </button>


        {/* CODE EDITOR */}

        <button
          type="button"
          className="btn btn-violet"
          onClick={handleCodeEditor}
        >
          <Icon.Code className="btn-icon" />
          Code Editor
        </button>


        {/* EDIT */}

        <button
          type="button"
          className="btn btn-amber"
          onClick={handleEdit}
        >
          <Icon.Edit className="btn-icon" />
          Edit
        </button>


        {/* DELETE */}

        <button
          type="button"
          className="btn btn-red"
          onClick={handleDelete}
        >
          <Icon.Trash className="btn-icon" />
          Delete
        </button>

      </div>

    </div>
  );
}