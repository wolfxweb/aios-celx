import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "db-designer",
  description: "v2 — Notas de modelo de dados, entidades e impacto de schema (mock, sem migrações reais).",
  reads: ["docs/prd.md", "docs/architecture.md", "backlog/stories.yaml"],
  writes: ["docs/data-model-notes.md"],
};

export const agentRole = "DB Designer";
export const agentMission =
  "Produzir notas de modelo de dados (entidades, relações, índices, impacto de schema) alinhadas ao PRD e à arquitectura, sem migrações reais no mock.";
