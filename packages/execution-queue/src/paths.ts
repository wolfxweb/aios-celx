import { join } from "node:path";

export function projectRoot(projectsRoot: string, projectId: string): string {
  return join(projectsRoot, projectId);
}

/** Persisted queue document per project. */
export function queueJsonPath(projectsRoot: string, projectId: string): string {
  return join(projectRoot(projectsRoot, projectId), ".aios", "queue.json");
}

export function queueLogPath(projectsRoot: string, projectId: string): string {
  return join(projectRoot(projectsRoot, projectId), ".aios", "logs", "queue.log");
}
