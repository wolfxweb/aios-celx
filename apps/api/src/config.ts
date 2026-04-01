import { resolveMonorepoRoot } from "@aios-celx/memory-system";
import { isAbsolute, join } from "node:path";

function resolveMonorepoRootForApi(): string {
  const fromEnv = process.env.AIOS_MONOREPO_ROOT;
  if (fromEnv && fromEnv.length > 0) {
    return isAbsolute(fromEnv) ? fromEnv : join(process.cwd(), fromEnv);
  }
  return resolveMonorepoRoot(process.cwd());
}

/** Default `./projects` at monorepo root so `pnpm --filter @aios-celx/api start` from `apps/api` still finds managed projects. */
function resolveProjectsRoot(monorepoRoot: string): string {
  const fromEnv = process.env.AIOS_PROJECTS_ROOT;
  if (fromEnv && fromEnv.length > 0) {
    return isAbsolute(fromEnv) ? fromEnv : join(process.cwd(), fromEnv);
  }
  return join(monorepoRoot, "projects");
}

export type ApiEnvConfig = {
  projectsRoot: string;
  monorepoRoot: string;
  host: string;
  port: number;
};

export function loadApiConfig(): ApiEnvConfig {
  const monorepoRoot = resolveMonorepoRootForApi();
  const portRaw = process.env.AIOS_API_PORT ?? "3030";
  const port = Number.parseInt(portRaw, 10);
  return {
    projectsRoot: resolveProjectsRoot(monorepoRoot),
    monorepoRoot,
    host: process.env.AIOS_API_HOST ?? "127.0.0.1",
    port: Number.isNaN(port) ? 3030 : port,
  };
}
