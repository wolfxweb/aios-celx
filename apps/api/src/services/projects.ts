import { listQueueItems } from "@aios-celx/execution-queue";
import { loadProjectMemory } from "@aios-celx/memory-system";
import {
  buildProjectSummary,
  loadProjectConfig,
  listProjectsOnDisk,
  projectExists,
  projectPath,
  saveProjectConfig,
} from "@aios-celx/project-manager";
import { mergeAutonomyPolicy, TasksDocumentSchema } from "@aios-celx/shared";
import { readState } from "@aios-celx/state-manager";
import { readYaml } from "../../../../packages/artifact-manager/dist/index.js";
import { join } from "node:path";

export async function listProjectIds(projectsRoot: string): Promise<string[]> {
  return listProjectsOnDisk(projectsRoot);
}

export async function getProjectDetail(
  monorepoRoot: string,
  projectsRoot: string,
  projectId: string,
): Promise<{ config: unknown; summary: Awaited<ReturnType<typeof buildProjectSummary>> } | null> {
  if (!(await projectExists(projectsRoot, projectId))) {
    return null;
  }
  const [config, summary] = await Promise.all([
    loadProjectConfig(projectsRoot, projectId),
    buildProjectSummary(monorepoRoot, projectsRoot, projectId),
  ]);
  return { config, summary };
}

export async function getProjectState(projectsRoot: string, projectId: string) {
  return readState(projectsRoot, projectId);
}

export async function getProjectQueue(projectsRoot: string, projectId: string) {
  return listQueueItems(projectsRoot, projectId);
}

export async function getProjectMemory(projectsRoot: string, projectId: string) {
  return loadProjectMemory(projectsRoot, projectId);
}

export async function getProjectSummary(
  monorepoRoot: string,
  projectsRoot: string,
  projectId: string,
) {
  return buildProjectSummary(monorepoRoot, projectsRoot, projectId);
}

export async function getProjectTasks(projectsRoot: string, projectId: string) {
  const root = projectPath(projectsRoot, projectId);
  const raw = await readYaml<unknown>(join(root, "backlog/tasks.yaml"));
  const doc = TasksDocumentSchema.parse(raw);
  return doc.tasks;
}

export async function getProjectAutonomy(projectsRoot: string, projectId: string) {
  const cfg = await loadProjectConfig(projectsRoot, projectId);
  return mergeAutonomyPolicy(cfg.autonomy);
}

export async function getProjectExecutionMode(projectsRoot: string, projectId: string) {
  const cfg = await loadProjectConfig(projectsRoot, projectId);
  const record = cfg as Record<string, unknown>;
  return record.executionMode === "auto" ? "auto" : "manual";
}

export async function setProjectExecutionMode(
  projectsRoot: string,
  projectId: string,
  mode: "auto" | "manual",
) {
  const cfg = await loadProjectConfig(projectsRoot, projectId);
  await saveProjectConfig(projectsRoot, projectId, {
    ...(cfg as Record<string, unknown>),
    executionMode: mode,
  } as typeof cfg & { executionMode: "auto" | "manual" });
  return mode;
}

export async function listProjectsWithExecutionMode(projectsRoot: string) {
  const ids = await listProjectsOnDisk(projectsRoot);
  const entries = await Promise.all(
    ids.map(async (projectId) => ({
      projectId,
      executionMode: await getProjectExecutionMode(projectsRoot, projectId),
    })),
  );
  return entries;
}
