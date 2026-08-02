import {
  FaHome,
  FaFolder,
  FaGitAlt,
  FaDocker,
  FaJenkins,
  FaChartLine,
  FaRobot,
} from "react-icons/fa";

import "../styles/sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="logo">DevOps</h2>

      <ul>
        <li><FaHome /> Dashboard</li>
        <li><FaFolder /> Projects</li>
        <li><FaGitAlt /> Git</li>
        <li><FaDocker /> Docker</li>
        <li><FaJenkins /> Jenkins</li>
        <li><FaChartLine /> Monitoring</li>
        <li><FaRobot /> AI Assistant</li>
      </ul>
    </div>
  );
}

export default Sidebar;