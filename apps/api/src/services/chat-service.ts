import {
  createProject,
  loadProjectConfig,
  saveProjectConfig,
  syncProjectsRegistry,
} from "@aios-celx/project-manager";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { loadModelRoutingConfig } from "./model-routing.js";
import { chatAboutProject } from "./project-workbench.js";
import { getProjectSummary, listProjectIds } from "./projects.js";

export type ChatScope = "global" | "project";

export type PersistedChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type PersistedChat = {
  chatId: string;
  scope: ChatScope;
  projectId: string | null;
  title: string;
  runner: string;
  model: string;
  status: "active" | "archived";
  messages: PersistedChatMessage[];
  createdAt: string;
  updatedAt: string;
};

type ChatRegistry = {
  version: number;
  updatedAt: string;
  chats: Array<{
    chatId: string;
    scope: ChatScope;
    projectId: string | null;
    title: string;
    runner: string;
    model: string;
    status: "active" | "archived";
    createdAt: string;
    updatedAt: string;
    messageCount: number;
  }>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function chatsRoot(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "chats");
}

function registryPath(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "chat-registry.json");
}

function chatPath(monorepoRoot: string, chatId: string): string {
  return join(chatsRoot(monorepoRoot), `${chatId}.json`);
}

async function ensureStore(monorepoRoot: string): Promise<void> {
  await mkdir(chatsRoot(monorepoRoot), { recursive: true });
}

async function loadRegistry(monorepoRoot: string): Promise<ChatRegistry> {
  await ensureStore(monorepoRoot);
  try {
    const raw = await readFile(registryPath(monorepoRoot), "utf8");
    return JSON.parse(raw) as ChatRegistry;
  } catch {
    return { version: 1, updatedAt: nowIso(), chats: [] };
  }
}

async function saveRegistry(monorepoRoot: string, registry: ChatRegistry): Promise<void> {
  await ensureStore(monorepoRoot);
  registry.updatedAt = nowIso();
  await writeFile(registryPath(monorepoRoot), JSON.stringify(registry, null, 2));
}

async function saveChat(monorepoRoot: string, chat: PersistedChat): Promise<void> {
  await ensureStore(monorepoRoot);
  chat.updatedAt = nowIso();
  await writeFile(chatPath(monorepoRoot, chat.chatId), JSON.stringify(chat, null, 2));
  const registry = await loadRegistry(monorepoRoot);
  const summary = {
    chatId: chat.chatId,
    scope: chat.scope,
    projectId: chat.projectId,
    title: chat.title,
    runner: chat.runner,
    model: chat.model,
    status: chat.status,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messages.length,
  };
  const index = registry.chats.findIndex((item) => item.chatId === chat.chatId);
  if (index >= 0) {
    registry.chats[index] = summary;
  } else {
    registry.chats.push(summary);
  }
  registry.chats.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  await saveRegistry(monorepoRoot, registry);
}

export async function listChats(
  monorepoRoot: string,
  filters?: { scope?: ChatScope; projectId?: string },
): Promise<ChatRegistry["chats"]> {
  const registry = await loadRegistry(monorepoRoot);
  return registry.chats.filter((chat) => {
    if (filters?.scope && chat.scope !== filters.scope) {
      return false;
    }
    if (filters?.projectId && chat.projectId !== filters.projectId) {
      return false;
    }
    return true;
  });
}

export async function getChat(monorepoRoot: string, chatId: string): Promise<PersistedChat | null> {
  try {
    const raw = await readFile(chatPath(monorepoRoot, chatId), "utf8");
    return JSON.parse(raw) as PersistedChat;
  } catch {
    return null;
  }
}

export async function createChat(
  monorepoRoot: string,
  input: {
    scope: ChatScope;
    projectId?: string | null;
    title?: string;
    runner?: string;
    model?: string;
  },
): Promise<PersistedChat> {
  const routing = await loadModelRoutingConfig(monorepoRoot);
  const defaults = input.scope === "global" ? routing.defaults.global : routing.defaults.project;
  const createdAt = nowIso();
  const chat: PersistedChat = {
    chatId: randomUUID(),
    scope: input.scope,
    projectId: input.projectId ?? null,
    title:
      input.title?.trim() ||
      (input.scope === "global"
        ? "Nova conversa do orquestrador"
        : `Conversa do projeto ${input.projectId ?? ""}`.trim()),
    runner: input.runner ?? defaults.provider,
    model: input.model ?? defaults.model,
    status: "active",
    messages: [],
    createdAt,
    updatedAt: createdAt,
  };
  await saveChat(monorepoRoot, chat);
  return chat;
}

