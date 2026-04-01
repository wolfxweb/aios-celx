import { z } from "zod";

export const AutonomyScopeSchema = z.enum(["scheduler", "cli", "global"]);
export type AutonomyScope = z.infer<typeof AutonomyScopeSchema>;

export const AutonomyDenyCodeSchema = z.enum([
  "autonomy_disabled",
  "autonomy_loop_forbidden",
  "autonomy_max_auto_steps",
  "autonomy_item_type_blocked",
  "autonomy_blocked_task_in_backlog",
  "autonomy_halt_on_failure",
  "autonomy_project_requires_approval",
  "autonomy_approval_category_required",
  "autonomy_architecture_decision",
  "autonomy_scope_change",
]);

export type AutonomyDenyCode = z.infer<typeof AutonomyDenyCodeSchema>;

export const AutonomyDecisionSchema = z.object({
  allow: z.boolean(),
  denyCode: AutonomyDenyCodeSchema.optional(),
  message: z.string(),
  remainingAutoSteps: z.number(),
  scope: AutonomyScopeSchema,
});

export type AutonomyDecision = z.infer<typeof AutonomyDecisionSchema>;
