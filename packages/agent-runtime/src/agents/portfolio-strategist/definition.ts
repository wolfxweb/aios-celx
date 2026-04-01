import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "portfolio-strategist",
  description:
    "v3 — Visão entre projetos: priorização relativa e dependências (mock; dados portfolio reais vêm do monorepo).",
  reads: ["docs/prd.md", "docs/discovery.md", "docs/delivery-status.md"],
  writes: ["docs/portfolio-outlook.md"],
};
