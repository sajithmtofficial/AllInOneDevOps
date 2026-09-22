import { useEffect, useState } from "react";
import axios from "axios";

import {
  FaFolder,
  FaDocker,
  FaTools,
  FaRocket,
} from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Welcome from "../components/Welcome";
import StatsCard from "../components/StatsCard";
import ProjectCard from "../components/ProjectCard";
import ProjectForm from "../components/ProjectForm";

function Dashboard() {
  const [projects, setProjects] = useState([]);

  // Load projects from Django backend
  const loadProjects = () => {
    axios
      .get("http://127.0.0.1:8000/api/projects/")
      .then((response) => {
        console.log("Projects loaded:", response.data);
        setProjects(response.data);
      })
      .catch((error) => {
        console.error("Error loading projects:", error);
      });
  };

  // Load projects when dashboard opens
  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div>

      {/* ================= NAVBAR ================= */}
      <Navbar />

      {/* ================= MAIN LAYOUT ================= */}
      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 70px)",
        }}
      >

        {/* ================= SIDEBAR ================= */}
        <Sidebar />

        {/* ================= DASHBOARD CONTENT ================= */}
        <div
          style={{
            flex: 1,
            padding: "25px",
          }}
        >

          {/* Welcome Section */}
          <Welcome />


          {/* ================= STATISTICS ================= */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "30px",
              flexWrap: "wrap",
            }}
          >

            {/* Projects */}
            <StatsCard
              title="Projects"
              value={projects.length}
              icon={<FaFolder />}
              color="#7C3AED"
              subtitle="Total Projects"
            />

            {/* Containers */}
            <StatsCard
              title="Containers"
              value="0"
              icon={<FaDocker />}
              color="#2563EB"
              subtitle="Running"
            />

            {/* Builds */}
            <StatsCard
              title="Builds"
              value="0"
              icon={<FaTools />}
              color="#06B6D4"
              subtitle="Today"
            />

            {/* Deployments */}
            <StatsCard
              title="Deployments"
              value="0"
              icon={<FaRocket />}
              color="#EC4899"
              subtitle="Successful"
            />

          </div>


          {/* ================= CREATE PROJECT ================= */}
          <ProjectForm
            refreshProjects={loadProjects}
          />


          {/* ================= PROJECTS ================= */}
          <h2
            style={{
              color: "white",
              marginBottom: "20px",
            }}
          >
            Projects
          </h2>


          {/* Project List */}
          {projects.length === 0 ? (

            <div
              style={{
                color: "#aaa",
                padding: "30px",
                textAlign: "center",
              }}
            >
              No projects found. Create your first project.
            </div>

          ) : (

            projects.map((project) => (

              <ProjectCard
                key={project.id}
                project={project}
              />

            ))

          )}

        </div>

      </div>

    </div>
  );
}

export default Dashboard;