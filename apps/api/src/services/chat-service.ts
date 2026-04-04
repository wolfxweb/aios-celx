import {
  createProject,
  loadProjectConfig,
  projectPath,
  saveProjectConfig,
  syncProjectsRegistry,
} from "@aios-celx/project-manager";
import { enqueue } from "@aios-celx/execution-queue";
import { updateState } from "@aios-celx/state-manager";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { writeMarkdown, writeYaml } from "../../../../packages/artifact-manager/dist/index.js";
import { loadModelRoutingConfig } from "./model-routing.js";
import { chatAboutProject } from "./project-workbench.js";
import { getProjectQueue, getProjectSummary, getProjectTasks, listProjectIds } from "./projects.js";
import { runSchedulerForProject } from "./scheduler.js";

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
  linkedProjectChatId?: string | null;
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

function titleFromProjectId(projectId: string): string {
  return projectId
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function detectCreatedProjectId(chat: PersistedChat): string | null {
  for (let index = chat.messages.length - 1; index >= 0; index -= 1) {
    const message = chat.messages[index];
    if (!message) {
      continue;
    }
    const match = message.content.match(/Criei o projeto completo `([^`]+)`/i);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

async function seedNewProjectScope(
  monorepoRoot: string,
  projectsRoot: string,
  projectId: string,
  description: string,
): Promise<void> {
  const root = projectPath(projectsRoot, projectId);
  const productName = titleFromProjectId(projectId);
  const createdAt = new Date().toISOString().slice(0, 10);
  const shortDescription = description.trim();

  await writeMarkdown(
    join(root, "docs", "prd.md"),
    `# Product Requirements — ${productName}

## Summary

${shortDescription}

## Goals

1. Lançar um MVP funcional de ${productName}.
2. Cobrir o fluxo principal do utilizador com backlog executável.
3. Preparar o projeto para implementação guiada por agentes e workflow.

## User stories (high level)

- Como utilizador principal, quero usar ${productName} para resolver o problema descrito no escopo.
- Como operador, quero acompanhar o estado do produto e das entregas.

## Functional requirements

- FR-001: O sistema deve suportar o fluxo principal descrito no escopo.
- FR-002: O sistema deve ter uma base clara de API, arquitetura e backlog.
- FR-003: O projeto deve ficar preparado para evolução incremental por tasks.

## Non-functional requirements

- Performance: resposta adequada para um MVP web.
- Security: autenticação e proteção das operações sensíveis quando aplicável.
- Reliability: backlog e docs devem permanecer coerentes com o escopo.

## Estratégia de testes

- Testes unitários: sim (padrão).
- Testes adicionais: a definir conforme os fluxos críticos.

_Atualizado em: ${createdAt}._
`,
  );

  await writeMarkdown(
    join(root, "docs", "discovery.md"),
    `# Discovery — ${productName}

## Problema

${shortDescription}

## Hipóteses

- Existe uma necessidade real para o fluxo principal do produto.
- Um MVP com arquitetura simples é suficiente para validar a solução.

## Riscos

- Escopo inicial demasiado amplo.
- Dependências externas ainda não definidas.
- Requisitos de autenticação e integrações podem crescer rápido.

## Questões em aberto

- Qual o público principal do MVP?
- Quais integrações são obrigatórias na primeira versão?
- Que relatórios ou automações são prioridade?
`,
  );

  await writeMarkdown(
    join(root, "docs", "architecture.md"),
    `# Architecture — ${productName}

## Contexto

${productName} será estruturado como uma aplicação web com separação entre frontend, backend e domínio.

## Componentes principais

- Interface web para o fluxo principal do utilizador.
- API/backend para regras de negócio e persistência.
- Camada de domínio para entidades e casos de uso.

## Estrutura inicial sugerida

- \`src/\` para domínio e serviços.
- \`api/\` ou módulo backend para endpoints e contratos.
- \`web/\` ou frontend para interface de utilização.
- \`tests/\` para testes unitários e de integração.

## Decisões iniciais

- Começar simples e modular.
- Priorizar clareza do backlog e rastreabilidade por story/task.
- Evoluir integrações e observabilidade por fases.
`,
  );

  await writeMarkdown(
    join(root, "docs", "api-contracts.md"),
    `# API Contracts — ${productName}

## Convenções

- API HTTP JSON.
- Respostas com payload consistente e mensagens de erro claras.

## Endpoints iniciais sugeridos

- \`GET /health\` — verificação de saúde.
- \`GET /resources\` — listagem do recurso principal.
- \`POST /resources\` — criação do recurso principal.
- \`PATCH /resources/:id\` — atualização do recurso principal.

## Observações

- Ajustar nomes e contratos conforme o domínio real do produto.
- Validar autenticação, autorização e paginação antes da implementação.
`,
  );

  await writeMarkdown(
    join(root, "docs", "relatorio-final.md"),
    `# Relatório final

## Resumo

Projeto \`${projectId}\` criado a partir de sessão guiada de definição de escopo.

## Checklist

- docs/prd.md: ok
- docs/discovery.md: ok
- docs/architecture.md: ok
- docs/api-contracts.md: ok
- backlog/epics.yaml: ok
- backlog/stories.yaml: ok
- backlog/tasks.yaml: ok

## Estado

Completa

## Próximo passo

Aprovar ou ajustar o escopo antes de avançar para implementação.
`,
  );

  await writeYaml(join(root, "backlog", "epics.yaml"), {
    epics: [
      {
        id: "EPIC-1",
        title: `MVP de ${productName}`,
        goal: shortDescription,
        status: "todo",
      },
    ],
  });

  await writeYaml(join(root, "backlog", "stories.yaml"), {
    stories: [
      {
        id: "STORY-1",
        epicId: "EPIC-1",
        title: "Definir modelo principal do domínio",
        acceptance: [
          "Entidades principais identificadas",
          "Fluxo principal descrito no domínio",
        ],
        status: "todo",
      },
      {
        id: "STORY-2",
        epicId: "EPIC-1",
        title: "Implementar backend/API inicial",
        acceptance: [
          "Contratos principais cobertos",
          "Fluxos básicos de leitura e escrita definidos",
        ],
        status: "todo",
      },
      {
        id: "STORY-3",
        epicId: "EPIC-1",
        title: "Construir interface inicial",
        acceptance: [
          "Fluxo principal acessível no frontend",
          "Estados básicos de sucesso e erro previstos",
        ],
        status: "todo",
      },
    ],
  });

  await writeYaml(join(root, "backlog", "tasks.yaml"), {
    tasks: [
      {
        id: "TASK-1",
        storyId: "STORY-1",
        title: "Mapear entidades e regras do domínio",
        description: "Definir a estrutura inicial do domínio e das regras de negócio centrais.",
        type: "analysis",
        status: "todo",
      },
      {
        id: "TASK-2",
        storyId: "STORY-1",
        title: "Criar modelos iniciais no código",
        description: "Estruturar tipos, entidades e serviços base do domínio.",
        type: "implementation",
        status: "todo",
      },
      {
        id: "TASK-3",
        storyId: "STORY-2",
        title: "Definir endpoints principais da API",
        description: "Implementar a base do backend alinhada ao contrato inicial.",
        type: "implementation",
        status: "todo",
      },
      {
        id: "TASK-4",
        storyId: "STORY-2",
        title: "Adicionar testes unitários do backend",
        description: "Cobrir regras principais e validações básicas.",
        type: "test",
        status: "todo",
      },
      {
        id: "TASK-5",
        storyId: "STORY-3",
        title: "Criar interface inicial do utilizador",
        description: "Montar o fluxo principal do frontend para o MVP.",
        type: "implementation",
        status: "todo",
      },
      {
        id: "TASK-6",
        storyId: "STORY-3",
        title: "Adicionar testes do fluxo principal",
        description: "Cobrir o fluxo crítico do utilizador no MVP.",
        type: "test",
        status: "todo",
      },
    ],
  });

  const cfg = await loadProjectConfig(projectsRoot, projectId);
  cfg.name = productName;
  await saveProjectConfig(projectsRoot, projectId, cfg);
  await syncProjectsRegistry({ monorepoRoot, projectsRoot });
}

