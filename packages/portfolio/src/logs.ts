import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { portfolioLogPath } from "./paths.js";

export async function appendPortfolioLog(monorepoRoot: string, record: Record<string, unknown>): Promise<void> {
  const path = portfolioLogPath(monorepoRoot);
  await mkdir(dirname(path), { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), ...record }) + "\n";
  await appendFile(path, line, "utf8");
}
