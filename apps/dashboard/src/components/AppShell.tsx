import { useState, type ReactNode } from "react";
import { FiFolder, FiHome, FiLogOut, FiMessageSquare } from "react-icons/fi";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth";

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const items = [
    { to: "/app/home", label: "Home", icon: <FiHome size={18} /> },
    { to: "/app/orchestrator", label: "Orchestrator", icon: <FiMessageSquare size={18} /> },
    { to: "/app/projects", label: "Projetos", icon: <FiFolder size={18} /> },
  ];

  return (
    <div className={`app-layout ${collapsed ? "app-layout-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/app/home" className="brand">
            {collapsed ? "ai" : "aios-celx"}
          </Link>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className="sidebar-link">
              <span className="sidebar-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="muted small sidebar-user">{user?.name}</p>
          <button type="button" className="sidebar-logout" onClick={logout}>
            <span className="sidebar-icon" aria-hidden="true">
              <FiLogOut size={18} />
            </span>
            <span className="sidebar-label">Sair</span>
          </button>
        </div>
      </aside>
      <div className="app-content">{children}</div>
    </div>
  );
}
