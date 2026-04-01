import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "observability-agent",
  description: "v3 — Brief de logs, correlação, falhas e rastreabilidade operacional (mock).",
  reads: ["docs/architecture.md", "docs/delivery-status.md"],
  writes: ["docs/observability-brief.md"],
};
