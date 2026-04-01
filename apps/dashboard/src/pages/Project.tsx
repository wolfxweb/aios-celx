import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPost, getApiBase } from "../api";

type QueueItemRow = {
  id: string;
  type?: string;
  status?: string;
  priority?: number;
  requiresApproval?: boolean;
  reason?: string | null;
};

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = projectId ?? "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<unknown>(null);
  const [state, setState] = useState<unknown>(null);
  const [queueItems, setQueueItems] = useState<QueueItemRow[]>([]);
  const [memory, setMemory] = useState<unknown>(null);
  const [autonomy, setAutonomy] = useState<unknown>(null);
  const [schedulerMsg, setSchedulerMsg] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sRes, stRes, qRes, mRes, aRes] = await Promise.all([
          apiGet<{ summary: unknown }>(`/projects/${encodeURIComponent(id)}/summary`).catch(() => null),
          apiGet<{ state: unknown }>(`/projects/${encodeURIComponent(id)}/state`).catch(() => null),
          apiGet<{ items: QueueItemRow[] }>(`/projects/${encodeURIComponent(id)}/queue`),
          apiGet<{ memory: unknown }>(`/projects/${encodeURIComponent(id)}/memory`).catch(() => null),
          apiGet<{ autonomy: unknown }>(`/projects/${encodeURIComponent(id)}/autonomy`),
        ]);
        if (cancelled) return;
        setSummary(sRes?.summary ?? null);
        setState(stRes?.state ?? null);
        setQueueItems(Array.isArray(qRes.items) ? qRes.items : []);
        setMemory(mRes?.memory ?? null);
        setAutonomy(aRes?.autonomy ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function runSchedulerOnce() {
    setRunning(true);
    setSchedulerMsg(null);
    try {
      const r = await apiPost<unknown>(`/projects/${encodeURIComponent(id)}/scheduler/run`, {
        mode: "once",
      });
      setSchedulerMsg(JSON.stringify(r, null, 2));
    } catch (e) {
      setSchedulerMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  if (!id) return <p>ID inválido.</p>;
  if (loading) return <p className="muted">A carregar…</p>;
  if (error) return <p className="error">Erro: {error}</p>;

  return (
    <div>
      <p>
        <Link to="/">← Projetos</Link>
      </p>
      <h1>{id}</h1>
      <section>
        <h2>Resumo</h2>
        <pre className="json">{summary !== null ? JSON.stringify(summary, null, 2) : "—"}</pre>
      </section>
      <section>
        <h2>Estado</h2>
        <pre className="json">{state !== null ? JSON.stringify(state, null, 2) : "—"}</pre>
      </section>
      <section>
        <h2>Fila</h2>
        {queueItems.length === 0 ? (
          <p className="muted">Sem itens.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Prioridade</th>
                <th>Aprovação</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {queueItems.map((it) => (
                <tr key={it.id}>
                  <td>{it.id}</td>
                  <td>{it.type ?? "—"}</td>
                  <td>{it.status ?? "—"}</td>
                  <td>{it.priority ?? "—"}</td>
                  <td>{it.requiresApproval ? "sim" : "não"}</td>
                  <td>{it.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section>
        <h2>Memória</h2>
        <pre className="json">{memory !== null ? JSON.stringify(memory, null, 2) : "—"}</pre>
      </section>
      <section>
        <h2>Autonomia</h2>
        <pre className="json">{autonomy !== null ? JSON.stringify(autonomy, null, 2) : "—"}</pre>
      </section>
      <section>
        <h2>Scheduler</h2>
        <button type="button" onClick={runSchedulerOnce} disabled={running}>
          {running ? "A correr…" : "Executar scheduler (once)"}
        </button>
        {schedulerMsg && <pre className="json">{schedulerMsg}</pre>}
      </section>
      <p className="muted small">
        API base: {getApiBase()}
      </p>
    </div>
  );
}
