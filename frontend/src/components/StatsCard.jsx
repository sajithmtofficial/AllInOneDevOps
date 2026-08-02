import "../styles/cards.css";

function StatsCard({ title, value, icon, color, subtitle }) {
  return (
    <div
      className="stats-card"
      style={{
        borderTop: `4px solid ${color}`,
      }}
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