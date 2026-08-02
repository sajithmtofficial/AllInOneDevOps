import "../styles/dashboard.css";
import { FaBell, FaCog, FaUserCircle } from "react-icons/fa";

function Welcome() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="welcome-container">

      <div className="welcome-left">
        <h1>👋 Welcome Back, Sajith!</h1>

        <p>
          Manage your DevOps platform from one powerful dashboard.
        </p>

        <small>{today}</small>
      </div>

      <div className="welcome-right">

        <FaBell className="top-icon"/>

        <FaCog className="top-icon"/>


      </div>

    </div>
  );
}

export default Welcome;