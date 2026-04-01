import type { QueueItem } from "@aios-celx/execution-queue";
import { runEngineerTask } from "./engineer-task-runner.js";
import { runQaTask } from "./qa-task-runner.js";
import { runStoryExecution } from "./story-execution.js";

/**
 * Executa um item de fila (Bloco 6.1+) — usado pela CLI `queue:run-next` e pelo scheduler (6.2).
 */
export async function executeQueueItem(
  projectsRoot: string,
  projectId: string,
  item: QueueItem,
): Promise<{ ok: boolean; message?: string }> {
  switch (item.type) {
    case "run-task": {
      const taskId = String(item.payload.taskId ?? "");
      if (!taskId) {
        return { ok: false, message: "payload.taskId required" };
      }
      const result = await runEngineerTask({ projectsRoot, projectId, taskId });
      return { ok: result.ok, message: result.message };
    }
    case "run-qa": {
      const taskId = String(item.payload.taskId ?? "");
      if (!taskId) {
        return { ok: false, message: "payload.taskId required" };
      }
      const result = await runQaTask({ projectsRoot, projectId, taskId });
      return { ok: result.ok, message: result.message };
    }
    case "run-story": {
      const storyId = String(item.payload.storyId ?? "");
      if (!storyId) {
        return { ok: false, message: "payload.storyId required" };
      }
      const withQa = Boolean(item.payload.withQa);
      const result = await runStoryExecution({ projectsRoot, projectId, storyId, withQa });
      return { ok: result.ok, message: result.message };
    }
    default:
      return { ok: false, message: `Queue item type not executable: ${item.type}` };
  }
}
