import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CodeEditor from "./pages/CodeEditor";
import Git from "./pages/Git";
import Docker from "./pages/Docker";
import Jenkins from "./pages/Jenkins";
import CICD from "./pages/CICD";
import Monitoring from "./pages/Monitoring";
import Logs from "./pages/Logs";
import History from "./pages/History";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import JoinProject from "./pages/JoinProject";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/join/:token" element={<JoinProject />} />
        <Route path="/editor" element={<CodeEditor />} />
        <Route path="/git" element={<Git />} />
        <Route path="/docker" element={<Docker />} />
        <Route path="/jenkins" element={<Jenkins />} />
        <Route path="/cicd" element={<CICD />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/history" element={<History />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
