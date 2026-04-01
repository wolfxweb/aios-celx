import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "integration-specialist",
  description:
    "v2 — Mapa de integrações externas (Stripe, WhatsApp, n8n, Supabase, etc.), riscos e contratos.",
  reads: ["docs/discovery.md", "docs/prd.md", "docs/api-contracts.md"],
  writes: ["docs/integration-landscape.md"],
};
