import type { AgentDefinition } from "@aios-celx/shared";

/** Execução real: `engineer-task-runner.ts` — aqui só o contrato + prompts para engines futuras. */
export const agentDefinition: AgentDefinition = {
  id: "engineer",
  description:
    "MVP — Executes technical work per task; use `aios run:task` (not `run --agent`). Outputs implementation report + task status.",
  reads: [
    "backlog/tasks.yaml",
    "backlog/stories.yaml",
    "docs/architecture.md",
    "docs/api-contracts.md",
  ],
  writes: ["docs/execution/*-implementation.md", "backlog/tasks.yaml"],
};
