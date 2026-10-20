import { FaChartLine, FaMicrochip, FaHdd, FaMemory } from "react-icons/fa";
import "../styles/pages.css";

const metrics = [
  { label: "CPU Usage", value: "—", icon: <FaMicrochip />, color: "#8b5cf6" },
  { label: "Memory", value: "—", icon: <FaMemory />, color: "#2563EB" },
  { label: "Disk", value: "—", icon: <FaHdd />, color: "#06B6D4" },
];

export default function Monitoring() {
  return (
    <div className="page">
      <p className="page-eyebrow">OBSERVABILITY</p>
      <h1>Monitoring</h1>
      <p className="page-sub">
        System and application metrics will appear here.
      </p>

      <div className="page-grid">
        {metrics.map((metric) => (
          <div className="page-card" key={metric.label}>
            <span style={{ color: metric.color, fontSize: "28px" }}>
              {metric.icon}
            </span>
            <h2 style={{ marginBottom: "6px" }}>{metric.label}</h2>
            <h1 style={{ margin: "8px 0" }}>{metric.value}</h1>
            <p className="page-muted">Coming soon</p>
          </div>
        ))}
      </div>

      <div className="page-card">
        <FaChartLine size={28} color="#8b5cf6" />
        <h2>Metrics collection is not wired up yet</h2>
        <p className="page-muted">
          Connect a monitoring agent (Prometheus, cAdvisor, or similar) to
          start seeing live CPU, memory and disk usage for your containers and
          projects.
        </p>
      </div>
    </div>
  );
}
