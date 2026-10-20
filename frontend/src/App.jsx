
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CodeEditor from "./pages/CodeEditor";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectEdit from "./pages/ProjectEdit";
import CICD from "./pages/CICD";
import Git from "./pages/Git";
import Docker from "./pages/Docker";
import Jenkins from "./pages/Jenkins";
import Monitoring from "./pages/Monitoring";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Code Editor (full-screen IDE, no sidebar) */}
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <CodeEditor />
          </ProtectedRoute>
        }
      />

      {/* All other pages share Navbar + Sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:id" element={<ProjectDetails />} />
        <Route path="/project/:id/edit" element={<ProjectEdit />} />
        <Route path="/cicd" element={<CICD />} />
        <Route path="/git" element={<Git />} />
        <Route path="/docker" element={<Docker />} />
        <Route path="/jenkins" element={<Jenkins />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Unknown routes go back to the dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
