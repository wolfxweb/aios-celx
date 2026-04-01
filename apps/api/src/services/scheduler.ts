import { runScheduler } from "@aios-celx/scheduler";
import type { SchedulerConfig } from "@aios-celx/scheduler";

export async function runSchedulerForProject(
  projectsRoot: string,
  projectId: string,
  input: Pick<SchedulerConfig, "mode" | "maxSteps" | "maxDurationMs" | "maxConcurrent">,
) {
  return runScheduler({
    projectsRoot,
    projectId,
    mode: input.mode,
    maxSteps: input.maxSteps,
    maxDurationMs: input.maxDurationMs,
    maxConcurrent: input.maxConcurrent,
  });
}
