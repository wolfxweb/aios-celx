import { join } from "node:path";

export function schedulerLogPath(projectsRoot: string, projectId: string): string {
  return join(projectsRoot, projectId, ".aios", "logs", "scheduler.log");
}
