import { readMarkdown, readYaml } from "@aios-celx/artifact-manager";
import { findTaskById, loadEpics, loadStories, loadTasks } from "@aios-celx/backlog-manager";
import type { MemoryEntry } from "@aios-celx/memory-system";
import { loadGlobalMemory, loadProjectMemory, resolveMonorepoRootFromProjectRoot } from "@aios-celx/memory-system";
import { loadProjectConfig } from "@aios-celx/project-manager";
import type { ProjectConfig, ProjectState, WorkflowDefinition } from "@aios-celx/shared";
import { join } from "node:path";
import { appendContextResolveLog } from "./log.js";
import { AGENT_CONTEXT_RULES, mergeReadPaths, type AgentContextRule } from "./rules.js";
import type { ContextArtifact, ContextMemorySlice, ContextScope } from "./schemas.js";

const BACKLOG_SNIP_MAX = 14_000;

export type ContextRequest = {
  projectsRoot: string;
  projectId: string;
  agentId: string;
  taskId?: string;
  storyId?: string;
  state: ProjectState;
  workflow: WorkflowDefinition;
  /** Used when agent has no entry in AGENT_CONTEXT_RULES. */
  fallbackReadPaths?: string[];
};

export type ResolvedContext = {
  scope: ContextScope;
  projectRoot: string;
  projectId: string;
  agentId: string;
  config: ProjectConfig;
  state: ProjectState;
  workflow: WorkflowDefinition;
  files: Record<string, string>;
  memory: ContextMemorySlice;
  backlogSnippet: string | null;
  artifacts: ContextArtifact[];
};

function assertSafeProjectId(projectId: string): void {
  if (projectId.includes("..") || projectId.includes("/") || projectId.includes("\\")) {
    throw new Error(`Invalid projectId: ${projectId}`);
  }
}

function safePathSegment(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function filterMem(entries: MemoryEntry[], cats: string[]): MemoryEntry[] {
  if (cats.length === 0) {
    return [];
  }
  const set = new Set(cats);
  return entries.filter((e) => set.has(e.category));
}

async function readOptionalFile(projectRoot: string, rel: string): Promise<string | null> {
  try {
    return await readMarkdown(join(projectRoot, rel));
  } catch {
    return null;
  }
}

async function buildBacklogSnippet(
  projectRoot: string,
  mode: AgentContextRule["backlogMode"],
): Promise<string | null> {
  if (mode === "none") {
    return null;
  }
  try {
    if (mode === "full") {
      const [epics, stories, tasks] = await Promise.all([
        loadEpics(projectRoot),
        loadStories(projectRoot),
        loadTasks(projectRoot),
      ]);
      const blob = JSON.stringify({ epics, stories, tasks }, null, 2);
      return blob.length > BACKLOG_SNIP_MAX ? blob.slice(0, BACKLOG_SNIP_MAX) + "\n…(truncated)" : blob;
    }
    if (mode === "stories_and_tasks") {
      const [stories, tasks] = await Promise.all([loadStories(projectRoot), loadTasks(projectRoot)]);
      const blob = JSON.stringify({ stories, tasks }, null, 2);
      return blob.length > BACKLOG_SNIP_MAX ? blob.slice(0, BACKLOG_SNIP_MAX) + "\n…(truncated)" : blob;
    }
  } catch {
    return "(backlog unavailable)";
  }
  return null;
}

export async function resolveAgentContext(req: ContextRequest): Promise<ResolvedContext> {
  assertSafeProjectId(req.projectId);
  const projectRoot = join(req.projectsRoot, req.projectId);
  const monorepoRoot = resolveMonorepoRootFromProjectRoot(projectRoot);
  const rule = AGENT_CONTEXT_RULES[req.agentId];
  const readPaths = mergeReadPaths(rule, req.fallbackReadPaths);

  const config = await loadProjectConfig(req.projectsRoot, req.projectId);
  if (config.projectId !== req.projectId) {
    throw new Error("Context resolver: config projectId mismatch (isolation check)");
  }

  const [gDoc, pDoc] = await Promise.all([
    loadGlobalMemory(monorepoRoot),
    loadProjectMemory(req.projectsRoot, req.projectId),
  ]);

  const gCats = rule?.memory.global ?? [];
  const pCats = rule?.memory.project ?? [];
  const globalEntries = filterMem(gDoc.entries, gCats);
  const projectEntries = filterMem(pDoc.entries, pCats);

  const files: Record<string, string> = {};
  const artifacts: ContextArtifact[] = [];

  for (const rel of readPaths) {
    const text = await readOptionalFile(projectRoot, rel);
    const present = text !== null;
    if (present && text !== null) {
      files[rel] = text;
    }
    artifacts.push({
      path: rel,
      present,
      charCount: text?.length,
    });
  }

  const taskId = req.taskId ?? req.state.currentTaskId ?? undefined;
  const storyId = req.storyId ?? req.state.activeStoryId ?? undefined;

  if (rule?.attachTaskJson && taskId) {
    try {
      const tasksDoc = await loadTasks(projectRoot);
      const task = findTaskById(tasksDoc, taskId);
      if (task) {
        const key = "context/current-task.json";
        const body = JSON.stringify(task, null, 2);
        files[key] = body;
        artifacts.push({ path: key, role: "task", present: true, charCount: body.length });
      }
    } catch {
      /* optional */
    }
  }

  if (rule?.attachImplementationReport && taskId) {
    const rel = `docs/execution/${safePathSegment(taskId)}-implementation.md`;
    const text = await readOptionalFile(projectRoot, rel);
    if (text !== null) {
      files[rel] = text;
      artifacts.push({ path: rel, role: "implementation-report", present: true, charCount: text.length });
    } else {
      artifacts.push({ path: rel, role: "implementation-report", present: false });
    }
  }

  const backlogSnippet = await buildBacklogSnippet(projectRoot, rule?.backlogMode ?? "none");
  if (backlogSnippet) {
    const key = "context/backlog-snapshot.json";
    files[key] = backlogSnippet;
    artifacts.push({ path: key, role: "backlog", present: true, charCount: backlogSnippet.length });
  }

  const resolvedAt = new Date().toISOString();
  const scope: ContextScope = {
    projectId: req.projectId,
    agentId: req.agentId,
    resolvedAt,
  };

  const memory: ContextMemorySlice = {
    globalEntries: globalEntries.map((e) => ({ ...e })),
    projectEntries: projectEntries.map((e) => ({ ...e })),
    globalCategoriesUsed: gCats,
    projectCategoriesUsed: pCats,
  };

  await appendContextResolveLog(projectRoot, {
    type: "context.resolve",
    projectId: req.projectId,
    agentId: req.agentId,
    taskId: taskId ?? null,
    storyId: storyId ?? null,
    fileKeys: Object.keys(files),
    memoryGlobalCount: globalEntries.length,
    memoryProjectCount: projectEntries.length,
    monorepoRoot,
  });

  return {
    scope,
    projectRoot,
    projectId: req.projectId,
    agentId: req.agentId,
    config,
    state: req.state,
    workflow: req.workflow,
    files,
    memory,
    backlogSnippet,
    artifacts,
  };
}
