import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function PublicHome() {
  const { isAuthenticated, login, defaultCredentials } = useAuth();
  const [username, setUsername] = useState(defaultCredentials?.username ?? "admin");
  const [password, setPassword] = useState(defaultCredentials?.password ?? "aios123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app/home" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="public-shell">
      <section className="public-hero">
        <div className="public-copy">
          <p className="eyebrow">AIOS CELX</p>
          <h1>Área pública de entrada para o sistema operacional.</h1>
          <p className="muted">
            Faz login para entrar no workspace protegido com orquestrador, projetos, portfolio e
            chat multi-conversa.
          </p>
        </div>
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Entrar</h2>
          <label className="field">
            <span>Utilizador</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "A entrar…" : "Entrar no sistema"}
          </button>
          {defaultCredentials && (
            <p className="muted small">
              Utilizador default: <strong>{defaultCredentials.username}</strong> /{" "}
              <strong>{defaultCredentials.password}</strong>
            </p>
          )}
          {error && <p className="error">{error}</p>}
        </form>
      </section>
    </div>
  );
}

