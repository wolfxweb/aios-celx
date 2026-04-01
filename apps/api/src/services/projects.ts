import { listQueueItems } from "@aios-celx/execution-queue";
import { loadProjectMemory } from "@aios-celx/memory-system";
import {
  buildProjectSummary,
  loadProjectConfig,
  listProjectsOnDisk,
  projectExists,
} from "@aios-celx/project-manager";
import { mergeAutonomyPolicy } from "@aios-celx/shared";
import { readState } from "@aios-celx/state-manager";

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

export async function getProjectAutonomy(projectsRoot: string, projectId: string) {
  const cfg = await loadProjectConfig(projectsRoot, projectId);
  return mergeAutonomyPolicy(cfg.autonomy);
}
