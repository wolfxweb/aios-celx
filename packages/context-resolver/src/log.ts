import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir } from "@aios-celx/artifact-manager";

export async function appendContextResolveLog(
  projectRoot: string,
  record: Record<string, unknown>,
): Promise<void> {
  const dir = join(projectRoot, ".aios", "logs");
  await ensureDir(dir);
  const line = `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`;
  await appendFile(join(dir, "executions.log"), line, "utf8");
}
