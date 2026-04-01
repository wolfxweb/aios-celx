import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { queueLogPath } from "./paths.js";

export async function appendQueueLog(
  projectsRoot: string,
  projectId: string,
  record: Record<string, unknown>,
): Promise<void> {
  const path = queueLogPath(projectsRoot, projectId);
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), ...record }) + "\n";
  await appendFile(path, line, "utf8");
}
