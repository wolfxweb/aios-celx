import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Orchestrator from "./pages/Orchestrator";
import Project from "./pages/Project";
import PublicHome from "./pages/PublicHome";
import SystemHome from "./pages/SystemHome";

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <main className="main">
                  <Routes>
                    <Route path="home" element={<SystemHome />} />
                    <Route path="projects" element={<Home />} />
                    <Route path="orchestrator" element={<Orchestrator />} />
                    <Route path="project/:projectId" element={<Project />} />
                    <Route path="*" element={<Navigate to="/app/home" replace />} />
                  </Routes>
                </main>
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
