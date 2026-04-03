import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "ux-reviewer",
  description: "v2 — Jornada, clareza, fricção e consistência de experiência (relatório qualitativo mock).",
  reads: ["docs/prd.md", "docs/discovery.md", "backlog/stories.yaml"],
  writes: ["docs/ux-review.md"],
};

export const agentRole = "UX Reviewer";
export const agentMission =
  "Avaliar jornada, clareza, fricção e consistência de experiência com base em PRD, discovery e stories; produzir docs/ux-review.md (sem UI real no mock).";
