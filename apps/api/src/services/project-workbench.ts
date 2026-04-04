import { loadProjectConfig, projectPath } from "@aios-celx/project-manager";
import { enqueue } from "@aios-celx/execution-queue";
import { mergeAutonomyPolicy, TasksDocumentSchema, type Task } from "@aios-celx/shared";
import { readState, updateState } from "@aios-celx/state-manager";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { readYaml, writeYaml } from "../../../../packages/artifact-manager/dist/index.js";
import { getProjectQueue, getProjectSummary, getProjectTasks } from "./projects.js";

type WorkbenchFile = {
  path: string;
  kind: "doc" | "backlog" | "code";
  snippet: string;
};

type ProjectWorkbenchContext = {
  projectId: string;
  roots: string[];
  summary: Awaited<ReturnType<typeof getProjectSummary>>;
  state: Awaited<ReturnType<typeof readState>>;
  autonomy: ReturnType<typeof mergeAutonomyPolicy>;
  queuePreview: Awaited<ReturnType<typeof getProjectQueue>>;
  relevantFiles: WorkbenchFile[];
};

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yaml",
  ".yml",
  ".py",
  ".php",
  ".vue",
  ".css",
  ".html",
]);

const ROOT_CANDIDATES = [
  "docs",
  "backlog",
  "src",
  "app",
  "apps",
  "web",
  "frontend",
  "backend",
];

function extensionOf(path: string): string {
  const idx = path.lastIndexOf(".");
  return idx >= 0 ? path.slice(idx) : "";
}

function isTextFile(path: string): boolean {
  return TEXT_EXTENSIONS.has(extensionOf(path).toLowerCase());
}

function detectKind(path: string): "doc" | "backlog" | "code" {
  if (path.startsWith("docs/")) {
    return "doc";
  }
  if (path.startsWith("backlog/")) {
    return "backlog";
  }
  return "code";
}

