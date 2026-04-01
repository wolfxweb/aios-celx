import type { ProjectState, WorkflowDefinition, WorkflowStep } from "@aios-celx/shared";

/** First step whose gate is not in `completedGates` (current workflow focus). */
export function getActiveStep(workflow: WorkflowDefinition, state: ProjectState): WorkflowStep | null {
  for (const step of workflow.steps) {
    if (!state.completedGates.includes(step.gate)) {
      return step;
    }
  }
  return null;
}

/** Step matching `state.stage`, if any. */
export function getCurrentStep(
  workflow: WorkflowDefinition,
  state: ProjectState,
): WorkflowStep | null {
  return workflow.steps.find((s) => s.stage === state.stage) ?? null;
}

/** Step immediately after the active step, if any. */
export function getNextStep(workflow: WorkflowDefinition, state: ProjectState): WorkflowStep | null {
  const active = getActiveStep(workflow, state);
  if (!active) {
    return null;
  }
  const idx = workflow.steps.findIndex((s) => s.id === active.id);
  return workflow.steps[idx + 1] ?? null;
}
