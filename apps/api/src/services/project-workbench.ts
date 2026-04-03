import { loadProjectConfig, projectPath } from "@aios-celx/project-manager";
import { mergeAutonomyPolicy } from "@aios-celx/shared";
import { readState } from "@aios-celx/state-manager";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { getProjectQueue, getProjectSummary } from "./projects.js";

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

function buildOperationalAnswer(input: {
  message: string;
  ctx: ProjectWorkbenchContext;
}): string {
  const msg = input.message.toLowerCase();
  const { ctx } = input;
  const firstFiles = ctx.relevantFiles.slice(0, 6).map((f) => `\`${f.path}\``).join(", ") || "sem ficheiros relevantes";
  const stage = ctx.state.stage ?? "unknown";
  const blocked = ctx.state.blocked ? "bloqueado" : "desbloqueado";
  const queueReady = ctx.queuePreview.filter((item) => item.status === "ready").length;
  const queueRunning = ctx.queuePreview.filter((item) => item.status === "running").length;

  if (msg.includes("codigo") || msg.includes("code") || msg.includes("arquitet") || msg.includes("estrutura")) {
    return [
      `Analisei o projeto \`${ctx.projectId}\` e já consigo ver a estrutura principal.`,
      `Raízes relevantes detetadas: ${ctx.roots.join(", ") || "nenhuma"}.`,
      `Ficheiros amostrados: ${firstFiles}.`,
      `Estado operacional atual: stage \`${stage}\`, projeto ${blocked}, ${queueReady} itens ready e ${queueRunning} running na fila.`,
      "Este MVP ainda responde por síntese operacional do código e artefactos; o próximo passo natural é ligar uma engine real para análise e edição assistida.",
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
    ].join("\n\n");
  }

  if (msg.includes("estado") || msg.includes("status") || msg.includes("fila") || msg.includes("queue")) {
    return [
      `Resumo operacional de \`${ctx.projectId}\`:`,
      `Stage: \`${stage}\`. Projeto ${blocked}. Aprovação humana: ${ctx.state.requiresHumanApproval ? "sim" : "não"}.`,
      `Fila: ${ctx.queuePreview.length} itens totais, ${queueReady} ready, ${queueRunning} running.`,
      `Contexto carregado: ${summarizeKinds(ctx.relevantFiles)}.`,
    ].join("\n\n");
  }

  return [
    `Já consigo conversar sobre o projeto \`${ctx.projectId}\` com contexto de docs, backlog e código.`,
    `Li ${summarizeKinds(ctx.relevantFiles)}. Exemplos: ${firstFiles}.`,
    `Operacionalmente, o projeto está em stage \`${stage}\`, ${blocked}, com ${ctx.queuePreview.length} itens na fila.`,
    "Se quiseres, pede-me para analisar arquitetura, código, próximos passos ou risco operacional deste projeto.",
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
) {
  const ctx = await getProjectWorkbenchContext(monorepoRoot, projectsRoot, projectId);
  const reply = buildOperationalAnswer({ message, ctx });
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
