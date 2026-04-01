import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "sprint-planner",
  description: "v3 — Agrupar tasks por onda/sprint, dependências e ordem sugerida (mock).",
  reads: ["backlog/tasks.yaml", "backlog/stories.yaml", "docs/prd.md"],
  writes: ["docs/sprint-plan.md"],
};
