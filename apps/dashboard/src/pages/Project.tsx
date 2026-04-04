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

type TaskRow = {
  id: string;
  storyId: string;
  title: string;
  description?: string;
  type?: string;
  status: string;
  files?: string[];
};

type WorkbenchFile = {
  path: string;
  kind: "doc" | "backlog" | "code";
  snippet: string;
};

type ProjectWorkbenchContext = {
  projectId: string;
  roots: string[];
  summary: unknown;
  state: unknown;
  autonomy: unknown;
  queuePreview: QueueItemRow[];
  relevantFiles: WorkbenchFile[];
};

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

type ChatSummary = {
  chatId: string;
  title: string;
  runner: string;
  model: string;
  updatedAt: string;
  messageCount: number;
};

type PersistedChat = ChatSummary & {
  scope: "global" | "project";
  projectId: string | null;
  status: string;
  createdAt: string;
  messages: ChatMessage[];
};

type ExecutionMode = "auto" | "manual";

type RuntimeSnapshot = {
  status: "stopped" | "running";
  url: string | null;
  port: number | null;
  pid: number | null;
  command: string | null;
  startedAt: string | null;
};

type ProjectRuntimeStatus = {
  projectId: string;
  web: RuntimeSnapshot;
  api: RuntimeSnapshot;
};

type RuntimeTarget = "web" | "api" | "all";

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readBooleanLabel(value: unknown, yes = "Sim", no = "Não"): string {
  return value === true ? yes : no;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function formatStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  const map: Record<string, string> = {
    todo: "Pendentes",
    in_progress: "Em andamento",
    blocked: "Bloqueadas",
    done: "Finalizadas",
    ready: "Prontas",
    review: "Em revisão",
    qa: "QA",
    active: "Em andamento",
    archived: "Finalizado",
    paused: "Pausado",
  };
  return map[normalized] ?? status.replace(/_/g, " ");
}

function compactId(value: string): string {
  return value.length > 10 ? value.slice(0, 8) : value;
}

