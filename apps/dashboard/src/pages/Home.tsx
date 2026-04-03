import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";

type ProjectSummary = {
  record?: { status?: string; priority?: string };
  state?: { stage?: string; blocked?: boolean; requiresHumanApproval?: boolean };
  backlog?: { storyCount?: number; taskCount?: number };
  lastUpdated?: string;
};

export default function Home() {
  const [rows, setRows] = useState<
    { projectId: string; summary: ProjectSummary | null; loadError?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { projectIds } = await apiGet<{ projectIds: string[] }>("/projects");
        const results = await Promise.all(
          projectIds.map(async (projectId) => {
            try {
              const r = await apiGet<{ summary: ProjectSummary }>(
                `/projects/${encodeURIComponent(projectId)}/summary`,
              );
              return { projectId, summary: r.summary };
            } catch (e) {
              return {
                projectId,
                summary: null,
                loadError: e instanceof Error ? e.message : String(e),
              };
            }
          }),
        );
        if (!cancelled) setRows(results);
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

  const totalProjects = rows.length;
  const blockedProjects = rows.filter((row) => row.summary?.state?.blocked === true).length;
  const stages = new Set(rows.map((row) => row.summary?.state?.stage).filter(Boolean)).size;

  return (
    <div className="page-stack">
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Projetos Geridos</p>
            <h2>Vista rápida do portfolio em execução</h2>
          </div>
        </div>
        <div className="metric-grid">
          <article className="metric-card">
            <span>Total</span>
            <strong>{totalProjects}</strong>
          </article>
          <article className="metric-card">
            <span>Bloqueados</span>
            <strong>{blockedProjects}</strong>
          </article>
          <article className="metric-card">
            <span>Stages ativos</span>
            <strong>{stages}</strong>
          </article>
        </div>
      </section>
      <section className="section-card">
        <div className="section-heading">
          <div>
            <h2>Lista de projetos</h2>
            <p className="muted">Abre um projeto para ver chat, snippets de código e operação.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Estado</th>
                <th>Stage</th>
                <th>Prioridade</th>
                <th>Bloqueado</th>
                <th>Aprovação humana</th>
                <th>Backlog</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ projectId, summary, loadError }) => (
                <tr key={projectId}>
                  <td>
                    <Link
                      className="project-link"
                      to={`/app/project/${encodeURIComponent(projectId)}`}
                    >
                      {projectId}
                    </Link>
                  </td>
                  <td>{summary?.record?.status ?? "—"}</td>
                  <td>{summary?.state?.stage ?? "—"}</td>
                  <td>{summary?.record?.priority ?? "—"}</td>
                  <td>
                    {summary?.state?.blocked === true
                      ? "sim"
                      : summary?.state?.blocked === false
                        ? "não"
                        : "—"}
                  </td>
                  <td>{summary?.state?.requiresHumanApproval === true ? "sim" : "—"}</td>
                  <td>
                    {summary?.backlog
                      ? `${summary.backlog.storyCount ?? 0} stories · ${summary.backlog.taskCount ?? 0} tasks`
                      : "—"}
                  </td>
                  <td className="muted">{summary?.lastUpdated ?? loadError ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="muted">Nenhum projeto no registry.</p>}
      </section>
    </div>
  );
}
