import "../styles/cards.css";
import { useNavigate } from "react-router-dom";

function StatsCard({ title, value, icon, color, subtitle, to }) {
  const navigate = useNavigate();

  return (
    <div
      className="stats-card"
      style={{
        borderTop: `4px solid ${color}`,
        cursor: to ? "pointer" : "default",
      }}
      onClick={to ? () => navigate(to) : undefined}
    >
      <div className="stats-header">
        <div className="stats-icon">{icon}</div>

        <span className="trend">+12%</span>
      </div>

      <h3>{title}</h3>

      <h1>{value}</h1>

      <p>{subtitle}</p>
    </div>
  );
}

export default StatsCard;
