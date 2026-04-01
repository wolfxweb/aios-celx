import type { AgentDefinition } from "@aios-celx/shared";

/** Execução real: `qa-task-runner.ts` — aqui só o contrato + prompts para engines futuras. */
export const agentDefinition: AgentDefinition = {
  id: "qa-reviewer",
  description:
    "MVP — Validates task delivery vs acceptance and architecture; use `aios run:qa` (not `run --agent`). Outputs QA reports + task QA fields.",
  reads: [
    "backlog/tasks.yaml",
    "backlog/stories.yaml",
    "docs/architecture.md",
    "docs/api-contracts.md",
    "docs/execution/*-implementation.md",
  ],
  writes: ["qa/reports/*-qa-report.md", "qa/reports/*-qa-report.json", "backlog/tasks.yaml"],
};
