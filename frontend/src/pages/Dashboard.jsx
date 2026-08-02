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

  const loadProjects = () => {
    axios
      .get("http://127.0.0.1:8000/api/projects/")
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div>
      <Navbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <div
          style={{
            flex: 1,
            padding: "25px",
          }}
        >
          <Welcome />

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "30px",
              flexWrap: "wrap",
            }}
          >
            <StatsCard
              title="Projects"
              value={projects.length}
              icon={<FaFolder />}
              color="#7C3AED"
              subtitle="Total Projects"
            />

            <StatsCard
              title="Containers"
              value="0"
              icon={<FaDocker />}
              color="#2563EB"
              subtitle="Running"
            />

            <StatsCard
              title="Builds"
              value="0"
              icon={<FaTools />}
              color="#06B6D4"
              subtitle="Today"
            />

            <StatsCard
              title="Deployments"
              value="0"
              icon={<FaRocket />}
              color="#EC4899"
              subtitle="Successful"
            />
          </div>

          <ProjectForm refreshProjects={loadProjects} />

          <h2 style={{ color: "white", marginBottom: "20px" }}>
            Projects
          </h2>

          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;