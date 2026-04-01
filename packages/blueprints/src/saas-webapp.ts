import type { BlueprintDefinition } from "@aios-celx/shared";

export const saasWebappBlueprint: BlueprintDefinition = {
  id: "saas-webapp",
  name: "SaaS web application",
  description: "Blueprint for a typical SaaS web app: docs, backlog, QA reports, src, tests.",
  directories: [
    ".aios",
    ".aios/logs",
    "docs",
    "docs/execution",
    "backlog",
    "qa",
    "qa/reports",
    "src",
    "tests",
  ],
  files: {
    "docs/vision.md": "vision",
    "docs/discovery.md": "discovery",
    "docs/prd.md": "prd",
    "docs/architecture.md": "architecture",
    "docs/api-contracts.md": "api-contracts",
    "docs/decision-log.md": "decision-log",
    "backlog/epics.yaml": "epics",
    "backlog/stories.yaml": "stories",
    "backlog/tasks.yaml": "tasks",
  },
  initialState: {
    stage: "discovery",
    currentAgent: "requirements-analyst",
    currentTaskId: null,
    activeStoryId: null,
    lastExecutionType: null,
    blocked: false,
    requiresHumanApproval: false,
    completedGates: [],
    nextGate: "discovery_complete",
  },
  initialConfig: {
    name: "SaaS webapp",
  },
};
