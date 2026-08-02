import { useState } from "react";
import axios from "axios";
import "../styles/cards.css";

function ProjectForm({ refreshProjects }) {
  const [show, setShow] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");

  const submitProject = () => {
    axios
      .post("http://127.0.0.1:8000/api/projects/", {
        name,
        description,
        language,
      })
      .then(() => {
        setName("");
        setDescription("");
        setLanguage("");

        refreshProjects();
        setShow(false);
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      <button
        className="btn btn-success mb-4"
        onClick={() => setShow(true)}
      >
        + New Project
      </button>

      {show && (
        <div className="modal-overlay">
          <div className="project-form">

            <h2>Create Project</h2>

            <input
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              placeholder="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />

            <div className="d-flex gap-3 mt-3">
              <button
                className="btn btn-success"
                onClick={submitProject}
              >
                Create
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShow(false)}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default ProjectForm;