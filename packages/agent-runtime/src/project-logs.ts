import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir } from "@aios-celx/artifact-manager";

async function logsDir(projectRoot: string): Promise<string> {
  const dir = join(projectRoot, ".aios", "logs");
  await ensureDir(dir);
  return dir;
}

export async function appendExecutionLogLine(projectRoot: string, record: Record<string, unknown>): Promise<void> {
  const dir = await logsDir(projectRoot);
  const line = `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`;
  await appendFile(join(dir, "executions.log"), line, "utf8");
}

export async function appendEventLogLine(projectRoot: string, record: Record<string, unknown>): Promise<void> {
  const dir = await logsDir(projectRoot);
  const line = `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`;
  await appendFile(join(dir, "events.log"), line, "utf8");
}