function trimSnippet(input: string, maxChars = 900): string {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars)}\n...`;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(root: string, projectRoot: string, limit: number): Promise<string[]> {
  const found: string[] = [];
  const stack = [root];

  while (stack.length > 0 && found.length < limit) {
    const current = stack.pop()!;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (found.length >= limit) {
        break;
      }
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
        continue;
      }
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      const rel = relative(projectRoot, full).replaceAll("\\", "/");
      if (!isTextFile(rel)) {
        continue;
      }
      found.push(rel);
    }
  }

  return found;
}

async function readWorkbenchFile(projectRoot: string, relPath: string): Promise<WorkbenchFile | null> {
  try {
    const raw = await readFile(join(projectRoot, relPath), "utf8");
    return {
      path: relPath,
      kind: detectKind(relPath),
      snippet: trimSnippet(raw),
    };
  } catch {
    return null;
  }
}

function summarizeKinds(files: WorkbenchFile[]): string {
  const counts = { doc: 0, backlog: 0, code: 0 };
  for (const file of files) {
    counts[file.kind] += 1;
  }
  const parts = [];
  if (counts.doc > 0) parts.push(`${counts.doc} docs`);
  if (counts.backlog > 0) parts.push(`${counts.backlog} backlog`);
  if (counts.code > 0) parts.push(`${counts.code} code`);
  return parts.join(", ") || "0 ficheiros";
}

async function loadTasksDocument(projectRoot: string) {
  const raw = await readYaml<unknown>(join(projectRoot, "backlog/tasks.yaml"));
  return TasksDocumentSchema.parse(raw);
}

async function saveTasksDocument(projectRoot: string, tasks: Task[]) {
  await writeYaml(join(projectRoot, "backlog/tasks.yaml"), { tasks });
}

function titleFromProjectId(projectId: string): string {
  return projectId
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractHtmlTitle(html: string, fallback: string): string {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() || fallback;
}

function buildHomeCopy(productName: string) {
  return {
    headline: "Estruture o desenvolvimento com IA do escopo à entrega.",
    subheadline:
      `${productName} centraliza contexto, PRD, backlog, prompts e execução em um workspace pensado para construir software com mais clareza operacional, consistência e rastreabilidade.`,
    workspace:
      "Contexto do projeto, backlog, decisões e estado operacional organizados em um único ambiente de trabalho.",
    prd: "Transforme escopo em requisitos claros, objetivos e prontos para orientar produto, engenharia e agentes.",
    aiExecution:
      "Conecte tasks, prompts e execução em um fluxo controlado, com histórico de outputs e contexto preservado.",
    flow: [
      "Criar ou abrir um projeto com contexto centralizado.",
      "Estruturar PRD, decisões e backlog inicial.",
      "Executar tasks com apoio de agentes e prompts organizados.",
      "Acompanhar progresso, histórico e rastreabilidade da operação.",
    ],
  };
}

async function rewriteHomeCopy(projectRoot: string, projectId: string): Promise<string> {
  const homePath = join(projectRoot, "web/index.html");
  if (!(await pathExists(homePath))) {
    return `Não encontrei \`web/index.html\` no projeto \`${projectId}\`, por isso ainda não consegui alterar a copy da home.`;
  }

  const html = await readFile(homePath, "utf8");
  const productName = extractHtmlTitle(html, titleFromProjectId(projectId));
  const copy = buildHomeCopy(productName);

  let updated = html;
  updated = updated.replace(/<h1>[\s\S]*?<\/h1>/i, `<h1>${copy.headline}</h1>`);
  updated = updated.replace(
    /<p class="lead">[\s\S]*?<\/p>/i,
    `<p class="lead">
          ${copy.subheadline}
        </p>`,
  );
  updated = updated.replace(
    /<article class="panel">\s*<h2>Project Workspace<\/h2>\s*<p>[\s\S]*?<\/p>\s*<\/article>/i,
    `<article class="panel">
          <h2>Project Workspace</h2>
          <p>${copy.workspace}</p>
        </article>`,
  );
  updated = updated.replace(
    /<article class="panel">\s*<h2>PRD Generator<\/h2>\s*<p>[\s\S]*?<\/p>\s*<\/article>/i,
    `<article class="panel">
          <h2>PRD Generator</h2>
          <p>${copy.prd}</p>
        </article>`,
  );
  updated = updated.replace(
    /<article class="panel">\s*<h2>AI Execution<\/h2>\s*<p>[\s\S]*?<\/p>\s*<\/article>/i,
    `<article class="panel">
          <h2>AI Execution</h2>
          <p>${copy.aiExecution}</p>
        </article>`,
  );
  updated = updated.replace(
    /<ol>[\s\S]*?<\/ol>/i,
    `<ol>
          ${copy.flow.map((item) => `<li>${item}</li>`).join("\n          ")}
        </ol>`,
  );

  if (updated === html) {
    const alreadyAligned =
      html.includes(copy.headline) &&
      html.includes(copy.subheadline) &&
      html.includes(copy.workspace) &&
      html.includes(copy.prd) &&
      html.includes(copy.aiExecution) &&
      copy.flow.every((item) => html.includes(item));

    if (alreadyAligned) {
      return [
        `A home do projeto \`${projectId}\` já está com a versão de copy que eu aplicaria agora.`,
        "Não fiz novas mudanças porque o conteúdo-alvo já está presente em `web/index.html`.",
        "Se quiseres, posso fazer uma segunda versão mais agressiva de copy, ou então alterar um bloco específico da home.",
      ].join("\n\n");
    }

    return `Reconheci o pedido de alterar a home, mas não consegui aplicar a reescrita automaticamente em \`web/index.html\`.`;
  }

  await writeFile(homePath, updated, "utf8");
  return [
    `Atualizei a copy da home do projeto \`${projectId}\` em \`web/index.html\`.`,
    `Reescrevi headline, subheadline, os blocos \`Project Workspace\`, \`PRD Generator\`, \`AI Execution\` e a seção \`Fluxo principal\`.`,
    `Se o projeto estiver em execução, basta recarregar o frontend para veres a mudança no navegador.`,
  ].join("\n\n");
}

