import { useState } from "react";
import {
  FaRocket,
  FaUserCircle,
  FaChevronDown,
  FaUser,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const username = localStorage.getItem("username") || "User";

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="logo">
        <FaRocket />
        <span>All In One DevOps</span>
      </div>

      {/* Profile */}
      <div className="profile-container">
       <div
        className={`user-profile ${showMenu ? "active-profile" : ""}`}
        onClick={() => setShowMenu(!showMenu)}
       >
        <FaUserCircle className="profile-icon" />
        <span>{username}</span>
        <FaChevronDown />
      </div>

        {showMenu && (
          <div className="profile-menu">
            {/* Header */}
            <div className="profile-header">
              <FaUserCircle className="profile-avatar" />
              <h4>{username}</h4>
              <p>Developer</p>
            </div>

            {/* Menu */}
            <div className="menu-item">
              <FaUser />
              <span>My Profile</span>
            </div>

            <div className="menu-item">
              <FaCog />
              <span>Settings</span>
            </div>

            <div
              className="menu-item logout"
              onClick={logout}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;