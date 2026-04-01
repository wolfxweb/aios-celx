import { join } from "node:path";

export function portfolioYamlPath(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "portfolio.yaml");
}

export function portfolioLogPath(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "logs", "portfolio.log");
}
