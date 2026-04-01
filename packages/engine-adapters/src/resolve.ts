import type { ProjectConfig } from "@aios-celx/shared";
import { DEFAULT_ENGINE_ID, normalizeProjectConfig } from "@aios-celx/shared";

export function resolveEngineId(config: ProjectConfig, agentId: string): string {
  const c = normalizeProjectConfig(config);
  const map = c.engines ?? { default: DEFAULT_ENGINE_ID };
  const direct = map[agentId];
  if (direct) {
    return direct;
  }
  return map.default ?? DEFAULT_ENGINE_ID;
}

export function describeExecutionConfig(
  config: ProjectConfig,
  agentId: string,
): { agentId: string; engineId: string; usedFallback: boolean } {
  const raw = config.engines ?? {};
  const engineId = resolveEngineId(config, agentId);
  const usedFallback = raw[agentId] === undefined;
  return {
    agentId,
    engineId,
    usedFallback,
  };
}
