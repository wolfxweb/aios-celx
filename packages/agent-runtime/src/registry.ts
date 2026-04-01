import type { AgentDefinition } from "@aios-celx/shared";
import { runDeliveryManager } from "./agents/delivery-manager.js";
import { runProductManager } from "./agents/product-manager.js";
import { runRequirementsAnalyst } from "./agents/requirements-analyst.js";
import { runSoftwareArchitect } from "./agents/software-architect.js";
import type { AgentHandler } from "./types-agent.js";

const definitions: Record<string, AgentDefinition> = {
  "requirements-analyst": {
    id: "requirements-analyst",
    description: "Produces structured discovery from vision.",
    reads: ["docs/vision.md"],
    writes: ["docs/discovery.md"],
  },
  "product-manager": {
    id: "product-manager",
    description: "Produces PRD and backlog YAML from discovery.",
    reads: ["docs/discovery.md"],
    writes: ["docs/prd.md", "backlog/epics.yaml", "backlog/stories.yaml", "backlog/tasks.yaml"],
  },
  "software-architect": {
    id: "software-architect",
    description: "Produces architecture and API contracts.",
    reads: ["docs/discovery.md", "docs/prd.md", "backlog/stories.yaml"],
    writes: ["docs/architecture.md", "docs/api-contracts.md"],
  },
  "delivery-manager": {
    id: "delivery-manager",
    description: "Operational delivery status (engines, gates, blockers).",
    reads: [],
    writes: ["docs/delivery-status.md", "docs/delivery-summary.md"],
  },
  "qa-reviewer": {
    id: "qa-reviewer",
    description: "Validates task implementation; writes QA reports (use `aios run:qa`).",
    reads: [
      "backlog/tasks.yaml",
      "backlog/stories.yaml",
      "docs/architecture.md",
      "docs/api-contracts.md",
      "docs/execution/*-implementation.md",
    ],
    writes: ["qa/reports/*-qa-report.md", "qa/reports/*-qa-report.json", "backlog/tasks.yaml"],
  },
};

const handlers: Record<string, AgentHandler> = {
  "requirements-analyst": runRequirementsAnalyst,
  "product-manager": runProductManager,
  "software-architect": runSoftwareArchitect,
  "delivery-manager": runDeliveryManager,
};

export function listAgents(): AgentDefinition[] {
  return Object.values(definitions);
}

export function getAgentDefinition(agentId: string): AgentDefinition | undefined {
  return definitions[agentId];
}

export function getAgentHandler(agentId: string): AgentHandler | undefined {
  return handlers[agentId];
}
