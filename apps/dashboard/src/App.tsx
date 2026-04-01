import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Project from "./pages/Project";

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="brand">
          aios-celx
        </Link>
        <nav>
          <Link to="/">Projetos</Link>
          <Link to="/portfolio">Portfolio</Link>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/project/:projectId" element={<Project />} />
        </Routes>
      </main>
    </div>
  );
}
