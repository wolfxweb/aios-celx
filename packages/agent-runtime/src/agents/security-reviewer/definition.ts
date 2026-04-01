import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "security-reviewer",
  description: "v2 — Checklist de riscos: auth, segredos, exposição de dados, superfície de API (mock).",
  reads: ["docs/architecture.md", "docs/api-contracts.md", "docs/prd.md"],
  writes: ["docs/security-review.md"],
};
