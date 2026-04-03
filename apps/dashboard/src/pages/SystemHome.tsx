import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";

type KpiKey =
  | "activeProjects"
  | "readyProjects"
  | "inDevelopmentProjects"
  | "blockedProjects"
  | "tasksInProgress"
  | "tasksTodo"
  | "tasksBlocked"
  | "tasksDone";

type ProjectRow = {
  projectId: string;
  status: string;
  stage: string;
  blocked: boolean;
  requiresHumanApproval: boolean;
  currentTaskId: string | null;
  taskCount: number;
  taskTodoCount: number;
  taskInProgressCount: number;
  taskBlockedCount: number;
  taskDoneCount: number;
  queueReadyCount: number;
  queueRunningCount: number;
  updatedAt: string | null;
};

export default function SystemHome() {
  const [data, setData] = useState<null | {
    metrics: {
      totalProjects: number;
      activeProjects: number;
      readyProjects: number;
      inDevelopmentProjects: number;
      blockedProjects: number;
      tasksTodo: number;
      tasksInProgress: number;
      tasksBlocked: number;
      tasksDone: number;
    };
    projectsByStage: Record<string, number>;
    tasksByStatus: Record<string, number>;
    projectRows: ProjectRow[];
    workingNow: Array<{
      projectId: string;
      stage: string;
      currentTaskId: string | null;
      queueRunningCount: number;
      taskInProgressCount: number;
      updatedAt: string | null;
    }>;
    readyToAdvance: Array<{
      projectId: string;
      stage: string;
      queueReadyCount: number;
      updatedAt: string | null;
    }>;
    alerts: Array<{
      level: string;
      kind: string;
      projectId: string;
      message: string;
    }>;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState<KpiKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiGet<typeof data>("/workspace/overview");
        if (!cancelled) {
          setData(response);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="muted">A carregar overview do sistema…</p>;
  }

  if (error || !data) {
    return <p className="error">Erro ao carregar workspace: {error ?? "sem dados"}</p>;
  }

  const kpiMeta: Record<KpiKey, { label: string; value: number }> = {
    activeProjects: { label: "Projetos ativos", value: data.metrics.activeProjects },
    readyProjects: { label: "Projetos prontos", value: data.metrics.readyProjects },
    inDevelopmentProjects: { label: "Em desenvolvimento", value: data.metrics.inDevelopmentProjects },
    blockedProjects: { label: "Bloqueados", value: data.metrics.blockedProjects },
    tasksInProgress: { label: "Tasks em andamento", value: data.metrics.tasksInProgress },
    tasksTodo: { label: "Tasks pendentes", value: data.metrics.tasksTodo },
    tasksBlocked: { label: "Tasks bloqueadas", value: data.metrics.tasksBlocked },
    tasksDone: { label: "Tasks finalizadas", value: data.metrics.tasksDone },
  };

  function buildKpiDetails(key: KpiKey): Array<{ title: string; subtitle: string; href: string }> {
    switch (key) {
      case "activeProjects":
        return data.projectRows
          .filter((row) => row.status === "active")
          .map((row) => ({
            title: row.projectId,
            subtitle: `${row.stage} · tasks ${row.taskCount} · ready ${row.queueReadyCount}`,
            href: `/app/project/${encodeURIComponent(row.projectId)}`,
          }));
      case "readyProjects":
        return data.projectRows
          .filter((row) => row.queueReadyCount > 0 && !row.blocked)
          .map((row) => ({
            title: row.projectId,
            subtitle: `${row.stage} · ready ${row.queueReadyCount} · current task ${row.currentTaskId ?? "—"}`,
            href: `/app/project/${encodeURIComponent(row.projectId)}`,
          }));
      case "inDevelopmentProjects":
        return data.projectRows
          .filter((row) => row.taskInProgressCount > 0 || row.queueRunningCount > 0)
          .map((row) => ({
            title: row.projectId,
            subtitle: `${row.stage} · in_progress ${row.taskInProgressCount} · running ${row.queueRunningCount}`,
            href: `/app/project/${encodeURIComponent(row.projectId)}`,
          }));
      case "blockedProjects":
        return data.projectRows
          .filter((row) => row.blocked)
          .map((row) => ({
            title: row.projectId,
            subtitle: `${row.stage} · aprovação ${row.requiresHumanApproval ? "pendente" : "não"}`,
            href: `/app/project/${encodeURIComponent(row.projectId)}`,
          }));
      case "tasksInProgress":
        return data.projectRows
          .filter((row) => row.taskInProgressCount > 0)
          .map((row) => ({
            title: row.projectId,
            subtitle: `tasks em andamento: ${row.taskInProgressCount} · task atual ${row.currentTaskId ?? "—"}`,
            href: `/app/project/${encodeURIComponent(row.projectId)}`,
          }));
      case "tasksTodo":
        return data.projectRows
          .filter((row) => row.taskTodoCount > 0)
          .map((row) => ({
            title: row.projectId,
            subtitle: `tasks pendentes: ${row.taskTodoCount} · stage ${row.stage}`,
            href: `/app/project/${encodeURIComponent(row.projectId)}`,
          }));
      case "tasksBlocked":
        return data.projectRows
          .filter((row) => row.taskBlockedCount > 0 || row.blocked)
          .map((row) => ({
            title: row.projectId,
            subtitle: `tasks bloqueadas: ${row.taskBlockedCount} · projeto ${row.blocked ? "bloqueado" : "ativo"}`,
            href: `/app/project/${encodeURIComponent(row.projectId)}`,
          }));
      case "tasksDone":
        return data.projectRows
          .filter((row) => row.taskDoneCount > 0)
          .map((row) => ({
            title: row.projectId,
            subtitle: `tasks finalizadas: ${row.taskDoneCount} · stage ${row.stage}`,
            href: `/app/project/${encodeURIComponent(row.projectId)}`,
          }));
    }
  }

  const selectedDetails = selectedKpi ? buildKpiDetails(selectedKpi) : [];

  return (
    <div className="page-stack">
      <section className="section-card project-hero">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Home</p>
            <h2>Workspace protegido do utilizador</h2>
            <p className="muted">
              Acede ao orquestrador, projetos e portfolio a partir do menu lateral.
            </p>
          </div>
        </div>
      </section>
      <div className="metric-grid">
        <button type="button" className={`metric-card metric-card-button ${selectedKpi === "activeProjects" ? "metric-card-active" : ""}`} onClick={() => setSelectedKpi("activeProjects")}>
          <span>Projetos ativos</span>
          <strong>{data.metrics.activeProjects}</strong>
        </button>
        <button type="button" className={`metric-card metric-card-button ${selectedKpi === "readyProjects" ? "metric-card-active" : ""}`} onClick={() => setSelectedKpi("readyProjects")}>
          <span>Projetos prontos</span>
          <strong>{data.metrics.readyProjects}</strong>
        </button>
        <button type="button" className={`metric-card metric-card-button ${selectedKpi === "inDevelopmentProjects" ? "metric-card-active" : ""}`} onClick={() => setSelectedKpi("inDevelopmentProjects")}>
          <span>Em desenvolvimento</span>
          <strong>{data.metrics.inDevelopmentProjects}</strong>
        </button>
        <button type="button" className={`metric-card metric-card-button ${selectedKpi === "blockedProjects" ? "metric-card-active" : ""}`} onClick={() => setSelectedKpi("blockedProjects")}>
          <span>Bloqueados</span>
          <strong>{data.metrics.blockedProjects}</strong>
        </button>
        <button type="button" className={`metric-card metric-card-button ${selectedKpi === "tasksInProgress" ? "metric-card-active" : ""}`} onClick={() => setSelectedKpi("tasksInProgress")}>
          <span>Tasks em andamento</span>
          <strong>{data.metrics.tasksInProgress}</strong>
        </button>
        <button type="button" className={`metric-card metric-card-button ${selectedKpi === "tasksTodo" ? "metric-card-active" : ""}`} onClick={() => setSelectedKpi("tasksTodo")}>
          <span>Tasks pendentes</span>
          <strong>{data.metrics.tasksTodo}</strong>
        </button>
        <button type="button" className={`metric-card metric-card-button ${selectedKpi === "tasksBlocked" ? "metric-card-active" : ""}`} onClick={() => setSelectedKpi("tasksBlocked")}>
          <span>Tasks bloqueadas</span>
          <strong>{data.metrics.tasksBlocked}</strong>
        </button>
        <button type="button" className={`metric-card metric-card-button ${selectedKpi === "tasksDone" ? "metric-card-active" : ""}`} onClick={() => setSelectedKpi("tasksDone")}>
          <span>Tasks finalizadas</span>
          <strong>{data.metrics.tasksDone}</strong>
        </button>
      </div>
      {selectedKpi && (
        <div className="kpi-overlay" role="dialog" aria-modal="true" aria-labelledby="kpi-detail-title">
          <div className="kpi-overlay-backdrop" onClick={() => setSelectedKpi(null)} />
          <section className="section-card kpi-dialog">
            <div className="section-heading">
              <div>
                <h3 id="kpi-detail-title">{kpiMeta[selectedKpi].label}</h3>
                <p className="muted">
                  {kpiMeta[selectedKpi].value} item(ns) encontrados para este indicador.
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setSelectedKpi(null)}>
                Fechar
              </button>
            </div>
            <div className="list-card">
              {selectedDetails.map((item) => (
                <div key={`${selectedKpi}-${item.title}-${item.subtitle}`} className="list-row">
                  <Link className="project-link" to={item.href} onClick={() => setSelectedKpi(null)}>
                    {item.title}
                  </Link>
                  <span className="muted">{item.subtitle}</span>
                </div>
              ))}
              {selectedDetails.length === 0 && (
                <p className="muted">Sem itens detalhados para este KPI neste momento.</p>
              )}
            </div>
          </section>
        </div>
      )}
      <div className="panel-grid">
        <section className="section-card">
          <div className="section-heading">
            <div>
              <h3>Projetos em andamento</h3>
              <p className="muted">Trabalho ativo agora no sistema.</p>
            </div>
            <Link className="project-link" to="/app/projects">
              Ver todos
            </Link>
          </div>
          <div className="list-card">
            {data.workingNow.map((item) => (
              <div key={item.projectId} className="list-row">
                <Link className="project-link" to={`/app/project/${encodeURIComponent(item.projectId)}`}>
                  {item.projectId}
                </Link>
                <span className="muted">
                  {item.stage} · task {item.currentTaskId ?? "—"} · running {item.queueRunningCount}
                </span>
              </div>
            ))}
            {data.workingNow.length === 0 && <p className="muted">Sem projetos em execução ativa.</p>}
          </div>
        </section>
        <section className="section-card">
          <div className="section-heading">
            <div>
              <h3>Prontos para avançar</h3>
              <p className="muted">Projetos com fila pronta e sem bloqueio.</p>
            </div>
            <Link className="project-link" to="/app/orchestrator">
              Orquestrar
            </Link>
          </div>
          <div className="list-card">
            {data.readyToAdvance.map((item) => (
              <div key={item.projectId} className="list-row">
                <Link className="project-link" to={`/app/project/${encodeURIComponent(item.projectId)}`}>
                  {item.projectId}
                </Link>
                <span className="muted">
                  {item.stage} · ready {item.queueReadyCount}
                </span>
              </div>
            ))}
            {data.readyToAdvance.length === 0 && <p className="muted">Sem projetos prontos neste momento.</p>}
          </div>
        </section>
      </div>
      <div className="panel-grid">
        <section className="section-card">
          <h3>Pipeline por stage</h3>
          <div className="tag-cloud">
            {Object.entries(data.projectsByStage).map(([stage, count]) => (
              <span key={stage} className="badge badge-strong">
                {stage}: {count}
              </span>
            ))}
          </div>
        </section>
        <section className="section-card">
          <h3>Estado das tasks</h3>
          <div className="tag-cloud">
            {Object.entries(data.tasksByStatus).map(([status, count]) => (
              <span key={status} className="badge">
                {status}: {count}
              </span>
            ))}
          </div>
        </section>
      </div>
      <section className="section-card">
        <div className="section-heading">
          <div>
            <h3>Alertas</h3>
            <p className="muted">Bloqueios, approvals e projetos ociosos que merecem atenção.</p>
          </div>
        </div>
        <div className="list-card">
          {data.alerts.map((alert, index) => (
            <div key={`${alert.projectId}-${index}`} className="list-row">
              <Link className="project-link" to={`/app/project/${encodeURIComponent(alert.projectId)}`}>
                {alert.projectId}
              </Link>
              <span className="muted">
                {alert.level} · {alert.message}
              </span>
            </div>
          ))}
          {data.alerts.length === 0 && <p className="muted">Sem alertas relevantes no momento.</p>}
        </div>
      </section>
      <div className="metric-grid">
        <Link className="nav-card" to="/app/orchestrator">
          <strong>Orchestrator</strong>
          <span>Conversas globais, criação de projetos e decisões do portfolio.</span>
        </Link>
        <Link className="nav-card" to="/app/projects">
          <strong>Projetos</strong>
          <span>Lista operacional dos projetos geridos e respetivo estado.</span>
        </Link>
      </div>
    </div>
  );
}
