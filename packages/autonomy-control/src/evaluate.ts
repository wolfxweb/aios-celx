import { loadTasks } from "@aios-celx/backlog-manager";
import type { QueueItem } from "@aios-celx/execution-queue";
import { projectPath } from "@aios-celx/project-manager";
import type { AutonomyPolicy, ProjectState } from "@aios-celx/shared";
import { ApprovalRequirementSchema } from "@aios-celx/shared";
import { appendAutonomyLog } from "./logs.js";
import type { AutonomyDecision } from "./schemas.js";

export type SchedulerRunMode = "once" | "loop";

export type EvaluateAutonomyInput = {
  policy: AutonomyPolicy;
  state: ProjectState;
  mode: SchedulerRunMode;
  /** Items already completed in this scheduler run (after each claim+execute). */
  processedThisRun: number;
  lastStepFailed: boolean;
  nextItem: QueueItem | null;
};

function remainingSteps(policy: AutonomyPolicy, processedThisRun: number): number {
  return Math.max(0, policy.maxAutoSteps - processedThisRun);
}

async function backlogHasBlockedTask(projectsRoot: string, projectId: string): Promise<boolean> {
  try {
    const doc = await loadTasks(projectPath(projectsRoot, projectId));
    return doc.tasks.some((t) => t.status === "blocked");
  } catch {
    return false;
  }
}

/**
 * Governs whether the scheduler may claim/execute the next peeked item (Bloco 6.3).
 */
export async function evaluateAutonomyForSchedulerStep(
  projectsRoot: string,
  projectId: string,
  input: EvaluateAutonomyInput,
): Promise<AutonomyDecision> {
  const { policy, state, mode, processedThisRun, lastStepFailed, nextItem } = input;
  const rem = remainingSteps(policy, processedThisRun);
  const scope = "scheduler" as const;

  const deny = async (
    code: NonNullable<AutonomyDecision["denyCode"]>,
    message: string,
  ): Promise<AutonomyDecision> => {
    const d: AutonomyDecision = { allow: false, denyCode: code, message, remainingAutoSteps: rem, scope };
    void appendAutonomyLog(projectsRoot, projectId, {
      type: "autonomy.decision",
      projectId,
      allow: false,
      denyCode: code,
      message,
      processedThisRun,
      nextItemId: nextItem?.id ?? null,
      nextItemType: nextItem?.type ?? null,
    });
    return d;
  };

  const allow = (message: string): AutonomyDecision => ({
    allow: true,
    message,
    remainingAutoSteps: rem,
    scope,
  });

  if (!policy.enabled) {
    return deny("autonomy_disabled", "Autonomy is disabled for this project.");
  }

  if (mode === "loop" && !policy.allowLoopExecution) {
    return deny("autonomy_loop_forbidden", "Loop scheduler runs are not allowed by autonomy policy.");
  }

  if (processedThisRun >= policy.maxAutoSteps) {
    return deny("autonomy_max_auto_steps", `Autonomy maxAutoSteps (${policy.maxAutoSteps}) reached for this run.`);
  }

  if (policy.haltOnFailure && lastStepFailed) {
    return deny("autonomy_halt_on_failure", "haltOnFailure: previous step failed.");
  }

  if (policy.haltOnApprovalRequired && state.requiresHumanApproval) {
    return deny(
      "autonomy_project_requires_approval",
      "haltOnApprovalRequired: project state requires human approval.",
    );
  }

  if (policy.haltOnBlockedTask && (await backlogHasBlockedTask(projectsRoot, projectId))) {
    return deny("autonomy_blocked_task_in_backlog", "haltOnBlockedTask: a task is blocked in backlog.");
  }

  if (!nextItem) {
    return allow("No eligible queue item; scheduler will stop.");
  }

  const t = nextItem.type;
  if (t === "run-task" && !policy.autoRunTask) {
    return deny("autonomy_item_type_blocked", "autoRunTask is false.");
  }
  if (t === "run-qa" && !policy.autoRunQA) {
    return deny("autonomy_item_type_blocked", "autoRunQA is false.");
  }
  if (t === "run-story" && !policy.autoRunStory) {
    return deny("autonomy_item_type_blocked", "autoRunStory is false.");
  }
  if (t !== "run-task" && t !== "run-qa" && t !== "run-story") {
    return deny("autonomy_item_type_blocked", `Queue type "${t}" is not auto-runnable by scheduler.`);
  }

  const rawCat = nextItem.metadata.approvalCategory;
  if (rawCat != null && typeof rawCat === "string") {
    const cat = ApprovalRequirementSchema.safeParse(rawCat);
    if (cat.success && policy.requireApprovalFor.includes(cat.data)) {
      return deny(
        "autonomy_approval_category_required",
        `requireApprovalFor includes "${cat.data}" (item metadata).`,
      );
    }
  }

  if (policy.haltOnArchitectureDecision && nextItem.metadata.architectureDecision === true) {
    return deny("autonomy_architecture_decision", "haltOnArchitectureDecision: item flagged architectureDecision.");
  }

  if (policy.haltOnScopeChange && nextItem.metadata.scopeChange === true) {
    return deny("autonomy_scope_change", "haltOnScopeChange: item flagged scopeChange.");
  }

  void appendAutonomyLog(projectsRoot, projectId, {
    type: "autonomy.decision",
    projectId,
    allow: true,
    processedThisRun,
    nextItemId: nextItem.id,
    nextItemType: nextItem.type,
  });

  return allow("Autonomy allows this step.");
}
