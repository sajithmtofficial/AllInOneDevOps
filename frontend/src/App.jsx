import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CodeEditor from "./pages/CodeEditor";
import ProjectDetails from "./pages/ProjectDetails";
import CICD from "./pages/CICD";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Project Details */}
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        }
      />

      {/* Code Editor */}
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <CodeEditor />
          </ProtectedRoute>
        }
      />

      {/* CI/CD */}
      <Route
        path="/cicd"
        element={
          <ProtectedRoute>
            <CICD />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;