async function startProjectDevelopment(
  projectsRoot: string,
  projectId: string,
): Promise<{ projectId: string; queuedTaskIds: string[]; alreadyReadyCount: number }> {
  const [tasks, queue] = await Promise.all([
    getProjectTasks(projectsRoot, projectId),
    getProjectQueue(projectsRoot, projectId).catch(() => []),
  ]);
  const existingReadyTaskIds = new Set(
    queue
      .filter((item) => item.status === "ready" || item.status === "pending" || item.status === "running")
      .map((item) => String(item.payload?.taskId ?? ""))
      .filter(Boolean),
  );

  const todoTasks = tasks.filter((task) => task.status === "todo");
  const candidates = todoTasks.filter((task) => !existingReadyTaskIds.has(task.id));
  const queuedTaskIds: string[] = [];

  for (const task of candidates.slice(0, 2)) {
    await enqueue(projectsRoot, projectId, {
      type: "run-task",
      priority: 100,
      payload: {
        taskId: task.id,
        storyId: task.storyId,
      },
      metadata: {
        storyId: task.storyId,
        source: "chat:start-development",
      },
    });
    queuedTaskIds.push(task.id);
  }

  await updateState(projectsRoot, projectId, {
    stage: "implementation",
    currentAgent: "engineer",
    currentTaskId: queuedTaskIds[0] ?? null,
    blocked: false,
    requiresHumanApproval: false,
    nextGate: "implementation_complete",
  });

  return {
    projectId,
    queuedTaskIds,
    alreadyReadyCount: existingReadyTaskIds.size,
  };
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
    linkedProjectChatId: null,
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

async function ensureLinkedProjectChat(
  monorepoRoot: string,
  sourceChat: PersistedChat,
  projectId: string,
): Promise<PersistedChat> {
  if (sourceChat.linkedProjectChatId) {
    const existing = await getChat(monorepoRoot, sourceChat.linkedProjectChatId);
    if (existing) {
      return existing;
    }
  }

  const linked = await createChat(monorepoRoot, {
    scope: "project",
    projectId,
    title: `Conversa de criação: ${projectId}`,
    runner: sourceChat.runner,
    model: sourceChat.model,
  });
  linked.messages = sourceChat.messages.map((message) => ({ ...message }));
  await saveChat(monorepoRoot, linked);
  sourceChat.linkedProjectChatId = linked.chatId;
  return linked;
}

async function buildGlobalReply(
  monorepoRoot: string,
  projectsRoot: string,
  chat: PersistedChat,
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

  if (chat.title === "Novo projeto") {
    const existingProjectId = detectCreatedProjectId(chat);
    if (existingProjectId) {
      const queue = await getProjectQueue(projectsRoot, existingProjectId).catch(() => []);
      const readyCount = queue.filter((item) => item.status === "ready").length;
      const normalizedExisting = normalized;

      if (
        normalizedExisting.includes("implement") ||
        normalizedExisting.includes("iniciar a implementação") ||
        normalizedExisting.includes("iniciar implementacao") ||
        normalizedExisting.includes("começar a implementação") ||
        normalizedExisting.includes("comecar a implementacao")
      ) {
        if (readyCount > 0) {
          await runSchedulerForProject(projectsRoot, existingProjectId, { mode: "once" });
          return [
            `Iniciei a execução real do scheduler para \`${existingProjectId}\` porque já existem ${readyCount} item(ns) ready na fila.`,
            `Abre \`/app/project/${existingProjectId}\` para acompanhar a execução e o estado das tasks.`,
          ].join("\n\n");
        }

        return [
          `O projeto \`${existingProjectId}\` já foi criado e mantive o contexto desta conversa.`,
          `Ainda não iniciei implementação automática porque a fila está com ${readyCount} item(ns) ready.`,
          `Próximo passo útil: abrir \`/app/project/${existingProjectId}\` para rever backlog, ajustar tasks ou preparar execução real.`,
        ].join("\n\n");
      }

      if (
        normalizedExisting.includes("ajust") ||
        normalizedExisting.includes("alter") ||
        normalizedExisting.includes("escopo") ||
        normalizedExisting.includes("prd") ||
        normalizedExisting.includes("backlog")
      ) {
        return [
          `Continuamos a trabalhar no projeto \`${existingProjectId}\` nesta conversa.`,
          `Posso ajudar-te a ajustar escopo, PRD, backlog e próximos passos operacionais antes da implementação.`,
          `Se quiseres execução, abre \`/app/project/${existingProjectId}\` ou pede explicitamente para preparar a implementação.`,
        ].join("\n\n");
      }
    }

    const scopedCreateMatch = message.trim().match(
      /(?:projectid|id)\s*[:=]?\s*([a-z0-9-_]+)[\s\S]*?(?:descri(?:ção|cao)|produto|escopo)\s*[:=]?\s*([\s\S]+)/i,
    );
    const inlineCreateMatch = message.trim().match(
      /^novo projeto\s+([a-z0-9-_]+)\s*[-:]\s*([\s\S]+)/i,
    );
    const projectId = (scopedCreateMatch?.[1] ?? inlineCreateMatch?.[1] ?? "").trim().toLowerCase();
    const description = (scopedCreateMatch?.[2] ?? inlineCreateMatch?.[2] ?? "").trim();

    if (projectId && description) {
      await createProject({ projectsRoot, projectId, blueprintId: "saas-webapp" });
      await seedNewProjectScope(monorepoRoot, projectsRoot, projectId, description);
      chat.projectId = projectId;
      return [
        `Criei o projeto completo \`${projectId}\` a partir do escopo informado.`,
        "",
        "Já deixei preparado:",
        "- estrutura do projeto",
        "- docs/prd.md",
        "- docs/discovery.md",
        "- docs/architecture.md",
        "- docs/api-contracts.md",
        "- docs/relatorio-final.md",
        "- backlog/epics.yaml",
        "- backlog/stories.yaml",
        "- backlog/tasks.yaml",
        "",
        `Próximo passo: abrir \`/app/project/${projectId}\` para rever o projeto ou continuar no orquestrador para ajustar o escopo.`,
      ].join("\n");
    }

    return [
      "Para eu criar tudo do novo projeto nesta conversa, responde neste formato:",
      "",
      "`projectId: nome-do-projeto`",
      "`descrição: produto web para ...`",
      "",
      "Exemplo:",
      "`projectId: portal-cliente`",
      "`descrição: portal web para clientes acompanharem contratos, boletos e chamados.`",
    ].join("\n");
  }

  const createMatch = normalized.match(/^cria(?:r)? projeto ([a-z0-9-_]+)/i);
  if (createMatch) {
    const projectId = createMatch[1] ?? "";
    await createProject({ projectsRoot, projectId, blueprintId: "saas-webapp" });
    await syncProjectsRegistry({ monorepoRoot, projectsRoot });
    return `Criei o projeto \`${projectId}\` com o blueprint \`saas-webapp\` e sincronizei o registry.`;
  }

  const startDevelopmentMatch = normalized.match(
    /(?:iniciar|inicie|começar|comecar|preparar)\s+(?:o\s+)?desenvolvimento(?:\s+do|\s+de|\s+para)?\s+projeto\s+([a-z0-9-_]+)/i,
  );
  if (startDevelopmentMatch) {
    const projectId = startDevelopmentMatch[1] ?? "";
    const result = await startProjectDevelopment(projectsRoot, projectId);
    return [
      `Preparei o desenvolvimento do projeto \`${projectId}\`.`,
      result.queuedTaskIds.length > 0
        ? `Enfileirei as tasks ${result.queuedTaskIds.map((taskId) => `\`${taskId}\``).join(", ")} para execução.`
        : "Não enfileirei novas tasks porque as primeiras tarefas já estavam na fila ou não existem tasks `todo`.",
      `O estado do projeto foi ajustado para \`implementation\` e o próximo passo é correr o scheduler em \`/app/project/${projectId}\`.`,
    ].join("\n\n");
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
      : await buildGlobalReply(monorepoRoot, projectsRoot, chat, trimmed);

  const createdProjectId =
    chat.scope === "global" && chat.title === "Novo projeto" ? detectCreatedProjectId({ ...chat, messages: [...chat.messages] }) : null;
  if (createdProjectId && chat.title === "Novo projeto") {
    chat.title = `Novo projeto: ${createdProjectId}`;
  }

  chat.messages.push({
    id: randomUUID(),
    role: "assistant",
    content: assistantReply,
    createdAt: nowIso(),
  });
  const titleProjectMatch = assistantReply.match(/Criei o projeto completo `([^`]+)`/i);
  if (chat.scope === "global" && titleProjectMatch?.[1]) {
    const projectId = titleProjectMatch[1];
    chat.title = `Novo projeto: ${projectId}`;
    chat.projectId = projectId;
    const linkedChat = await ensureLinkedProjectChat(monorepoRoot, chat, projectId);
    linkedChat.messages = chat.messages.map((message) => ({ ...message }));
    await saveChat(monorepoRoot, linkedChat);
  } else if (chat.scope === "global" && chat.projectId && chat.linkedProjectChatId) {
    const linkedChat = await getChat(monorepoRoot, chat.linkedProjectChatId);
    if (linkedChat) {
      linkedChat.messages = chat.messages.map((message) => ({ ...message }));
      linkedChat.title = `Conversa de criação: ${chat.projectId}`;
      await saveChat(monorepoRoot, linkedChat);
    }
  }
  await saveChat(monorepoRoot, chat);
  return chat;
}
