import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "release-manager",
  description: "v3 — Readiness de release: critérios, notas e estado do backlog (mock).",
  reads: ["backlog/tasks.yaml", "docs/prd.md", "docs/delivery-status.md"],
  writes: ["docs/release-readiness.md"],
};