async function startProjectDevelopment(projectsRoot: string, projectId: string): Promise<string> {
  const [tasks, queue] = await Promise.all([
    getProjectTasks(projectsRoot, projectId),
    getProjectQueue(projectsRoot, projectId).catch(() => []),
  ]);
  const existingQueuedTaskIds = new Set(
    queue
      .filter((item) => item.status === "ready" || item.status === "pending" || item.status === "running")
      .map((item) => String(item.payload?.taskId ?? ""))
      .filter(Boolean),
  );
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const selectedTasks = todoTasks.filter((task) => !existingQueuedTaskIds.has(task.id)).slice(0, 2);

  for (const task of selectedTasks) {
    await enqueue(projectsRoot, projectId, {
      type: "run-task",
      priority: 100,
      payload: {
        taskId: task.id,
        storyId: task.storyId,
      },
      metadata: {
        storyId: task.storyId,
        source: "project-chat:start-development",
      },
    });
  }

  await updateState(projectsRoot, projectId, {
    stage: "implementation",
    currentAgent: "engineer",
    currentTaskId: selectedTasks[0]?.id ?? null,
    blocked: false,
    requiresHumanApproval: false,
    nextGate: "implementation_complete",
  });

  if (selectedTasks.length === 0) {
    return [
      `Preparei o projeto \`${projectId}\` para desenvolvimento, mas não encontrei novas tasks \`todo\` para enfileirar.`,
      "Se já houver tarefas na fila, podes seguir com a execução pelo scheduler.",
    ].join("\n\n");
  }

  return [
    `Preparei o desenvolvimento do projeto \`${projectId}\`.`,
    `Enfileirei ${selectedTasks.length} task(s): ${selectedTasks.map((task) => `\`${task.id}\``).join(", ")}.`,
    "O projeto passou para `implementation` e já pode seguir para execução.",
  ].join("\n\n");
}

async function maybeHandleProjectAction(projectsRoot: string, projectId: string, message: string): Promise<string | null> {
  const normalized = message.trim().toLowerCase();
  const projectRoot = projectPath(projectsRoot, projectId);

  if (
    normalized.includes("iniciar desenvolvimento") ||
    normalized.includes("inicie o desenvolvimento") ||
    normalized.includes("começar desenvolvimento") ||
    normalized.includes("comecar desenvolvimento") ||
    normalized.includes("preparar implementação") ||
    normalized.includes("preparar implementacao")
  ) {
    return startProjectDevelopment(projectsRoot, projectId);
  }

  if (
    normalized.includes("copy") &&
    (normalized.includes("home") ||
      normalized.includes("página inicial") ||
      normalized.includes("pagina inicial") ||
      normalized.includes("pagina iniciar"))
  ) {
    return rewriteHomeCopy(projectRoot, projectId);
  }

  const bulkStatusMatch = normalized.match(
    /(?:marc(?:a|ar)|ajust(?:a|ar)|alter(?:a|ar)|mud(?:a|ar)).*tarefas?.*(pendentes|todo|em andamento|in_progress|bloqueadas|blocked|finalizadas|done).*(?:para|como).*(pendentes|todo|em andamento|in_progress|bloqueadas|blocked|finalizadas|done)/i,
  );
  if (bulkStatusMatch) {
    const fromRaw = bulkStatusMatch[1] ?? "";
    const toRaw = bulkStatusMatch[2] ?? "";
    const normalizeStatus = (value: string): string => {
      const v = value.toLowerCase();
      if (v === "pendentes" || v === "todo") return "todo";
      if (v === "em andamento" || v === "in_progress") return "in_progress";
      if (v === "bloqueadas" || v === "blocked") return "blocked";
      if (v === "finalizadas" || v === "done") return "done";
      return value;
    };
    const fromStatus = normalizeStatus(fromRaw);
    const toStatus = normalizeStatus(toRaw);
    const doc = await loadTasksDocument(projectRoot);
    const affected = doc.tasks.filter((task) => String(task.status) === fromStatus);
    if (affected.length === 0) {
      return `Não encontrei tarefas com estado \`${fromStatus}\` no projeto \`${projectId}\`.`;
    }
    const updatedTasks = doc.tasks.map((task) =>
      String(task.status) === fromStatus ? { ...task, status: toStatus } : task,
    );
    await saveTasksDocument(projectRoot, updatedTasks);
    return `Atualizei ${affected.length} tarefa(s) de \`${fromStatus}\` para \`${toStatus}\` no projeto \`${projectId}\`: ${affected
      .slice(0, 8)
      .map((task) => `\`${task.id}\``)
      .join(", ")}.`;
  }

  const singleTaskMatch = normalized.match(
    /(?:marc(?:a|ar)|ajust(?:a|ar)|alter(?:a|ar)|mud(?:a|ar)).*task\s+([a-z0-9-_]+).*(?:para|como).*(pendentes|todo|em andamento|in_progress|bloqueadas|blocked|finalizadas|done)/i,
  );
  if (singleTaskMatch) {
    const taskId = (singleTaskMatch[1] ?? "").toUpperCase();
    const statusRaw = singleTaskMatch[2] ?? "";
    const toStatus =
      statusRaw === "pendentes" || statusRaw === "todo"
        ? "todo"
        : statusRaw === "em andamento" || statusRaw === "in_progress"
          ? "in_progress"
          : statusRaw === "bloqueadas" || statusRaw === "blocked"
            ? "blocked"
            : "done";
    const doc = await loadTasksDocument(projectRoot);
    const target = doc.tasks.find((task) => task.id.toUpperCase() === taskId);
    if (!target) {
      return `Não encontrei a task \`${taskId}\` no projeto \`${projectId}\`.`;
    }
    const updatedTasks = doc.tasks.map((task) =>
      task.id.toUpperCase() === taskId ? { ...task, status: toStatus } : task,
    );
    await saveTasksDocument(projectRoot, updatedTasks);
    return `Atualizei a task \`${taskId}\` para \`${toStatus}\` no projeto \`${projectId}\`.`;
  }

  if (normalized.includes("implemente") || normalized.includes("executa as tarefas") || normalized.includes("faça as tarefas")) {
    const doc = await loadTasksDocument(projectRoot);
    const pending = doc.tasks.filter((task) => String(task.status) === "todo");
    return [
      `Ainda não tenho engine de execução real ligada neste chat do projeto, por isso não consigo implementar código automaticamente a partir daqui.`,
      `Mas já identifiquei ${pending.length} tarefa(s) pendentes em \`${projectId}\`: ${pending
        .slice(0, 8)
        .map((task) => `\`${task.id}\``)
        .join(", ") || "nenhuma"}.`,
      "Se quiseres, posso já alterar estados de tasks pelo chat, ou então ligar o próximo passo para executar essas tasks por runner/scheduler.",
    ].join("\n\n");
  }

  return null;
}

function buildConversationMemory(history: ConversationMessage[]): string {
  const relevant = history
    .slice(-6)
    .map((message) => `${message.role === "user" ? "Tu" : "Orquestrador"}: ${message.content.replace(/\s+/g, " ").trim()}`)
    .filter(Boolean);
  return relevant.join(" | ");
}

function buildOperationalAnswer(input: {
  message: string;
  ctx: ProjectWorkbenchContext;
  history: ConversationMessage[];
}): string {
  const msg = input.message.toLowerCase();
  const { ctx, history } = input;
  const firstFiles = ctx.relevantFiles.slice(0, 6).map((f) => `\`${f.path}\``).join(", ") || "sem ficheiros relevantes";
  const stage = ctx.state.stage ?? "unknown";
  const blocked = ctx.state.blocked ? "bloqueado" : "desbloqueado";
  const queueReady = ctx.queuePreview.filter((item) => item.status === "ready").length;
  const queueRunning = ctx.queuePreview.filter((item) => item.status === "running").length;
  const memory = buildConversationMemory(history);

  if (msg.includes("codigo") || msg.includes("code") || msg.includes("arquitet") || msg.includes("estrutura")) {
    return [
      `Analisei o projeto \`${ctx.projectId}\` como agente orquestrador com memória da conversa e contexto do projeto.`,
      `Raízes relevantes detetadas: ${ctx.roots.join(", ") || "nenhuma"}.`,
      `Ficheiros amostrados: ${firstFiles}.`,
      `Estado operacional atual: stage \`${stage}\`, projeto ${blocked}, ${queueReady} itens ready e ${queueRunning} running na fila.`,
      memory ? `Memória recente da conversa: ${memory}.` : "Ainda não há memória recente além do contexto base do projeto.",
    ].join("\n\n");
  }

  if (msg.includes("proxim") || msg.includes("next") || msg.includes("fazer") || msg.includes("prior")) {
    const nextHint =
      queueReady > 0
        ? "Há trabalho pronto na fila, então o caminho mais direto é disparar o scheduler deste projeto."
        : "Não encontrei itens ready na fila; antes de automatizar mais, convém rever workflow, backlog e agente ativo.";
    return [
      `Para o projeto \`${ctx.projectId}\`, eu seguiria por aqui:`,
      nextHint,
      `Sinais usados: stage \`${stage}\`, projeto ${blocked}, autonomia ${ctx.autonomy.enabled ? "ativa" : "desligada"}, contexto lido em ${summarizeKinds(ctx.relevantFiles)}.`,
      `Ficheiros base para decidir: ${firstFiles}.`,
      memory ? `Memória recente da conversa: ${memory}.` : "Posso manter memória desta conversa para os próximos passos do projeto.",
    ].join("\n\n");
  }

  if (msg.includes("estado") || msg.includes("status") || msg.includes("fila") || msg.includes("queue")) {
    return [
      `Resumo operacional de \`${ctx.projectId}\`:`,
      `Stage: \`${stage}\`. Projeto ${blocked}. Aprovação humana: ${ctx.state.requiresHumanApproval ? "sim" : "não"}.`,
      `Fila: ${ctx.queuePreview.length} itens totais, ${queueReady} ready, ${queueRunning} running.`,
      `Contexto carregado: ${summarizeKinds(ctx.relevantFiles)}.`,
      memory ? `Memória recente: ${memory}.` : "Sem memória conversacional relevante ainda.",
    ].join("\n\n");
  }

  return [
    `Estou a responder como orquestrador do projeto \`${ctx.projectId}\`, com acesso ao contexto do projeto e à memória desta conversa.`,
    `Li ${summarizeKinds(ctx.relevantFiles)}. Exemplos: ${firstFiles}.`,
    `Operacionalmente, o projeto está em stage \`${stage}\`, ${blocked}, com ${ctx.queuePreview.length} itens na fila.`,
    memory ? `Memória recente da conversa: ${memory}.` : "Se quiseres, posso analisar arquitetura, alterar backlog, ajustar código ou preparar execução mantendo o contexto daqui para frente.",
  ].join("\n\n");
}

