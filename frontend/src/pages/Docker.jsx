import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaDocker,
  FaRocket,
  FaSync,
  FaTrash,
  FaTerminal,
} from "react-icons/fa";
import "../styles/pages.css";

const API_URL = "http://127.0.0.1:8000/api";

const authHeaders = () => {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Docker() {
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [containers, setContainers] = useState([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState(null);

  const fetchResources = () =>
    Promise.all([
      axios.get(`${API_URL}/docker/images/`, { headers: authHeaders() }),
      axios.get(`${API_URL}/docker/containers/`, { headers: authHeaders() }),
    ]);

  const applyData = (imageResponse, containerResponse) => {
    setImages(imageResponse.data.images || []);
    setContainers(containerResponse.data.containers || []);
    setAvailable(true);
    setLoading(false);
  };

  const applyError = (err) => {
    const data = err.response?.data;
    if (data?.available === false) {
      setAvailable(false);
    }
    setError(
      data?.error || err.message || "Could not load Docker resources."
    );
    setLoading(false);
  };

  const load = async () => {
    try {
      const [imageResponse, containerResponse] = await fetchResources();
      applyData(imageResponse, containerResponse);
    } catch (err) {
      applyError(err);
    }
  };

  useEffect(() => {
    fetchResources()
      .then(([imageResponse, containerResponse]) =>
        applyData(imageResponse, containerResponse)
      )
      .catch(applyError);
  }, []);

  const refresh = () => {
    setLoading(true);
    setError("");
    load();
  };

  const removeContainer = async (name) => {
    try {
      await axios.post(
        `${API_URL}/docker/containers/${encodeURIComponent(name)}/remove/`,
        {},
        { headers: authHeaders() }
      );
      if (logs?.container === name) {
        setLogs(null);
      }
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not remove the container."
      );
    }
  };

  const removeImage = async (image) => {
    try {
      await axios.post(
        `${API_URL}/docker/images/${encodeURIComponent(image)}/remove/`,
        {},
        { headers: authHeaders() }
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not remove the image.");
    }
  };

  const showLogs = async (name) => {
    if (logs?.container === name) {
      setLogs(null);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/docker/containers/${encodeURIComponent(name)}/logs/`,
        { headers: authHeaders() }
      );
      setLogs({ container: name, text: response.data.logs || "(no logs)" });
    } catch (err) {
      setError(err.response?.data?.error || "Could not read container logs.");
    }
  };

  return (
    <div className="page">
      <p className="page-eyebrow">CONTAINERS</p>
      <h1>Docker</h1>
      <p className="page-sub">
        Images built by the CI/CD pipeline and the containers it deployed.
      </p>

      <div className="docker-toolbar">
        <button
          className="page-btn secondary"
          onClick={refresh}
          disabled={loading}
        >
          <FaSync /> {loading ? "Refreshing..." : "Refresh"}
        </button>

        <button className="page-btn" onClick={() => navigate("/cicd")}>
          <FaRocket /> Run a Pipeline
        </button>
      </div>

      {!available && (
        <div className="page-card">
          <h2>Docker is not available</h2>
          <p className="page-muted">{error}</p>
        </div>
      )}

      {available && error && <p className="page-error">{error}</p>}

      {available && (
        <>
          <section className="page-card">
            <h2>
              <FaDocker /> Images ({images.length})
            </h2>

            {images.length === 0 ? (
              <div className="page-empty">
                <p className="page-muted">
                  No images yet. Run a pipeline on a repository that contains a
                  Dockerfile at its root.
                </p>
              </div>
            ) : (
              <div className="docker-list">
                {images.map((image) => {
                  const name = `${image.Repository}:${image.Tag}`;

                  return (
                    <div className="docker-item" key={image.ID}>
                      <div>
                        <h3>{name}</h3>
                        <p className="docker-meta">
                          ID: {image.ID} · Size: {image.Size} · Created:{" "}
                          {image.CreatedSince}
                        </p>
                      </div>

                      <div className="docker-actions">
                        <button
                          className="page-btn danger"
                          onClick={() => removeImage(name)}
                        >
                          <FaTrash /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="page-card">
            <h2>
              <FaDocker /> Containers ({containers.length})
            </h2>

            {containers.length === 0 ? (
              <div className="page-empty">
                <p className="page-muted">
                  No deployed containers yet. Enable "Deploy the built image as
                  a container" in CI/CD.
                </p>
              </div>
            ) : (
              <div className="docker-list">
                {containers.map((container) => {
                  const running = container.State === "running";

                  return (
                    <div className="docker-item" key={container.ID}>
                      <div>
                        <h3>
                          {container.Names}{" "}
                          <span
                            className={
                              running ? "docker-running" : "docker-stopped"
                            }
                          >
                            {container.State}
                          </span>
                        </h3>
                        <p className="docker-meta">
                          Image: {container.Image}
                        </p>
                        <p className="docker-meta">Status: {container.Status}</p>
                        <p className="docker-meta">
                          Ports: {container.Ports || "none"}
                        </p>
                      </div>

                      <div className="docker-actions">
                        <button
                          className="page-btn secondary"
                          onClick={() => showLogs(container.Names)}
                        >
                          <FaTerminal /> Logs
                        </button>

                        <button
                          className="page-btn danger"
                          onClick={() => removeContainer(container.Names)}
                        >
                          <FaTrash /> Stop & remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {logs && (
              <div className="docker-logs-wrap">
                <h3>Logs — {logs.container}</h3>
                <pre className="docker-logs">{logs.text}</pre>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
