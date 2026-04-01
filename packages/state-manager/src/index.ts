import { join } from "node:path";
import { readJson, writeJson } from "@aios-celx/artifact-manager";
import type { ProjectState } from "@aios-celx/shared";
import { ProjectStateSchema } from "@aios-celx/shared";

export function projectRoot(projectsRoot: string, projectId: string): string {
  return join(projectsRoot, projectId);
}

export function statePath(projectsRoot: string, projectId: string): string {
  return join(projectRoot(projectsRoot, projectId), ".aios", "state.json");
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function readState(projectsRoot: string, projectId: string): Promise<ProjectState> {
  const path = statePath(projectsRoot, projectId);
  const raw = await readJson<unknown>(path);
  return ProjectStateSchema.parse(raw);
}

export async function writeState(projectsRoot: string, projectId: string, state: ProjectState): Promise<void> {
  const path = statePath(projectsRoot, projectId);
  await writeJson(path, state);
}

export async function updateState(
  projectsRoot: string,
  projectId: string,
  patch: Partial<ProjectState>,
): Promise<ProjectState> {
  const current = await readState(projectsRoot, projectId);
  const next: ProjectState = {
    ...current,
    ...patch,
    projectId,
    updatedAt: nowIso(),
  };
  await writeState(projectsRoot, projectId, next);
  return next;
}

export async function completeGate(
  projectsRoot: string,
  projectId: string,
  gateId: string,
): Promise<ProjectState> {
  const current = await readState(projectsRoot, projectId);
  const completedGates = current.completedGates.includes(gateId)
    ? current.completedGates
    : [...current.completedGates, gateId];
  const next: ProjectState = {
    ...current,
    completedGates,
    nextGate: current.nextGate === gateId ? "" : current.nextGate,
    updatedAt: nowIso(),
  };
  await writeState(projectsRoot, projectId, next);
  return next;
}

export async function setBlocked(
  projectsRoot: string,
  projectId: string,
  blocked: boolean,
): Promise<ProjectState> {
  return updateState(projectsRoot, projectId, { blocked });
}