export async function getProjectWorkbenchContext(
  monorepoRoot: string,
  projectsRoot: string,
  projectId: string,
): Promise<ProjectWorkbenchContext> {
  const projectRoot = projectPath(projectsRoot, projectId);
  const [summary, state, config, queuePreview] = await Promise.all([
    getProjectSummary(monorepoRoot, projectsRoot, projectId),
    readState(projectsRoot, projectId),
    loadProjectConfig(projectsRoot, projectId),
    getProjectQueue(projectsRoot, projectId),
  ]);
  const autonomy = mergeAutonomyPolicy(config.autonomy);

  const existingRoots: string[] = [];
  for (const rel of ROOT_CANDIDATES) {
    const abs = join(projectRoot, rel);
    if (await pathExists(abs)) {
      existingRoots.push(rel);
    }
  }

  const files: WorkbenchFile[] = [];
  for (const relRoot of existingRoots) {
    const relFiles = await collectFiles(join(projectRoot, relRoot), projectRoot, 6);
    for (const relFile of relFiles) {
      const record = await readWorkbenchFile(projectRoot, relFile);
      if (record) {
        files.push(record);
      }
      if (files.length >= 18) {
        break;
      }
    }
    if (files.length >= 18) {
      break;
    }
  }

  return {
    projectId,
    roots: existingRoots,
    summary,
    state,
    autonomy,
    queuePreview: queuePreview.slice(0, 20),
    relevantFiles: files,
  };
}

export async function chatAboutProject(
  monorepoRoot: string,
  projectsRoot: string,
  projectId: string,
  message: string,
  history: ConversationMessage[] = [],
) {
  const actionReply = await maybeHandleProjectAction(projectsRoot, projectId, message);
  if (actionReply) {
    const refreshed = await getProjectWorkbenchContext(monorepoRoot, projectsRoot, projectId);
    return {
      projectId,
      message: actionReply,
      engine: "operational-mvp",
      context: {
        roots: refreshed.roots,
        fileCount: refreshed.relevantFiles.length,
        files: refreshed.relevantFiles.map((file) => ({ path: file.path, kind: file.kind })),
      },
    };
  }

  const ctx = await getProjectWorkbenchContext(monorepoRoot, projectsRoot, projectId);
  const reply = buildOperationalAnswer({ message, ctx, history });
  return {
    projectId,
    message: reply,
    engine: "operational-mvp",
    context: {
      roots: ctx.roots,
      fileCount: ctx.relevantFiles.length,
      files: ctx.relevantFiles.map((file) => ({ path: file.path, kind: file.kind })),
    },
  };
}
