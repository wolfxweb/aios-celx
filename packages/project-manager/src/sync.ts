import type { ProjectRecord, ProjectsRegistry } from "@aios-celx/shared";
import { loadProjectConfig, listProjectsOnDisk } from "./project-core.js";
import {
  appendRegistryLog,
  findProjectRecord,
  loadProjectsRegistry,
  projectRecordFromConfig,
  saveProjectsRegistry,
} from "./registry.js";

export type SyncProjectsRegistryResult = {
  added: string[];
  updated: string[];
  pruned: string[];
  missingOnDisk: string[];
};

export async function syncProjectsRegistry(options: {
  monorepoRoot: string;
  projectsRoot: string;
  prune?: boolean;
}): Promise<SyncProjectsRegistryResult> {
  const { monorepoRoot, projectsRoot, prune } = options;
  const diskIds = new Set(await listProjectsOnDisk(projectsRoot));
  let reg: ProjectsRegistry = await loadProjectsRegistry(monorepoRoot);
  const added: string[] = [];
  const updated: string[] = [];

  for (const id of diskIds) {
    const config = await loadProjectConfig(projectsRoot, id);
    const existing = findProjectRecord(reg, id);
    const next = projectRecordFromConfig(id, config, existing);
    if (!existing) {
      reg.projects.push(next);
      added.push(id);
    } else {
      const changed =
        existing.blueprint !== next.blueprint ||
        existing.name !== next.name ||
        existing.status !== next.status ||
        existing.priority !== next.priority ||
        JSON.stringify([...existing.tags].sort()) !== JSON.stringify([...next.tags].sort());
      reg.projects = reg.projects.map((p: ProjectRecord) => (p.id === id ? next : p));
      if (changed) {
        updated.push(id);
      }
    }
  }

  let missingOnDisk = reg.projects.filter((p: ProjectRecord) => !diskIds.has(p.id)).map((p) => p.id);
  const pruned: string[] = [];
  if (prune && missingOnDisk.length > 0) {
    reg = {
      ...reg,
      projects: reg.projects.filter((p: ProjectRecord) => diskIds.has(p.id)),
    };
    pruned.push(...missingOnDisk);
    missingOnDisk = [];
  }

  await saveProjectsRegistry(monorepoRoot, reg);
  await appendRegistryLog(monorepoRoot, {
    type: "registry.sync",
    added,
    updated,
    pruned,
    missingOnDisk,
  });

  return { added, updated, pruned, missingOnDisk };
}
