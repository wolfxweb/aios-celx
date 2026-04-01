import { join } from "node:path";

export function autonomyLogPath(projectsRoot: string, projectId: string): string {
  return join(projectsRoot, projectId, ".aios", "logs", "autonomy.log");
}
