import { mkdir } from "node:fs/promises";
import { appendFile } from "node:fs/promises";
import { dirname } from "node:path";
import { globalMemoryLogPath, projectMemoryLogPath } from "./paths.js";

export async function appendGlobalMemoryLog(
  monorepoRoot: string,
  record: Record<string, unknown>,
): Promise<void> {
  const path = globalMemoryLogPath(monorepoRoot);
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), scope: "global", ...record }) + "\n";
  await appendFile(path, line, "utf8");
}

export async function appendProjectMemoryLog(
  projectRoot: string,
  record: Record<string, unknown>,
): Promise<void> {
  const path = projectMemoryLogPath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), scope: "project", ...record }) + "\n";
  await appendFile(path, line, "utf8");
}
