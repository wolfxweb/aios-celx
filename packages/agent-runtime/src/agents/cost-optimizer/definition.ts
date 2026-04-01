import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "cost-optimizer",
  description:
    "v3 — Notas de política de custo LLM/infra: fallback económico, limites (mock — sem billing real).",
  reads: ["docs/delivery-status.md", "docs/prd.md"],
  writes: ["docs/cost-optimization.md"],
};
