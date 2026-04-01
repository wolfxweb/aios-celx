import type { GitProjectConfig } from "@aios-celx/shared";

/** `feature-x` → `aios/feature-x`; `fix/foo` stays as-is. */
export function resolvePrefixedBranchName(git: GitProjectConfig, name: string): string {
  const trimmed = name.trim();
  if (trimmed.includes("/")) {
    return trimmed;
  }
  return `${git.defaultBranchPrefix}/${trimmed}`;
}
