import { readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { ensureDir, readYaml, writeJson, writeMarkdown, writeYaml } from "@aios-celx/artifact-manager";
import { getBlueprint, listBlueprintIds } from "@aios-celx/blueprints";
import { resolveMonorepoRoot } from "@aios-celx/memory-system";
import type { ProjectConfig, ProjectState } from "@aios-celx/shared";
import {
  DEFAULT_ENGINE_ID,
  DEFAULT_GIT_CONFIG,
  DEFAULT_WORKFLOW_ID,
  normalizeProjectConfig,
  ProjectConfigSchema,
} from "@aios-celx/shared";
import { renderTemplate } from "@aios-celx/templates";
import { projectRecordFromConfig, upsertProjectRecord } from "./registry.js";

export function projectPath(projectsRoot: string, projectId: string): string {
  return join(projectsRoot, projectId);
}

export async function projectExists(projectsRoot: string, projectId: string): Promise<boolean> {
  try {
    const configPath = join(projectPath(projectsRoot, projectId), ".aios", "config.yaml");
    await stat(configPath);
    return true;
  } catch {
    return false;
  }
}

export async function loadProjectConfig(
  projectsRoot: string,
  projectId: string,
): Promise<ProjectConfig> {
  const configPath = join(projectPath(projectsRoot, projectId), ".aios", "config.yaml");
  const raw = await readYaml<unknown>(configPath);
  const parsed = ProjectConfigSchema.parse(raw);
  return normalizeProjectConfig(parsed);
}

/** Persist normalized project config (Bloco 6.3 — e.g. autonomy toggle). */
export async function saveProjectConfig(
  projectsRoot: string,
  projectId: string,
  config: ProjectConfig,
): Promise<void> {
  const configPath = join(projectPath(projectsRoot, projectId), ".aios", "config.yaml");
  const normalized = normalizeProjectConfig(config);
  await writeYaml(configPath, normalized);

  const monorepoRoot = resolveMonorepoRoot(dirname(projectsRoot));
  const record = projectRecordFromConfig(projectId, normalized);
  await upsertProjectRecord(monorepoRoot, record, "saveProjectConfig:auto-sync");
}

/** Directories under `projects/` that contain `.aios/config.yaml`. */
export async function listProjectsOnDisk(projectsRoot: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(projectsRoot);
  } catch {
    return [];
  }

  const ids: string[] = [];
  for (const name of entries) {
    const full = join(projectsRoot, name);
    const st = await stat(full);
    if (!st.isDirectory()) continue;
    if (await projectExists(projectsRoot, name)) ids.push(name);
  }
  return ids.sort();
}

export type CreateProjectOptions = {
  projectsRoot: string;
  projectId: string;
  blueprintId: string;
};

export async function createProject(options: CreateProjectOptions): Promise<void> {
  const { projectsRoot, projectId, blueprintId } = options;
  const blueprint = getBlueprint(blueprintId);
  if (!blueprint) {
    throw new Error(`Unknown blueprint: ${blueprintId}. Available: ${listBlueprintIds().join(", ")}`);
  }
  if (await projectExists(projectsRoot, projectId)) {
    throw new Error(`Project already exists: ${projectId}`);
  }

  const root = projectPath(projectsRoot, projectId);

  for (const dir of blueprint.directories) {
    await ensureDir(join(root, dir));
  }

  const vars = { projectId };

  for (const [relPath, templateKey] of Object.entries(blueprint.files)) {
    const body = await renderTemplate(templateKey, vars);
    const dest = join(root, relPath);
    await writeMarkdown(dest, body);
  }

  const createdAt = new Date().toISOString();
  const config: ProjectConfig = normalizeProjectConfig({
    projectId,
    name: blueprint.name,
    blueprint: blueprint.id,
    createdAt,
    workflow: DEFAULT_WORKFLOW_ID,
    status: "active",
    priority: "medium",
    tags: [],
    engines: {
      default: DEFAULT_ENGINE_ID,
      "requirements-analyst": DEFAULT_ENGINE_ID,
      "product-manager": DEFAULT_ENGINE_ID,
      "software-architect": DEFAULT_ENGINE_ID,
      "delivery-manager": DEFAULT_ENGINE_ID,
    },
    git: DEFAULT_GIT_CONFIG,
    ...blueprint.initialConfig,
  });
  await writeYaml(join(root, ".aios", "config.yaml"), config);

  const state: ProjectState = {
    ...blueprint.initialState,
    projectId,
    updatedAt: createdAt,
  };
  await writeJson(join(root, ".aios", "state.json"), state);

  await writeJson(join(root, ".aios", "memory.json"), { entries: [] });

  const monorepoRoot = resolveMonorepoRoot(dirname(projectsRoot));
  const cfg = await loadProjectConfig(projectsRoot, projectId);
  const record = projectRecordFromConfig(projectId, cfg);
  await upsertProjectRecord(monorepoRoot, record, "project:create");
}
