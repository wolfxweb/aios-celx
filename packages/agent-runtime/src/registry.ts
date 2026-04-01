import type { AgentDefinition } from "@aios-celx/shared";
import { runEngineerRouteHint, runQaRouteHint } from "./agents/cli-route-hints.js";
import { runDeliveryManager } from "./agents/delivery-manager.js";
import { runProductManager } from "./agents/product-manager.js";
import { runRequirementsAnalyst } from "./agents/requirements-analyst.js";
import { runSoftwareArchitect } from "./agents/software-architect.js";
import type { AgentHandler } from "./types-agent.js";

const definitions: Record<string, AgentDefinition> = {
  "requirements-analyst": {
    id: "requirements-analyst",
    description:
      "MVP — Transform raw intent into structured discovery; reduce ambiguity before PRD. Reads vision (+ memory via context). Outputs discovery.",
    reads: ["docs/vision.md"],
    writes: ["docs/discovery.md"],
  },
  "product-manager": {
    id: "product-manager",
    description:
      "MVP — Turn discovery into an executable product backlog: PRD, epics, stories, tasks, acceptance criteria, initial roadmap.",
    reads: ["docs/discovery.md"],
    writes: ["docs/prd.md", "backlog/epics.yaml", "backlog/stories.yaml", "backlog/tasks.yaml"],
  },
  "software-architect": {
    id: "software-architect",
    description:
      "MVP — Technical structure for the managed product: architecture, modules, boundaries, integrations, API contracts, stack/patterns.",
    reads: ["docs/discovery.md", "docs/prd.md", "backlog/stories.yaml"],
    writes: ["docs/architecture.md", "docs/api-contracts.md"],
  },
  "delivery-manager": {
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
  },
  engineer: {
    id: "engineer",
    description:
      "MVP — Executes technical work per task; use `aios run:task` (not `run --agent`). Outputs implementation report + task status.",
    reads: [
      "backlog/tasks.yaml",
      "backlog/stories.yaml",
      "docs/architecture.md",
      "docs/api-contracts.md",
    ],
    writes: ["docs/execution/*-implementation.md", "backlog/tasks.yaml"],
  },
  "qa-reviewer": {
    id: "qa-reviewer",
    description:
      "MVP — Validates task delivery vs acceptance and architecture; use `aios run:qa` (not `run --agent`). Outputs QA reports + task QA fields.",
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
  engineer: runEngineerRouteHint,
  "qa-reviewer": runQaRouteHint,
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
