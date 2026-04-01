import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { autonomyLogPath } from "./paths.js";

export async function appendAutonomyLog(
  projectsRoot: string,
  projectId: string,
  record: Record<string, unknown>,
): Promise<void> {
  const path = autonomyLogPath(projectsRoot, projectId);
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), ...record }) + "\n";
  await appendFile(path, line, "utf8");
}
