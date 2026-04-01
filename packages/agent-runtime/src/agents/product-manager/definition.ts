import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "product-manager",
  description:
    "MVP — Turn discovery into an executable product backlog: PRD, epics, stories, tasks, acceptance criteria, initial roadmap.",
  reads: ["docs/discovery.md"],
  writes: ["docs/prd.md", "backlog/epics.yaml", "backlog/stories.yaml", "backlog/tasks.yaml"],
};

export const agentRole = "Product Manager";
export const agentMission = "Transformar discovery em backlog executável (PRD, épicos, stories, tasks).";
