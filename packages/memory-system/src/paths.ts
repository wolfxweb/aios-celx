import { join } from "node:path";

export function globalMemoryPath(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "global-memory.json");
}

export function globalMemoryLogPath(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "logs", "memory.log");
}

export function projectMemoryDir(projectRoot: string): string {
  return join(projectRoot, ".aios", "memory");
}

export function projectMemoryFile(projectRoot: string): string {
  return join(projectMemoryDir(projectRoot), "project-memory.json");
}

export function projectMemorySnapshotsDir(projectRoot: string): string {
  return join(projectMemoryDir(projectRoot), "snapshots");
}

export function projectMemoryLogPath(projectRoot: string): string {
  return join(projectRoot, ".aios", "logs", "memory.log");
}
