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
      {/* New Project Button */}
      <button
        className="new-project-btn"
        onClick={() => setShow(true)}
      >
        + New Project
      </button>

      {/* Popup */}
      {show && (
        <div className="modal-overlay">
          <div className="project-form">

            <h2>Create Project</h2>

            <input
              type="text"
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Language Dropdown */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="">Select Language</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="JavaScript">JavaScript</option>
              <option value="C++">C++</option>
              <option value="Go">Go</option>
              <option value="C#">C#</option>
            </select>

            <div className="project-form-buttons">

              <button
                className="create-btn"
                onClick={submitProject}
              >
                Create Project
              </button>

              <button
                className="cancel-btn"
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