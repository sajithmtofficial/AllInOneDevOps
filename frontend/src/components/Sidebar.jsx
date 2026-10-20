
import {
  FaHome,
  FaFolder,
  FaGitAlt,
  FaDocker,
  FaJenkins,
  FaChartLine,
  FaRobot,
  FaCogs,
  FaSignOutAlt,
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/sidebar.css";

const menuItems = [
  { label: "Dashboard", path: "/", icon: FaHome },
  { label: "Projects", path: "/projects", icon: FaFolder },
  { label: "Git", path: "/git", icon: FaGitAlt },
  { label: "Docker", path: "/docker", icon: FaDocker },
  { label: "Jenkins", path: "/jenkins", icon: FaJenkins },
  { label: "Monitoring", path: "/monitoring", icon: FaChartLine },
  { label: "AI Assistant", path: "/ai-assistant", icon: FaRobot },
  { label: "CI/CD", path: "/cicd", icon: FaChartLine },
  { label: "Settings", path: "/settings", icon: FaCogs },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <h2 className="logo">DevOps</h2>

      <ul>
        {menuItems.map(({ label, path, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}

        <li>
          <button
            type="button"
            className="sidebar-link sidebar-logout"
            onClick={logout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}
