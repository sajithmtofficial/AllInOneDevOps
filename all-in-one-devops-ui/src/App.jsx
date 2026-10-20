import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PagePlaceholder from "./components/PagePlaceholder";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import { placeholderPages } from "./data/mockData";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />

        {Object.entries(placeholderPages).map(([path, page]) => (
          <Route
            key={path}
            path={path}
            element={<PagePlaceholder page={page} path={path} />}
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
