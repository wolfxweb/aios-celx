import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "technical-writer",
  description:
    "v2 — Manter documentação viva: sumário de decisões, changelog sugerido, alinhamento README/decision-log.",
  reads: [
    "docs/discovery.md",
    "docs/prd.md",
    "docs/architecture.md",
    "docs/decision-log.md",
    "README.md",
  ],
  writes: ["docs/living-documentation.md"],
};
