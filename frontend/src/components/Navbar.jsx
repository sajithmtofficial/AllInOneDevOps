import "../styles/navbar.css";
import { FaRocket } from "react-icons/fa";

function Navbar() {
  return (
    <div className="navbar">
      <FaRocket style={{ marginRight: "10px" }} />
      All In One DevOps Platform
    </div>
  );
}

export default Navbar;