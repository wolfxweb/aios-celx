import { resolveMonorepoRoot } from "@aios-celx/memory-system";
import type { ProjectWorkspace } from "@aios-celx/shared";
import { dirname } from "node:path";
import {
  createProject,
  listProjectsOnDisk,
  loadProjectConfig,
  saveProjectConfig,
  projectExists,
  projectPath,
  type CreateProjectOptions,
} from "./project-core.js";
import {
  filterProjectRecords,
  loadProjectsRegistry,
  type ProjectListFilters,
} from "./registry.js";

export {
  createProject,
  listProjectsOnDisk,
  loadProjectConfig,
  saveProjectConfig,
  projectExists,
  projectPath,
  type CreateProjectOptions,
};

export {
  appendRegistryLog,
  emptyRegistry,
  filterProjectRecords,
  findProjectRecord,
  loadProjectsRegistry,
  projectRecordFromConfig,
  projectsRegistryPath,
  registryRelativePath,
  removeProjectRecord,
  saveProjectsRegistry,
  upsertProjectRecord,
  type ProjectListFilters,
} from "./registry.js";

export { syncProjectsRegistry, type SyncProjectsRegistryResult } from "./sync.js";
export { buildProjectSummary } from "./summary.js";

export async function listProjects(
  projectsRoot: string,
  options?: { monorepoRoot?: string; preferRegistry?: boolean },
): Promise<string[]> {
  const prefer = options?.preferRegistry !== false;
  const mono = options?.monorepoRoot ?? resolveMonorepoRoot(dirname(projectsRoot));
  if (prefer) {
    const reg = await loadProjectsRegistry(mono);
    if (reg.projects.length > 0) {
      return reg.projects.map((p) => p.id).sort();
    }
  }
  return listProjectsOnDisk(projectsRoot);
}

export async function listProjectRecords(
  projectsRoot: string,
  filters: ProjectListFilters,
  monorepoRoot?: string,
): Promise<ReturnType<typeof filterProjectRecords>> {
  const mono = monorepoRoot ?? resolveMonorepoRoot(dirname(projectsRoot));
  const reg = await loadProjectsRegistry(mono);
  return filterProjectRecords(reg, filters);
}

export function resolveProjectWorkspace(
  monorepoRoot: string,
  projectsRoot: string,
  projectId: string,
): ProjectWorkspace {
  return {
    projectId,
    monorepoRoot,
    projectsRoot,
    projectRoot: projectPath(projectsRoot, projectId),
  };
}
