import type { AgentDefinition } from "@aios-celx/shared";

export const agentDefinition: AgentDefinition = {
  id: "delivery-manager",
  description:
    "MVP — Operational coordination: state, workflow step, gates, queue, backlog health, blockers, recommended next commands.",
  reads: [
    ".aios/state.json",
    ".aios/queue.json",
    "backlog/tasks.yaml",
    "backlog/stories.yaml",
    "backlog/epics.yaml",
  ],
  writes: ["docs/delivery-status.md", "docs/delivery-summary.md"],
};

export const agentRole = "Delivery Manager";
export const agentMission =
  "Coordenar avanço operacional: estado, fila, bloqueios e próximos comandos.";
