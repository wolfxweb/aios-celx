import type { AutonomyDenyCode } from "@aios-celx/autonomy-control";
import type { SchedulerStopReason } from "./schemas.js";

export function mapAutonomyDenyToStopReason(code: AutonomyDenyCode): SchedulerStopReason {
  if (code === "autonomy_project_requires_approval") {
    return "requires_human_approval";
  }
  return code as SchedulerStopReason;
}
