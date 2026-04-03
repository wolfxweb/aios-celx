import type { ProjectState, WorkflowDefinition } from "@aios-celx/shared";
import { advanceAfterGateApproval } from "./advance.js";
import { evaluateGate, type GateEvaluationContext } from "./gates.js";
import { getActiveStep } from "./steps.js";

const DEFAULT_MAX_STEPS = 32;

/**
 * When `gateApproval` is `auto`, repeatedly approves gates whose checks already pass
 * (same rules as `aios approve`), advancing workflow state without a separate approve command.
 * No-op when `manual`.
 */
export async function autoAdvanceWhileGatesPass(
  projectRoot: string,
  workflow: WorkflowDefinition,
  state: ProjectState,
  gateApproval: "auto" | "manual",
  context?: GateEvaluationContext,
  maxSteps: number = DEFAULT_MAX_STEPS,
): Promise<{ state: ProjectState; advancedGates: string[] }> {
  if (gateApproval === "manual") {
    return { state, advancedGates: [] };
  }

  let s = state;
  const advancedGates: string[] = [];
  const evalCtx: GateEvaluationContext = {
    taskId: context?.taskId ?? state.currentTaskId ?? undefined,
  };

  for (let i = 0; i < maxSteps; i++) {
    const active = getActiveStep(workflow, s);
    if (!active) {
      break;
    }
    const gateResult = await evaluateGate(projectRoot, active.gate, evalCtx);
    if (!gateResult.passed) {
      break;
    }
    s = advanceAfterGateApproval(workflow, s, active.gate);
    advancedGates.push(active.gate);
  }

  return { state: s, advancedGates };
}
