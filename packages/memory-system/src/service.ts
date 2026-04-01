import { readJson, writeJson } from "@aios-celx/artifact-manager";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { appendGlobalMemoryLog, appendProjectMemoryLog } from "./logs.js";
import { resolveMonorepoRoot } from "./monorepo-root.js";
import {
  globalMemoryPath,
  projectMemoryFile,
  projectMemorySnapshotsDir,
} from "./paths.js";
import type {
  GlobalMemory,
  MemoryCategory,
  MemoryEntry,
  MemorySnapshot,
  ProjectMemory,
} from "./schemas.js";
import { GlobalMemorySchema, MemoryEntrySchema, ProjectMemorySchema, MemorySnapshotSchema } from "./schemas.js";

function nowIso(): string {
  return new Date().toISOString();
}

function newEntryId(): string {
  return `mem-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

function emptyGlobal(): GlobalMemory {
  const t = nowIso();
  return { version: 1, entries: [], updatedAt: t };
}

function emptyProject(): ProjectMemory {
  const t = nowIso();
  return { version: 1, entries: [], updatedAt: t };
}

async function readOrEmptyGlobal(path: string): Promise<GlobalMemory> {
  try {
    const raw = await readJson<unknown>(path);
    return GlobalMemorySchema.parse(raw);
  } catch {
    return emptyGlobal();
  }
}

async function readOrEmptyProject(path: string): Promise<ProjectMemory> {
  try {
    const raw = await readJson<unknown>(path);
    return ProjectMemorySchema.parse(raw);
  } catch {
    return emptyProject();
  }
}

export async function loadGlobalMemory(monorepoRoot?: string): Promise<GlobalMemory> {
  const root = monorepoRoot ?? resolveMonorepoRoot();
  return readOrEmptyGlobal(globalMemoryPath(root));
}

export async function saveGlobalMemory(doc: GlobalMemory, monorepoRoot?: string): Promise<void> {
  const root = monorepoRoot ?? resolveMonorepoRoot();
  const parsed = GlobalMemorySchema.parse(doc);
  await writeJson(globalMemoryPath(root), parsed);
}

export async function addGlobalMemoryEntry(
  entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt"> & Partial<Pick<MemoryEntry, "id" | "createdAt" | "updatedAt">>,
  monorepoRoot?: string,
): Promise<MemoryEntry> {
  const root = monorepoRoot ?? resolveMonorepoRoot();
  const doc = await loadGlobalMemory(root);
  const t = nowIso();
  const full = MemoryEntrySchema.parse({
    ...entry,
    id: entry.id ?? newEntryId(),
    createdAt: entry.createdAt ?? t,
    updatedAt: entry.updatedAt ?? t,
  });
  doc.entries.push(full);
  doc.updatedAt = t;
  await saveGlobalMemory(doc, root);
  await appendGlobalMemoryLog(root, { type: "memory.global.add", entryId: full.id, category: full.category });
  return full;
}

export function listGlobalMemoryEntries(doc: GlobalMemory): MemoryEntry[] {
  return [...doc.entries];
}

export function findGlobalMemoryEntriesByCategory(
  doc: GlobalMemory,
  category: MemoryCategory,
): MemoryEntry[] {
  return doc.entries.filter((e) => e.category === category);
}

export function projectRootFromId(projectsRoot: string, projectId: string): string {
  return join(projectsRoot, projectId);
}

export async function loadProjectMemory(projectsRoot: string, projectId: string): Promise<ProjectMemory> {
  const root = projectRootFromId(projectsRoot, projectId);
  return readOrEmptyProject(projectMemoryFile(root));
}

export async function saveProjectMemory(
  doc: ProjectMemory,
  projectsRoot: string,
  projectId: string,
): Promise<void> {
  const root = projectRootFromId(projectsRoot, projectId);
  const parsed = ProjectMemorySchema.parse(doc);
  await writeJson(projectMemoryFile(root), parsed);
}

export async function addProjectMemoryEntry(
  projectsRoot: string,
  projectId: string,
  entry: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt"> & Partial<Pick<MemoryEntry, "id" | "createdAt" | "updatedAt">>,
): Promise<MemoryEntry> {
  const projRoot = projectRootFromId(projectsRoot, projectId);
  const doc = await loadProjectMemory(projectsRoot, projectId);
  const t = nowIso();
  const full = MemoryEntrySchema.parse({
    ...entry,
    id: entry.id ?? newEntryId(),
    createdAt: entry.createdAt ?? t,
    updatedAt: entry.updatedAt ?? t,
  });
  doc.entries.push(full);
  doc.updatedAt = t;
  await saveProjectMemory(doc, projectsRoot, projectId);
  await appendProjectMemoryLog(projRoot, {
    type: "memory.project.add",
    projectId,
    entryId: full.id,
    category: full.category,
  });
  return full;
}

export function listProjectMemoryEntries(doc: ProjectMemory): MemoryEntry[] {
  return [...doc.entries];
}

export function findProjectMemoryEntriesByCategory(
  doc: ProjectMemory,
  category: MemoryCategory,
): MemoryEntry[] {
  return doc.entries.filter((e) => e.category === category);
}

export async function createProjectMemorySnapshot(
  projectsRoot: string,
  projectId: string,
  note?: string,
): Promise<MemorySnapshot> {
  const projRoot = projectRootFromId(projectsRoot, projectId);
  const doc = await loadProjectMemory(projectsRoot, projectId);
  const t = nowIso();
  const snap: MemorySnapshot = MemorySnapshotSchema.parse({
    id: `snap-${Date.now()}-${randomBytes(3).toString("hex")}`,
    projectId,
    createdAt: t,
    entries: [...doc.entries],
    note,
  });
  const dir = projectMemorySnapshotsDir(projRoot);
  const file = join(dir, `${snap.id}.json`);
  await writeJson(file, snap);
  await appendProjectMemoryLog(projRoot, {
    type: "memory.project.snapshot",
    projectId,
    snapshotId: snap.id,
    path: file,
  });
  return snap;
}
