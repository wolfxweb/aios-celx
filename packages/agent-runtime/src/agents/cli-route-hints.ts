import type { AgentResult } from "@aios-celx/shared";
import type { AgentExecutionContext } from "../context.js";

/**
 * Engineer runs per task via `aios run:task`, not `aios run --agent`.
 * Registered so `listAgents` / registry stay aligned with the MVP catalog.
 */
export async function runEngineerRouteHint(ctx: AgentExecutionContext): Promise<AgentResult> {
  return {
    agentId: "engineer",
    success: false,
    message: `Engineer executes one backlog task at a time. Use: aios run:task --project ${ctx.projectId} --task <TASK-ID>`,
    artifactsWritten: [],
    errors: ["use-run-task"],
  };
}

/** QA runs per task via `aios run:qa`, not `aios run --agent`. */
export async function runQaRouteHint(ctx: AgentExecutionContext): Promise<AgentResult> {
  return {
    agentId: "qa-reviewer",
    success: false,
    message: `QA reviews one task at a time. Use: aios run:qa --project ${ctx.projectId} --task <TASK-ID>`,
    artifactsWritten: [],
    errors: ["use-run-qa"],
  };
}
