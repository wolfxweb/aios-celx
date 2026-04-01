import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function hasWorkspaceMarker(dir: string): boolean {
  return (
    existsSync(join(dir, "pnpm-workspace.yaml")) ||
    (existsSync(join(dir, "package.json")) && existsSync(join(dir, "turbo.json")))
  );
}

/**
 * Resolve the aios-celx monorepo root (directory containing `pnpm-workspace.yaml` or `turbo.json`).
 * `AIOS_CELX_ROOT` overrides when set.
 */
export function resolveMonorepoRoot(startDir: string = process.cwd()): string {
  const fromEnv = process.env.AIOS_CELX_ROOT;
  if (fromEnv && fromEnv.length > 0) {
    return resolve(fromEnv);
  }

  let cur = resolve(startDir);
  for (let i = 0; i < 32; i++) {
    if (hasWorkspaceMarker(cur)) {
      return cur;
    }
    const parent = dirname(cur);
    if (parent === cur) {
      break;
    }
    cur = parent;
  }

  /** Fallback: parent of `projects/` when cwd is inside `projects/<id>`. */
  const projectsParent = resolve(startDir, "..", "..");
  if (existsSync(join(projectsParent, "pnpm-workspace.yaml"))) {
    return projectsParent;
  }

  return resolve(startDir);
}

/** `projects/` directory (parent of a managed project folder). */
export function resolveProjectsRootFromProjectRoot(projectRoot: string): string {
  return dirname(resolve(projectRoot));
}

/** Monorepo root when `projectRoot` is `.../projects/<projectId>`. */
export function resolveMonorepoRootFromProjectRoot(projectRoot: string): string {
  const projectsRoot = resolveProjectsRootFromProjectRoot(projectRoot);
  return resolveMonorepoRoot(projectsRoot);
}
