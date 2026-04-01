import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "software-architect",
  description:
    "MVP — Technical structure for the managed product: architecture, modules, boundaries, integrations, API contracts, stack/patterns.",
  reads: ["docs/discovery.md", "docs/prd.md", "backlog/stories.yaml"],
  writes: ["docs/architecture.md", "docs/api-contracts.md"],
};

export const agentRole = "Software Architect";
export const agentMission =
  "Definir estrutura técnica, módulos, boundaries e contratos de API do produto gerido.";