function queueStatusOrder(status?: string): number {
  switch (status) {
    case "running":
      return 0;
    case "ready":
      return 1;
    case "pending":
      return 2;
    case "failed":
      return 3;
    case "done":
      return 4;
    default:
      return 5;
  }
}

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = projectId ?? "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<unknown>(null);
  const [state, setState] = useState<unknown>(null);
  const [queueItems, setQueueItems] = useState<QueueItemRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [memory, setMemory] = useState<unknown>(null);
  const [autonomy, setAutonomy] = useState<unknown>(null);
  const [context, setContext] = useState<ProjectWorkbenchContext | null>(null);
  const [schedulerMsg, setSchedulerMsg] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [chatInput, setChatInput] = useState("Analisa este projeto e resume o código principal.");
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<PersistedChat | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>("todo");
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("manual");
  const [executionModeBusy, setExecutionModeBusy] = useState(false);
  const [prepareBusy, setPrepareBusy] = useState(false);
  const [runtime, setRuntime] = useState<ProjectRuntimeStatus | null>(null);
  const [runtimeBusy, setRuntimeBusy] = useState(false);

  async function loadProjectData(projectId: string) {
    const [sRes, stRes, qRes, tRes, mRes, aRes, executionRes, runtimeRes] = await Promise.all([
      apiGet<{ summary: unknown }>(`/projects/${encodeURIComponent(projectId)}/summary`).catch(() => null),
      apiGet<{ state: unknown }>(`/projects/${encodeURIComponent(projectId)}/state`).catch(() => null),
      apiGet<{ items: QueueItemRow[] }>(`/projects/${encodeURIComponent(projectId)}/queue`),
      apiGet<{ tasks: TaskRow[] }>(`/projects/${encodeURIComponent(projectId)}/tasks`).catch(() => null),
      apiGet<{ memory: unknown }>(`/projects/${encodeURIComponent(projectId)}/memory`).catch(() => null),
      apiGet<{ autonomy: unknown }>(`/projects/${encodeURIComponent(projectId)}/autonomy`),
      apiGet<{ mode: ExecutionMode }>(`/projects/${encodeURIComponent(projectId)}/execution-mode`).catch(() => null),
      apiGet<ProjectRuntimeStatus>(`/projects/${encodeURIComponent(projectId)}/runtime`).catch(() => null),
    ]);
    const contextRes = await apiGet<{ context: ProjectWorkbenchContext }>(
      `/projects/${encodeURIComponent(projectId)}/context`,
    ).catch(() => null);

    setSummary(sRes?.summary ?? null);
    setState(stRes?.state ?? null);
    setQueueItems(Array.isArray(qRes.items) ? qRes.items : []);
    setTasks(Array.isArray(tRes?.tasks) ? tRes.tasks : []);
    setMemory(mRes?.memory ?? null);
    setAutonomy(aRes?.autonomy ?? null);
    setContext(contextRes?.context ?? null);
    setExecutionMode(executionRes?.mode === "auto" ? "auto" : "manual");
    setRuntime(runtimeRes ?? null);
  }

  async function refreshProjectChats(projectId: string, targetChatId?: string) {
    const list = await apiGet<{ chats: ChatSummary[] }>(
      `/chats?scope=project&projectId=${encodeURIComponent(projectId)}`,
    );
    setChatSummaries(list.chats);
    const nextId = targetChatId ?? list.chats[0]?.chatId;
    if (nextId) {
      const chat = await apiGet<{ chat: PersistedChat }>(`/chats/${encodeURIComponent(nextId)}`);
      setActiveChat(chat.chat);
    } else {
      const created = await apiPost<{ chat: PersistedChat }>("/chats", {
        scope: "project",
        projectId,
        title: `Conversa do projeto ${projectId}`,
      });
      setActiveChat(created.chat);
      setChatSummaries([
        {
          chatId: created.chat.chatId,
          title: created.chat.title,
          runner: created.chat.runner,
          model: created.chat.model,
          updatedAt: created.chat.updatedAt,
          messageCount: created.chat.messages.length,
        },
      ]);
    }
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadProjectData(id);
        if (cancelled) return;
        await refreshProjectChats(id);
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

  useEffect(() => {
    if (!id) {
      return;
    }
    if (runtime?.web.status !== "running" && runtime?.api.status !== "running") {
      return;
    }
    const timer = window.setInterval(() => {
      void loadProjectData(id);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [id, runtime?.web.status, runtime?.api.status]);

  async function runSchedulerOnce() {
    setRunning(true);
    setSchedulerMsg(null);
    try {
      const r = await apiPost<unknown>(`/projects/${encodeURIComponent(id)}/scheduler/run`, {
        mode: "once",
      });
      setSchedulerMsg(JSON.stringify(r, null, 2));
      await loadProjectData(id);
    } catch (e) {
      setSchedulerMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  async function sendChatMessage() {
    const trimmed = chatInput.trim();
    if (!trimmed || chatBusy || !activeChat) {
      return;
    }
    setChatBusy(true);
    try {
      const r = await apiPost<{ chat: PersistedChat }>(
        `/chats/${encodeURIComponent(activeChat.chatId)}/messages`,
        { message: trimmed },
      );
      setActiveChat(r.chat);
      await refreshProjectChats(id, r.chat.chatId);
      await loadProjectData(id);
      setChatInput("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSchedulerMsg(`Erro ao falar com o agente principal: ${msg}`);
    } finally {
      setChatBusy(false);
    }
  }

  async function createProjectChat() {
    setChatBusy(true);
    try {
      const created = await apiPost<{ chat: PersistedChat }>("/chats", {
        scope: "project",
        projectId: id,
        title: `Nova conversa em ${id}`,
      });
      await refreshProjectChats(id, created.chat.chatId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChatBusy(false);
    }
  }

  async function changeExecutionMode(nextMode: ExecutionMode) {
    if (executionModeBusy || nextMode === executionMode) {
      return;
    }
    setExecutionModeBusy(true);
    try {
      const result = await apiPost<{ mode: ExecutionMode }>(
        `/projects/${encodeURIComponent(id)}/execution-mode`,
        { mode: nextMode },
      );
      setExecutionMode(result.mode);
      if (nextMode === "auto") {
        setSchedulerMsg("Execução automática ativada. A fila será consumida pela VPS quando houver itens elegíveis.");
      } else {
        setSchedulerMsg("Execução manual ativada. A fila só correrá por botão, chat ou chamada explícita.");
      }
      await loadProjectData(id);
    } catch (e) {
      setSchedulerMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setExecutionModeBusy(false);
    }
  }

  async function prepareDevelopmentQueue() {
    if (prepareBusy) {
      return;
    }
    setPrepareBusy(true);
    try {
      const result = await apiPost<{ reply: string }>(`/projects/${encodeURIComponent(id)}/chat`, {
        message: "iniciar desenvolvimento",
      });
      setSchedulerMsg(result.reply);
      await loadProjectData(id);
    } catch (e) {
      setSchedulerMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setPrepareBusy(false);
    }
  }

  async function startProjectRuntime(target: RuntimeTarget = "all") {
    setRuntimeBusy(true);
    try {
      const next = await apiPost<ProjectRuntimeStatus>(`/projects/${encodeURIComponent(id)}/runtime/start`, {
        target,
      });
      setRuntime(next);
      setSchedulerMsg(
        target === "all"
          ? "Projeto iniciado. Usa os botões de abrir para ver no navegador."
          : target === "web"
            ? "Frontend iniciado. Já podes abrir no navegador."
            : "API iniciada. Já podes abrir o endpoint do projeto.",
      );
    } catch (e) {
      setSchedulerMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setRuntimeBusy(false);
    }
  }

  async function stopProjectRuntime(target: RuntimeTarget = "all") {
    setRuntimeBusy(true);
    try {
      const next = await apiPost<ProjectRuntimeStatus>(`/projects/${encodeURIComponent(id)}/runtime/stop`, {
        target,
      });
      setRuntime(next);
      setSchedulerMsg(
        target === "all"
          ? "Processos do projeto parados."
          : target === "web"
            ? "Frontend do projeto parado."
            : "API do projeto parada.",
      );
    } catch (e) {
      setSchedulerMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setRuntimeBusy(false);
    }
  }

  function openRuntime(url: string | null) {
    if (!url) {
      return;
    }
    const updatedUrl = url.replace("127.0.0.1", window.location.hostname);
    window.open(updatedUrl, "_blank", "noopener,noreferrer");
  }

  if (!id) return <p>ID inválido.</p>;
  if (loading) return <p className="muted">A carregar…</p>;
  if (error) return <p className="error">Erro: {error}</p>;

  const summaryData = toRecord(summary);
  const stateData = toRecord(state);
  const autonomyData = toRecord(autonomy);
  const stage = readString(stateData?.stage, "Sem stage");
  const projectStatus = readString(
    summaryData?.record && typeof summaryData.record === "object" ? (summaryData.record as Record<string, unknown>).status : undefined,
    "Sem estado",
  );
  const currentTask = readString(stateData?.currentTaskId, "Sem task ativa");
  const blocked = stateData?.blocked === true;
  const approvalRequired = stateData?.requiresHumanApproval === true;
  const autonomyMode = readString(autonomyData?.mode, "—");
  const contextFiles = context?.relevantFiles ?? [];
  const visibleFiles = contextFiles.slice(0, 10);
  const moreFilesCount = Math.max(contextFiles.length - visibleFiles.length, 0);
  const backlogData =
    summaryData?.backlog && typeof summaryData.backlog === "object"
      ? (summaryData.backlog as Record<string, unknown>)
      : null;
  const memoryData =
    summaryData?.memory && typeof summaryData.memory === "object"
      ? (summaryData.memory as Record<string, unknown>)
      : null;
  const storyCount = typeof backlogData?.storyCount === "number" ? backlogData.storyCount : 0;
  const taskCount = typeof backlogData?.taskCount === "number" ? backlogData.taskCount : 0;
  const memoryCount = typeof memoryData?.entryCount === "number" ? memoryData.entryCount : 0;
  const filteredTasks = tasks.filter((task) => taskFilter === "all" || task.status === taskFilter);
  const queueReadyCount = queueItems.filter((item) => item.status === "ready").length;
  const queuePendingCount = queueItems.filter((item) => item.status === "pending").length;
  const queueRunningCount = queueItems.filter((item) => item.status === "running").length;
  const queueDoneCount = queueItems.filter((item) => item.status === "done").length;
  const queueManualRunnableCount = queueItems.filter(
    (item) => item.status === "pending" || item.status === "ready",
  ).length;
  const visibleQueueItems = [...queueItems]
    .sort((a, b) => {
      const statusDiff = queueStatusOrder(a.status) - queueStatusOrder(b.status);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return (b.priority ?? 0) - (a.priority ?? 0);
    })
    .slice(0, 4);
  const todoTaskCount = tasks.filter((task) => task.status === "todo").length;
  const taskStatusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    const key = task.status || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const statusFilters = [
    { key: "all", label: `Todas ${tasks.length}` },
    ...Object.entries(taskStatusCounts)
      .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
      .map(([status, count]) => ({
        key: status,
        label: `${formatStatusLabel(status)} ${count}`,
      })),
  ];

  return (
    <div className="page-stack">
      <section className="section-card project-hero">
        <p className="small">
          <Link to="/app/projects">← Voltar para projetos</Link>
        </p>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Projeto</p>
            <h2>{id}</h2>
            <p className="muted">
              {blocked
                ? `Projeto bloqueado em ${stage}, com ${queueReadyCount} item(ns) pronto(s) e ${queueRunningCount} em execução.`
                : queueReadyCount > 0
                  ? `Projeto em ${stage}, com ${queueReadyCount} item(ns) pronto(s) para execução real e ${queueRunningCount} em execução.`
                  : `Projeto em ${stage}, sem itens prontos na fila. Task atual: ${currentTask}.`}
            </p>
          </div>
          <div className="hero-actions">
            {queueManualRunnableCount > 0 && !blocked ? (
              <button type="button" onClick={runSchedulerOnce} disabled={running}>
                {running ? "A executar…" : "Executar fila agora"}
              </button>
            ) : (
              <span className="hero-hint">
                {blocked
                  ? "Execução indisponível enquanto o projeto estiver bloqueado."
                  : "Sem itens ready para executar agora."}
              </span>
            )}
          </div>
        </div>
      </section>
      <div className="project-layout">
        <section className="section-card project-chat-card">
          <div className="section-heading">
            <div>
              <h3>Chat do projeto</h3>
              <p className="muted">Conversa com o agente para analisar, decidir e executar.</p>
            </div>
            <button type="button" onClick={createProjectChat} disabled={chatBusy}>
              Nova conversa
            </button>
          </div>
            <div className="chat-layout">
              <div className="chat-sidebar">
                <p className="muted small">Conversas deste projeto</p>
                {chatSummaries.map((chat) => (
                  <button
                    key={chat.chatId}
                  type="button"
                  className={`chat-list-item ${activeChat?.chatId === chat.chatId ? "chat-list-item-active" : ""}`}
                  onClick={async () => {
                    const response = await apiGet<{ chat: PersistedChat }>(
                      `/chats/${encodeURIComponent(chat.chatId)}`,
                    );
                    setActiveChat(response.chat);
                  }}
                >
                  <strong>{chat.title}</strong>
                  <span className="muted small">
                    {chat.messageCount} msg · {formatDate(chat.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
            <div className="chat-main">
              {activeChat && (
                <div className="chat-meta">
                  <span className="badge badge-strong">{activeChat.runner}</span>
                  <span className="badge">{activeChat.model}</span>
                  <span className="badge">{activeChat.messages.length} mensagens</span>
                </div>
              )}
              <div className="chat-log">
                {(activeChat?.messages ?? []).map((message, index) => (
                  <article
                    key={message.id ?? `${message.role}-${index}`}
                    className={`chat-bubble chat-${message.role}`}
                  >
                    <strong>{message.role === "assistant" ? "Agente principal" : "Tu"}</strong>
                    <p>{message.content}</p>
                  </article>
                ))}
                {(activeChat?.messages ?? []).length === 0 && (
                  <div className="chat-empty">
                    <strong>Esta conversa ainda não tem mensagens.</strong>
                    <p className="muted">Começa pedindo uma análise do código, backlog, arquitetura ou próximos passos.</p>
                  </div>
                )}
              </div>
              <div className="chat-controls">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  rows={4}
                  placeholder="Pede uma análise do projeto, do código ou dos próximos passos."
                />
                <div className="chat-actions">
                  <button type="button" onClick={sendChatMessage} disabled={chatBusy}>
                    {chatBusy ? "A responder…" : "Enviar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="project-side-rail">
          <section className="section-card section-card-compact">
            <div className="section-heading">
              <div>
                <h3>Visão rápida</h3>
                <p className="muted">O que importa para operar este projeto agora.</p>
              </div>
            </div>
            <div className="project-stat-grid">
              <article className="project-stat-card">
                <span className="muted">Stories</span>
                <strong>{storyCount}</strong>
              </article>
              <article className="project-stat-card">
                <span className="muted">Tasks</span>
                <strong>{taskCount}</strong>
              </article>
              <article className="project-stat-card">
                <span className="muted">Memória</span>
                <strong>{memoryCount}</strong>
              </article>
              <article className="project-stat-card">
                <span className="muted">Contexto</span>
                <strong>{contextFiles.length}</strong>
              </article>
            </div>
            <div className="overview-list">
              <div className="overview-row">
                <span className="muted">Status</span>
                <strong>{formatStatusLabel(projectStatus)}</strong>
              </div>
              <div className="overview-row">
                <span className="muted">Stage</span>
                <strong>{stage}</strong>
              </div>
              <div className="overview-row">
                <span className="muted">Task atual</span>
                <strong>{currentTask}</strong>
              </div>
              <div className="overview-row">
                <span className="muted">Projeto bloqueado</span>
                <strong>{readBooleanLabel(blocked)}</strong>
              </div>
              <div className="overview-row">
                <span className="muted">Aprovação humana</span>
                <strong>{readBooleanLabel(approvalRequired)}</strong>
              </div>
              <div className="overview-row">
                <span className="muted">Autonomia</span>
                <strong>{autonomyMode}</strong>
              </div>
              <div className="overview-row">
                <span className="muted">API</span>
                <strong>{getApiBase()}</strong>
              </div>
              <div className="overview-row">
                <span className="muted">Fila</span>
                <strong>{queueItems.length} item(ns)</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className="project-bottom-grid">
        <section className="section-card section-card-compact">
          <div className="section-heading section-heading-tight">
            <div>
              <h3>Executar projeto</h3>
              <p className="muted">Sobe o frontend e a API do projeto para teste no navegador.</p>
            </div>
          </div>
          <div className="runtime-status-grid">
            <div className="runtime-status-card">
              <span className="muted">Frontend</span>
              <strong>{runtime?.web.status === "running" ? "A correr" : "Parado"}</strong>
              <span className="muted small">{runtime?.web.url ?? "Sem URL"}</span>
            </div>
            <div className="runtime-status-card">
              <span className="muted">API</span>
              <strong>{runtime?.api.status === "running" ? "A correr" : "Parado"}</strong>
              <span className="muted small">{runtime?.api.url ?? "Sem URL"}</span>
            </div>
          </div>
          <div className="runtime-actions">
            <button type="button" onClick={() => startProjectRuntime("all")} disabled={runtimeBusy}>
              {runtimeBusy ? "A iniciar…" : "Executar projeto"}
            </button>
            <button type="button" onClick={() => stopProjectRuntime("all")} disabled={runtimeBusy}>
              Parar
            </button>
          </div>
          <div className="runtime-actions">
            <button
              type="button"
              onClick={() => startProjectRuntime("web")}
              disabled={runtimeBusy || runtime?.web.status === "running"}
            >
              {runtime?.web.status === "running" ? "Frontend ativo" : "Iniciar frontend"}
            </button>
            <button
              type="button"
              onClick={() => startProjectRuntime("api")}
              disabled={runtimeBusy || runtime?.api.status === "running"}
            >
              {runtime?.api.status === "running" ? "API ativa" : "Iniciar API"}
            </button>
          </div>
          <div className="runtime-actions">
            <button
              type="button"
              onClick={() => openRuntime(runtime?.web.url ?? null)}
              disabled={!runtime?.web.url}
            >
              Abrir frontend
            </button>
            <button
              type="button"
              onClick={() => openRuntime(runtime?.api.url ?? null)}
              disabled={!runtime?.api.url}
            >
              Abrir API
            </button>
          </div>
          <div className="runtime-actions">
            <button
              type="button"
              onClick={() => stopProjectRuntime("web")}
              disabled={runtimeBusy || runtime?.web.status !== "running"}
            >
              Parar frontend
            </button>
            <button
              type="button"
              onClick={() => stopProjectRuntime("api")}
              disabled={runtimeBusy || runtime?.api.status !== "running"}
            >
              Parar API
            </button>
          </div>
        </section>

        <section className="section-card section-card-compact">
          <div className="section-heading section-heading-tight">
            <div>
              <h3>Modo de execução</h3>
              <p className="muted">Controla se a VPS consome a fila sozinha ou só por ação manual.</p>
            </div>
          </div>
          <div className="mode-toggle-row">
            <button
              type="button"
              className={`filter-chip ${executionMode === "manual" ? "filter-chip-active" : ""}`}
              onClick={() => changeExecutionMode("manual")}
              disabled={executionModeBusy}
            >
              Manual
            </button>
            <button
              type="button"
              className={`filter-chip ${executionMode === "auto" ? "filter-chip-active" : ""}`}
              onClick={() => changeExecutionMode("auto")}
              disabled={executionModeBusy}
            >
              Automático
            </button>
          </div>
          {executionMode === "manual" ? (
            <div className="execution-mode-actions">
              {queueManualRunnableCount > 0 && !blocked ? (
                <button type="button" onClick={runSchedulerOnce} disabled={running}>
                  {running ? "A executar…" : "Executar fila agora"}
                </button>
              ) : todoTaskCount > 0 ? (
                <>
                  <button type="button" onClick={prepareDevelopmentQueue} disabled={prepareBusy || blocked}>
                    {prepareBusy ? "A preparar…" : "Preparar fila"}
                  </button>
                  <p className="muted small">
                    Existem tarefas pendentes, mas ainda não há itens elegíveis na fila.
                  </p>
                </>
              ) : (
                <p className="muted small">
                  {blocked
                    ? "Execução manual indisponível enquanto o projeto estiver bloqueado."
                    : "Sem itens pendentes ou prontos para executar manualmente."}
                </p>
              )}
            </div>
          ) : (
            <div className="execution-mode-actions">
              <p className="muted small">
                {queueManualRunnableCount > 0
                  ? "Modo automático ativo. A VPS consome a fila quando houver itens elegíveis."
                  : todoTaskCount > 0
                    ? "Modo automático ativo, mas ainda não há itens elegíveis na fila. Prepara a fila para a VPS começar a consumir."
                    : "Modo automático ativo. Não há itens elegíveis neste momento."}
              </p>
              {queueManualRunnableCount === 0 && todoTaskCount > 0 ? (
                <button type="button" onClick={prepareDevelopmentQueue} disabled={prepareBusy || blocked}>
                  {prepareBusy ? "A preparar…" : "Preparar fila"}
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="section-card section-card-compact">
          <div className="section-heading section-heading-tight">
            <div>
              <h3>Fila de execução</h3>
              <p className="muted">Itens mais próximos de correr.</p>
            </div>
            {queueItems.length > 0 && !blocked ? (
              <button type="button" onClick={runSchedulerOnce} disabled={running}>
                {running ? "A executar…" : "Reexecutar fila"}
              </button>
            ) : null}
          </div>
          {queueItems.length === 0 ? (
            <p className="muted">Sem itens enfileirados.</p>
          ) : (
            <div className="compact-list">
              <p className="muted small">
                {queuePendingCount} pendente(s) · {queueReadyCount} pronto(s) · {queueRunningCount} em execução · {queueDoneCount} concluído(s)
              </p>
              {queueManualRunnableCount === 0 && queueDoneCount > 0 ? (
                <p className="muted small">Os itens visíveis abaixo já foram concluídos. O auto-runner não reexecuta itens `done`.</p>
              ) : null}
              {visibleQueueItems.map((it) => (
                <article key={it.id} className="compact-list-item">
                  <div className="task-list-head">
                    <strong>{compactId(it.id)}</strong>
                    <span className="badge">{it.status ?? "—"}</span>
                  </div>
                  <span className="muted small">
                    {it.type ?? "—"} · prioridade {it.priority ?? "—"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="section-card section-card-compact">
          <div className="section-heading section-heading-tight">
            <div>
              <h3>Tarefas do projeto</h3>
              <p className="muted">Filtro rápido por status.</p>
            </div>
          </div>
          <div className="task-filter-row task-filter-row-compact">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip ${taskFilter === filter.key ? "filter-chip-active" : ""}`}
                onClick={() => setTaskFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="compact-list">
            {filteredTasks.slice(0, 6).map((task) => (
              <article key={task.id} className="task-list-item task-list-item-compact">
                <div className="task-list-head">
                  <strong>{task.id}</strong>
                  <span className="badge">{task.status}</span>
                </div>
                <strong>{task.title}</strong>
                <span className="muted small">
                  {task.type ?? "sem tipo"} · story {task.storyId}
                </span>
              </article>
            ))}
            {filteredTasks.length === 0 ? <p className="muted">Sem tarefas neste filtro.</p> : null}
          </div>
        </section>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <h3>Contexto do código</h3>
            <p className="muted">Documentos e ficheiros mais relevantes para entender o projeto.</p>
          </div>
        </div>
        {context == null ? (
          <p className="muted">Sem contexto expandido.</p>
        ) : (
          <>
            <ul className="stats">
              <li>Raízes: {context.roots.join(", ") || "—"}</li>
              <li>Ficheiros: {context.relevantFiles.length}</li>
              <li>Fila preview: {context.queuePreview.length}</li>
            </ul>
            <div className="context-list">
              {visibleFiles.map((file) => (
                <details key={file.path} className="context-item">
                  <summary className="context-summary">
                    <div>
                      <strong>{file.path}</strong>
                      <p className="muted small">{file.kind}</p>
                    </div>
                    <span className="badge">{file.kind}</span>
                  </summary>
                  <pre className="json snippet-block">{file.snippet || "—"}</pre>
                </details>
              ))}
            </div>
            {moreFilesCount > 0 && (
              <p className="muted small">Mais {moreFilesCount} ficheiro(s) disponíveis no contexto técnico.</p>
            )}
          </>
        )}
      </section>
      <section className="section-card">
        <div className="section-heading">
          <div>
            <h3>Detalhes técnicos</h3>
            <p className="muted">Dados completos do projeto para inspeção quando necessário.</p>
          </div>
        </div>
        <div className="details-stack">
          <details className="technical-details">
            <summary>Resumo bruto do projeto</summary>
            <pre className="json">{summary !== null ? JSON.stringify(summary, null, 2) : "—"}</pre>
          </details>
          <details className="technical-details">
            <summary>Estado</summary>
            <pre className="json">{state !== null ? JSON.stringify(state, null, 2) : "—"}</pre>
          </details>
          <details className="technical-details">
            <summary>Memória</summary>
            <pre className="json">{memory !== null ? JSON.stringify(memory, null, 2) : "—"}</pre>
          </details>
          <details className="technical-details">
            <summary>Autonomia</summary>
            <pre className="json">{autonomy !== null ? JSON.stringify(autonomy, null, 2) : "—"}</pre>
          </details>
          <details className="technical-details">
            <summary>Execução recente</summary>
            {schedulerMsg ? <pre className="json">{schedulerMsg}</pre> : <p className="muted">Sem execução recente.</p>}
          </details>
          <details className="technical-details">
            <summary>Fila completa</summary>
            {queueItems.length === 0 ? (
              <p className="muted">Sem itens.</p>
            ) : (
              <div className="table-wrap">
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
              </div>
            )}
          </details>
          <details className="technical-details">
            <summary>Tarefas completas</summary>
            {tasks.length === 0 ? (
              <p className="muted">Sem tarefas.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Story</th>
                      <th>Título</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td>{task.id}</td>
                        <td>{task.storyId}</td>
                        <td>{task.title}</td>
                        <td>{task.type ?? "—"}</td>
                        <td>{task.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        </div>
      </section>
    </div>
  );
}