async function buildGlobalReply(
  monorepoRoot: string,
  projectsRoot: string,
  message: string,
): Promise<string> {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("aios-define-scope") ||
    normalized.includes("define scope") ||
    normalized.includes("definir escopo")
  ) {
    return [
      "Vamos abrir o fluxo `aios-define-scope`.",
      "",
      "Primeiro preciso que escolhas explicitamente um destes caminhos:",
      "1. Novo projeto",
      "2. Nova funcionalidade",
      "3. Correção",
      "",
      "Se for `Novo projeto`, responde com uma descrição curta do produto que queres criar.",
      "Se for `Nova funcionalidade` ou `Correção`, responde também com o `projectId` existente.",
    ].join("\n");
  }

  const createMatch = normalized.match(/^cria(?:r)? projeto ([a-z0-9-_]+)/i);
  if (createMatch) {
    const projectId = createMatch[1] ?? "";
    await createProject({ projectsRoot, projectId, blueprintId: "saas-webapp" });
    await syncProjectsRegistry({ monorepoRoot, projectsRoot });
    return `Criei o projeto \`${projectId}\` com o blueprint \`saas-webapp\` e sincronizei o registry.`;
  }

  const priorityMatch = normalized.match(/^defin(?:e|ir) prioridade (alta|media|m[eé]dia|baixa) (?:no |para o |do )?projeto ([a-z0-9-_]+)/i);
  if (priorityMatch) {
    const rawPriority = priorityMatch[1] ?? "media";
    const projectId = priorityMatch[2] ?? "";
    const cfg = await loadProjectConfig(projectsRoot, projectId);
    cfg.priority = rawPriority.startsWith("alt")
      ? "high"
      : rawPriority.startsWith("baix")
        ? "low"
        : "medium";
    await saveProjectConfig(projectsRoot, projectId, cfg);
    await syncProjectsRegistry({ monorepoRoot, projectsRoot });
    return `Atualizei a prioridade do projeto \`${projectId}\` para \`${cfg.priority}\` e sincronizei o registry.`;
  }

  const statusMatch = normalized.match(/^defin(?:e|ir) estado (ativo|active|pausado|paused|arquivado|archived) (?:no |para o |do )?projeto ([a-z0-9-_]+)/i);
  if (statusMatch) {
    const rawStatus = statusMatch[1] ?? "paused";
    const projectId = statusMatch[2] ?? "";
    const cfg = await loadProjectConfig(projectsRoot, projectId);
    cfg.status =
      rawStatus === "ativo" || rawStatus === "active"
        ? "active"
        : rawStatus === "arquivado" || rawStatus === "archived"
          ? "archived"
          : "paused";
    await saveProjectConfig(projectsRoot, projectId, cfg);
    await syncProjectsRegistry({ monorepoRoot, projectsRoot });
    return `Atualizei o estado do projeto \`${projectId}\` para \`${cfg.status}\` e sincronizei o registry.`;
  }

  const projectIds = await listProjectIds(projectsRoot);
  const top = await Promise.all(
    projectIds.slice(0, 8).map(async (projectId) => {
      const summary = await getProjectSummary(monorepoRoot, projectsRoot, projectId);
      return {
        projectId,
        stage: summary?.state?.stage ?? "unknown",
        blocked: summary?.state?.blocked === true ? "bloqueado" : "ok",
      };
    }),
  );

  if (normalized.includes("listar") || normalized.includes("projetos") || normalized.includes("portfolio")) {
    return [
      "Resumo global do portfolio:",
      ...top.map((item) => `- \`${item.projectId}\` · stage \`${item.stage}\` · ${item.blocked}`),
      "",
      "Posso também criar projeto com `criar projeto <id>`, mudar prioridade com `definir prioridade alta projeto <id>` e mudar estado com `definir estado pausado projeto <id>`.",
    ].join("\n");
  }

  return [
    "Estou a funcionar como agente orquestrador global.",
    `Vejo atualmente ${projectIds.length} projetos no ambiente gerido.`,
    "Posso ajudar a criar projetos, ajustar prioridade/estado e orientar o próximo passo operacional.",
    "Comandos suportados neste MVP:",
    "- `criar projeto <id>`",
    "- `definir prioridade alta projeto <id>`",
    "- `definir estado pausado projeto <id>`",
    "- `listar projetos`",
  ].join("\n");
}

export async function appendUserMessageAndRespond(
  monorepoRoot: string,
  projectsRoot: string,
  chatId: string,
  message: string,
): Promise<PersistedChat> {
  const chat = await getChat(monorepoRoot, chatId);
  if (!chat) {
    throw new Error(`Unknown chat: ${chatId}`);
  }
  const trimmed = message.trim();
  const userMessage: PersistedChatMessage = {
    id: randomUUID(),
    role: "user",
    content: trimmed,
    createdAt: nowIso(),
  };
  chat.messages.push(userMessage);

  const assistantReply =
    chat.scope === "project" && chat.projectId
      ? (await chatAboutProject(monorepoRoot, projectsRoot, chat.projectId, trimmed)).message
      : await buildGlobalReply(monorepoRoot, projectsRoot, trimmed);

  chat.messages.push({
    id: randomUUID(),
    role: "assistant",
    content: assistantReply,
    createdAt: nowIso(),
  });
  await saveChat(monorepoRoot, chat);
  return chat;
}
