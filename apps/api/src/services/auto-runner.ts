import { listQueueItems } from "@aios-celx/execution-queue";
import { readState } from "@aios-celx/state-manager";
import type { ApiEnvConfig } from "../config.js";
import * as projectsSvc from "./projects.js";
import * as schedSvc from "./scheduler.js";

export type AutoRunnerHandle = {
  stop: () => void;
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function startAutoRunner(
  cfg: ApiEnvConfig,
  options?: {
    intervalMs?: number;
    logger?: Pick<Console, "info" | "warn" | "error">;
  },
): AutoRunnerHandle {
  const logger = options?.logger ?? console;
  const intervalMs = options?.intervalMs ?? parsePositiveInt(process.env.AIOS_AUTO_RUNNER_INTERVAL_MS, 8000);
  const runningProjects = new Set<string>();
  let tickInFlight = false;

  const tick = async () => {
    if (tickInFlight) {
      return;
    }
    tickInFlight = true;
    try {
      const projects = await projectsSvc.listProjectsWithExecutionMode(cfg.projectsRoot);
      for (const entry of projects) {
        if (entry.executionMode !== "auto") {
          continue;
        }
        if (runningProjects.has(entry.projectId)) {
          continue;
        }

        const [state, queue] = await Promise.all([
          readState(cfg.projectsRoot, entry.projectId).catch(() => null),
          listQueueItems(cfg.projectsRoot, entry.projectId).catch(() => []),
        ]);
        if (!state || state.blocked || state.requiresHumanApproval) {
          continue;
        }

        const hasRunnableItems = queue.some((item) => item.status === "pending" || item.status === "ready");
        if (!hasRunnableItems) {
          continue;
        }

        runningProjects.add(entry.projectId);
        void schedSvc
          .runSchedulerForProject(cfg.projectsRoot, entry.projectId, {
            mode: "once",
            maxConcurrent: 1,
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[auto-runner] Falha ao executar ${entry.projectId}: ${message}`);
          })
          .finally(() => {
            runningProjects.delete(entry.projectId);
          });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[auto-runner] Tick falhou: ${message}`);
    } finally {
      tickInFlight = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  void tick();

  return {
    stop: () => clearInterval(timer),
  };
}
