import { readMarkdown } from "@aios-celx/artifact-manager";
import { resolveAgentContext } from "@aios-celx/context-resolver";
import type { MemoryEntry } from "@aios-celx/memory-system";
import type { ProjectState, WorkflowDefinition } from "@aios-celx/shared";
import { dirname, join } from "node:path";

export type AgentExecutionContext = {
  projectRoot: string;
  projectId: string;
  agentId: string;
  state: ProjectState;
  workflow: WorkflowDefinition;
  /** Relative paths → file contents (UTF-8). */
  files: Record<string, string>;
  /** Bloco 5.1 / 5.4 — filtered slices for this agent (empty arrays when none). */
  memory: { global: MemoryEntry[]; project: MemoryEntry[] };
};

export async function readProjectFile(projectRoot: string, relPath: string): Promise<string> {
  return readMarkdown(join(projectRoot, relPath));
}

/**
 * Bloco 5.4 — single assembly point via `@aios-celx/context-resolver`.
 * `fallbackReadPaths` applies when the agent has no dedicated rule (unknown agents).
 */
export async function buildAgentContext(
  projectRoot: string,
  projectId: string,
  agentId: string,
  state: ProjectState,
  workflow: WorkflowDefinition,
  fallbackReadPaths: string[],
): Promise<AgentExecutionContext> {
  const projectsRoot = dirname(projectRoot);
  const resolved = await resolveAgentContext({
    projectsRoot,
    projectId,
    agentId,
    taskId: state.currentTaskId ?? undefined,
    storyId: state.activeStoryId ?? undefined,
    state,
    workflow,
    fallbackReadPaths,
  });
  return {
    projectRoot,
    projectId,
    agentId,
    state: resolved.state,
    workflow: resolved.workflow,
    files: resolved.files,
    memory: {
      global: resolved.memory.globalEntries as MemoryEntry[],
      project: resolved.memory.projectEntries as MemoryEntry[],
    },
  };
}
