import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../api";

type ChatSummary = {
  chatId: string;
  scope: "global" | "project";
  projectId: string | null;
  title: string;
  runner: string;
  model: string;
  updatedAt: string;
  messageCount: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatRecord = ChatSummary & {
  status: string;
  createdAt: string;
  messages: ChatMessage[];
};

export default function Orchestrator() {
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("listar projetos");
  const [routing, setRouting] = useState<unknown>(null);

  async function refreshChats(targetChatId?: string) {
    const response = await apiGet<{ chats: ChatSummary[] }>("/chats?scope=global");
    setSummaries(response.chats);
    const nextId = targetChatId ?? response.chats[0]?.chatId;
    if (nextId) {
      const chatResponse = await apiGet<{ chat: ChatRecord }>(`/chats/${encodeURIComponent(nextId)}`);
      setActiveChat(chatResponse.chat);
    } else {
      setActiveChat(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const route = await apiGet<{ config: unknown }>("/model-routing").catch(() => null);
        if (!cancelled) {
          setRouting(route?.config ?? null);
        }
        await refreshChats();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createChat() {
    setBusy(true);
    try {
      const response = await apiPost<{ chat: ChatRecord }>("/chats", {
        scope: "global",
        title: "Nova conversa global",
      });
      await refreshChats(response.chat.chatId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function openChat(chatId: string) {
    setBusy(true);
    try {
      const response = await apiGet<{ chat: ChatRecord }>(`/chats/${encodeURIComponent(chatId)}`);
      setActiveChat(response.chat);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    if (!activeChat || !message.trim()) {
      return;
    }
    setBusy(true);
    try {
      const response = await apiPost<{ chat: ChatRecord }>(
        `/chats/${encodeURIComponent(activeChat.chatId)}/messages`,
        { message },
      );
      setActiveChat(response.chat);
      setMessage("");
      await refreshChats(response.chat.chatId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="muted">A carregar…</p>;
  if (error) return <p className="error">Erro: {error}</p>;

  return (
    <div className="page-stack">
      <section className="section-card project-hero">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Orchestrator</p>
            <h2>Conversas globais do agente principal</h2>
            <p className="muted">
              Cria projetos, muda prioridade e acompanha o portfolio a partir de várias conversas.
            </p>
          </div>
          <div className="hero-actions">
            <button type="button" onClick={createChat} disabled={busy}>
              Nova conversa
            </button>
          </div>
        </div>
      </section>
      <div className="panel-grid panel-grid-wide">
        <section className="section-card">
          <h3>Conversas</h3>
          <div className="list-card">
            {summaries.map((chat) => (
              <button
                key={chat.chatId}
                type="button"
                className={`chat-list-item ${activeChat?.chatId === chat.chatId ? "chat-list-item-active" : ""}`}
                onClick={() => openChat(chat.chatId)}
              >
                <strong>{chat.title}</strong>
                <span className="muted small">
                  {chat.runner} · {chat.model}
                </span>
              </button>
            ))}
            {summaries.length === 0 && <p className="muted">Sem conversas globais.</p>}
          </div>
        </section>
        <section className="section-card">
          <h3>Conversa ativa</h3>
          {!activeChat ? (
            <p className="muted">Cria ou seleciona uma conversa.</p>
          ) : (
            <div className="chat-shell">
              <div className="chat-meta">
                <span className="badge badge-strong">{activeChat.runner}</span>
                <span className="badge">{activeChat.model}</span>
              </div>
              <div className="chat-log">
                {activeChat.messages.map((item) => (
                  <article key={item.id} className={`chat-bubble chat-${item.role}`}>
                    <strong>{item.role === "assistant" ? "Agente orquestrador" : "Tu"}</strong>
                    <p>{item.content}</p>
                  </article>
                ))}
              </div>
              <div className="chat-controls">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  placeholder="Ex.: criar projeto meu-produto"
                />
                <div className="chat-actions">
                  <button type="button" onClick={sendMessage} disabled={busy}>
                    {busy ? "A responder…" : "Enviar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      <section className="section-card">
        <div className="section-heading">
          <div>
            <h3>Routing de modelos</h3>
            <p className="muted">Configuração atual de providers e modelos para o orquestrador.</p>
          </div>
          <Link to="/app/home" className="project-link">
            Voltar ao overview
          </Link>
        </div>
        <pre className="json">{routing !== null ? JSON.stringify(routing, null, 2) : "—"}</pre>
      </section>
    </div>
  );
}
