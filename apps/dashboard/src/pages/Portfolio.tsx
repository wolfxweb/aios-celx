import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";

type PortfolioSummaryPayload = {
  portfolioName?: string;
  totalProjects?: number;
  activeCount?: number;
  blockedCount?: number;
  archivedOrPausedCount?: number;
  stageDistribution?: Record<string, number>;
  priorityProjectIds?: string[];
  recentlyUpdated?: { projectId: string; lastUpdated?: string; stage?: string }[];
};

export default function Portfolio() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await apiGet<unknown>("/portfolio/summary");
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="muted">A carregar…</p>;
  if (err) return <p className="error">Erro: {err}</p>;

  const d = data as { summary?: PortfolioSummaryPayload } | null;
  const s = d?.summary;

  return (
    <div>
      <h1>Portfolio</h1>
      {s && (
        <>
          <h2>{s.portfolioName ?? "Portfolio"}</h2>
          <ul className="stats">
            <li>Total: {s.totalProjects ?? 0}</li>
            <li>Ativos: {s.activeCount ?? 0}</li>
            <li>Bloqueados: {s.blockedCount ?? 0}</li>
            <li>Arquivados/pausados: {s.archivedOrPausedCount ?? 0}</li>
          </ul>
          <h3>Distribuição por stage</h3>
          <ul>
            {s.stageDistribution &&
              Object.entries(s.stageDistribution).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
          </ul>
          <h3>Prioridades (ordem)</h3>
          <ol>
            {(s.priorityProjectIds ?? []).map((pid) => (
              <li key={pid}>
                <Link to={`/project/${encodeURIComponent(pid)}`}>{pid}</Link>
              </li>
            ))}
          </ol>
          <h3>Atualizados recentemente</h3>
          <ul>
            {(s.recentlyUpdated ?? []).map((r) => (
              <li key={r.projectId}>
                <Link to={`/project/${encodeURIComponent(r.projectId)}`}>{r.projectId}</Link>
                {" — "}
                {r.stage ?? "?"}
                {" — "}
                {r.lastUpdated ?? ""}
              </li>
            ))}
          </ul>
        </>
      )}
      <details>
        <summary>JSON completo</summary>
        <pre className="json">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}
