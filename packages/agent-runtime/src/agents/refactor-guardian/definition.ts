import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "refactor-guardian",
  description:
    "v2 — Sinalizar dívida técnica, acoplamento e desvio de padrões (relatório orientador, mock).",
  reads: ["docs/architecture.md", "docs/api-contracts.md", "backlog/tasks.yaml"],
  writes: ["docs/technical-health-report.md"],
};
