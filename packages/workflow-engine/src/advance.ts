import type { ProjectState, WorkflowDefinition } from "@aios-celx/shared";
import { getActiveStep } from "./steps.js";

function nowIso(): string {
  return new Date().toISOString();
}

/** Align `stage` / `currentAgent` / `nextGate` with the active workflow step. */
export function syncStateToActiveStep(
  workflow: WorkflowDefinition,
  state: ProjectState,
): ProjectState {
  const active = getActiveStep(workflow, state);
  if (!active) {
    return {
      ...state,
      stage: "delivery",
      currentAgent: "delivery-manager",
      nextGate: "",
      updatedAt: nowIso(),
    };
  }

  if (
    state.stage === active.stage &&
    state.currentAgent === active.agent &&
    state.nextGate === active.gate
  ) {
    return state;
  }

  return {
    ...state,
    stage: active.stage,
    currentAgent: active.agent,
    nextGate: active.gate,
    updatedAt: nowIso(),
  };
}

/**
 * Record a gate as approved and move focus to the next step.
 * Caller must ensure the gate evaluation passed and authorization is intentional.
 */
export function advanceAfterGateApproval(
  workflow: WorkflowDefinition,
  state: ProjectState,
  approvedGateId: string,
): ProjectState {
  const idx = workflow.steps.findIndex((s) => s.gate === approvedGateId);
  if (idx === -1) {
    throw new Error(`Unknown gate '${approvedGateId}' in workflow '${workflow.id}'`);
  }

  const completedGates = state.completedGates.includes(approvedGateId)
    ? state.completedGates
    : [...state.completedGates, approvedGateId];

  const nextStep = workflow.steps[idx + 1];
  if (!nextStep) {
    return {
      ...state,
      completedGates,
      stage: "delivery",
      currentAgent: "delivery-manager",
      nextGate: "",
      requiresHumanApproval: false,
      updatedAt: nowIso(),
    };
  }

  return {
    ...state,
    completedGates,
    stage: nextStep.stage,
    currentAgent: nextStep.agent,
    nextGate: nextStep.gate,
    requiresHumanApproval: false,
    updatedAt: nowIso(),
  };
}
