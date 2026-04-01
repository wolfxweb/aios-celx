import type { NextAction, ProjectState, WorkflowDefinition } from "@aios-celx/shared";
import { evaluateGate } from "./gates.js";
import { getActiveStep } from "./steps.js";

export async function resolveNextAction(
  projectRoot: string,
  workflow: WorkflowDefinition,
  state: ProjectState,
): Promise<NextAction> {
  const active = getActiveStep(workflow, state);
  if (!active) {
    return {
      type: "workflow-complete",
      message: "All gates are approved; use delivery-manager or start implementation work.",
    };
  }

  const gateResult = await evaluateGate(projectRoot, active.gate, {
    taskId: state.currentTaskId ?? undefined,
  });
  if (!gateResult.passed) {
    return {
      type: "run-agent",
      stage: active.stage,
      agentId: active.agent,
      gate: active.gate,
    };
  }

  return {
    type: "await-approval",
    stage: active.stage,
    agentId: active.agent,
    gate: active.gate,
  };
}
