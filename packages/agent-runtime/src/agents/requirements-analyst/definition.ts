import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "requirements-analyst",
  description:
    "MVP — Transform raw intent into structured discovery; reduce ambiguity before PRD. Reads vision (+ memory via context). Outputs discovery.",
  reads: ["docs/vision.md"],
  writes: ["docs/discovery.md"],
};

export const agentRole = "Requirements Analyst";
export const agentMission =
  "Transformar ideia bruta em descoberta estruturada e reduzir ambiguidade antes do PRD.";
