import { readYaml, writeYaml } from "@aios-celx/artifact-manager";
import type {
  ProjectConfig,
  ProjectLifecycleStatus,
  ProjectRecord,
  ProjectsRegistry,
} from "@aios-celx/shared";
import { ProjectsRegistrySchema } from "@aios-celx/shared";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export function projectsRegistryPath(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "projects-registry.yaml");
}

function registryLogPath(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "logs", "registry.log");
}

export async function appendRegistryLog(monorepoRoot: string, record: Record<string, unknown>): Promise<void> {
  const path = registryLogPath(monorepoRoot);
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), ...record }) + "\n";
  await appendFile(path, line, "utf8");
}

function nowIso(): string {
  return new Date().toISOString();
}

export function emptyRegistry(): ProjectsRegistry {
  const t = nowIso();
  return { version: 1, updatedAt: t, projects: [] };
}

export async function loadProjectsRegistry(monorepoRoot: string): Promise<ProjectsRegistry> {
  const path = projectsRegistryPath(monorepoRoot);
  try {
    const raw = await readYaml<unknown>(path);
    return ProjectsRegistrySchema.parse(raw);
  } catch {
    return emptyRegistry();
  }
}

export async function saveProjectsRegistry(monorepoRoot: string, doc: ProjectsRegistry): Promise<void> {
  const parsed = ProjectsRegistrySchema.parse(doc);
  parsed.updatedAt = nowIso();
  await writeYaml(projectsRegistryPath(monorepoRoot), parsed);
}

export function registryRelativePath(projectId: string): string {
  return `projects/${projectId}`;
}

export function findProjectRecord(registry: ProjectsRegistry, projectId: string): ProjectRecord | undefined {
  return registry.projects.find((p) => p.id === projectId);
}

export type ProjectListFilters = {
  status?: ProjectLifecycleStatus;
  blueprint?: string;
  tag?: string;
};

export function filterProjectRecords(
  registry: ProjectsRegistry,
  filters: ProjectListFilters,
): ProjectRecord[] {
  let list = [...registry.projects];
  if (filters.status) {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters.blueprint) {
    list = list.filter((p) => p.blueprint === filters.blueprint);
  }
  if (filters.tag) {
    const tag = filters.tag;
    list = list.filter((p) => p.tags.includes(tag));
  }
  return list.sort((a, b) => a.id.localeCompare(b.id, "en"));
}

export async function upsertProjectRecord(
  monorepoRoot: string,
  record: ProjectRecord,
  reason: string,
): Promise<void> {
  const reg = await loadProjectsRegistry(monorepoRoot);
  const idx = reg.projects.findIndex((p) => p.id === record.id);
  if (idx >= 0) {
    reg.projects[idx] = record;
  } else {
    reg.projects.push(record);
  }
  await saveProjectsRegistry(monorepoRoot, reg);
  await appendRegistryLog(monorepoRoot, {
    type: "registry.upsert",
    projectId: record.id,
    reason,
  });
}

/** Build a registry record from on-disk config (Bloco 5.2). */
export function projectRecordFromConfig(
  projectId: string,
  config: ProjectConfig,
  existing?: ProjectRecord,
): ProjectRecord {
  const t = nowIso();
  const rel = registryRelativePath(projectId);
  return {
    id: projectId,
    name: config.name ?? projectId,
    path: rel,
    blueprint: config.blueprint,
    status: (config.status ?? existing?.status ?? "active") as ProjectLifecycleStatus,
    createdAt: existing?.createdAt ?? config.createdAt,
    updatedAt: t,
    priority: config.priority ?? existing?.priority ?? "medium",
    tags: config.tags?.length ? config.tags : existing?.tags ?? [],
  };
}

export async function removeProjectRecord(monorepoRoot: string, projectId: string, reason: string): Promise<boolean> {
  const reg = await loadProjectsRegistry(monorepoRoot);
  const before = reg.projects.length;
  reg.projects = reg.projects.filter((p) => p.id !== projectId);
  if (reg.projects.length === before) {
    return false;
  }
  await saveProjectsRegistry(monorepoRoot, reg);
  await appendRegistryLog(monorepoRoot, {
    type: "registry.remove",
    projectId,
    reason,
  });
  return true;
}
