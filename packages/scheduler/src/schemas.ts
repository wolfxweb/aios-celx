import { z } from "zod";
import { QueueItemTypeSchema } from "@aios-celx/execution-queue";
import { ParallelExecutionPlanSchema } from "./parallel-plan.js";

export const SchedulerRunModeSchema = z.enum(["once", "loop"]);
export type SchedulerRunMode = z.infer<typeof SchedulerRunModeSchema>;

export const SchedulerStopReasonSchema = z.enum([
  "no_eligible_item",
  "project_blocked",
  "requires_human_approval",
  "max_steps",
  "max_duration",
  "once_complete",
  "autonomy_disabled",
  "autonomy_loop_forbidden",
  "autonomy_max_auto_steps",
  "autonomy_item_type_blocked",
  "autonomy_blocked_task_in_backlog",
  "autonomy_halt_on_failure",
  "autonomy_approval_category_required",
  "autonomy_architecture_decision",
  "autonomy_scope_change",
]);

export type SchedulerStopReason = z.infer<typeof SchedulerStopReasonSchema>;

export const ScheduledExecutionSummarySchema = z.object({
  itemId: z.string(),
  type: QueueItemTypeSchema,
  ok: z.boolean(),
  message: z.string().optional(),
  durationMs: z.number(),
});

export type ScheduledExecutionSummary = z.infer<typeof ScheduledExecutionSummarySchema>;

export const SchedulerConfigSchema = z
  .object({
    projectsRoot: z.string(),
    projectId: z.string(),
    mode: SchedulerRunModeSchema,
    maxSteps: z.number().int().positive().optional(),
    maxDurationMs: z.number().int().positive().optional(),
    /** Bloco 6.6: at most 2 parallel items when the plan finds independent pairs. Default 1 (sequential). */
    maxConcurrent: z.number().int().min(1).max(2).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === "loop") {
      const hasSteps = val.maxSteps != null && val.maxSteps > 0;
      const hasDur = val.maxDurationMs != null && val.maxDurationMs > 0;
      if (!hasSteps && !hasDur) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "loop mode requires --max-steps and/or --max-duration-ms",
          path: ["maxSteps"],
        });
      }
    }
  });

export type SchedulerConfig = z.infer<typeof SchedulerConfigSchema>;

export const SchedulerResultSchema = z.object({
  projectId: z.string(),
  mode: SchedulerRunModeSchema,
  executedOk: z.number(),
  executedFailed: z.number(),
  stopReason: SchedulerStopReasonSchema,
  summaries: z.array(ScheduledExecutionSummarySchema),
  nextPeek: z.any().nullable(),
  startedAt: z.string(),
  finishedAt: z.string(),
  lastParallelPlan: ParallelExecutionPlanSchema.nullable().optional(),
});

export type SchedulerResult = z.infer<typeof SchedulerResultSchema>;
