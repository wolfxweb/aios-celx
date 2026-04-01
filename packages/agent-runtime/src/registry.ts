import type { AgentDefinition } from "@aios-celx/shared";
import { runEngineerRouteHint, runQaRouteHint } from "./agents/cli-route-hints.js";
import { agentDefinition as costOptimizerDef } from "./agents/cost-optimizer/definition.js";
import { runCostOptimizer } from "./agents/cost-optimizer/run.js";
import { agentDefinition as dbDesignerDef } from "./agents/db-designer/definition.js";
import { runDbDesigner } from "./agents/db-designer/run.js";
import { agentDefinition as deliveryManagerDef } from "./agents/delivery-manager/definition.js";
import { runDeliveryManager } from "./agents/delivery-manager/run.js";
import { agentDefinition as engineerDef } from "./agents/engineer/definition.js";
import { agentDefinition as integrationSpecialistDef } from "./agents/integration-specialist/definition.js";
import { runIntegrationSpecialist } from "./agents/integration-specialist/run.js";
import { agentDefinition as observabilityAgentDef } from "./agents/observability-agent/definition.js";
import { runObservabilityAgent } from "./agents/observability-agent/run.js";
import { agentDefinition as portfolioStrategistDef } from "./agents/portfolio-strategist/definition.js";
import { runPortfolioStrategist } from "./agents/portfolio-strategist/run.js";
import { agentDefinition as productManagerDef } from "./agents/product-manager/definition.js";
import { runProductManager } from "./agents/product-manager/run.js";
import { agentDefinition as qaReviewerDef } from "./agents/qa-reviewer/definition.js";
import { agentDefinition as refactorGuardianDef } from "./agents/refactor-guardian/definition.js";
import { runRefactorGuardian } from "./agents/refactor-guardian/run.js";
import { agentDefinition as releaseManagerDef } from "./agents/release-manager/definition.js";
import { runReleaseManager } from "./agents/release-manager/run.js";
import { agentDefinition as requirementsAnalystDef } from "./agents/requirements-analyst/definition.js";
import { runRequirementsAnalyst } from "./agents/requirements-analyst/run.js";
import { agentDefinition as securityReviewerDef } from "./agents/security-reviewer/definition.js";
import { runSecurityReviewer } from "./agents/security-reviewer/run.js";
import { agentDefinition as softwareArchitectDef } from "./agents/software-architect/definition.js";
import { runSoftwareArchitect } from "./agents/software-architect/run.js";
import { agentDefinition as sprintPlannerDef } from "./agents/sprint-planner/definition.js";
import { runSprintPlanner } from "./agents/sprint-planner/run.js";
import { agentDefinition as technicalWriterDef } from "./agents/technical-writer/definition.js";
import { runTechnicalWriter } from "./agents/technical-writer/run.js";
import { agentDefinition as uxReviewerDef } from "./agents/ux-reviewer/definition.js";
import { runUxReviewer } from "./agents/ux-reviewer/run.js";
import type { AgentHandler } from "./types-agent.js";

/** Agents that may run via `aios run --agent` without matching `state.currentAgent` (advisory / cross-cutting). */
const ADVISORY_AGENT_IDS = new Set<string>([
  "delivery-manager",
  "technical-writer",
  "refactor-guardian",
  "integration-specialist",
  "db-designer",
  "security-reviewer",
  "ux-reviewer",
  "sprint-planner",
  "cost-optimizer",
  "observability-agent",
  "release-manager",
  "portfolio-strategist",
]);

export function canRunWithoutCurrentAgentMatch(agentId: string): boolean {
  return ADVISORY_AGENT_IDS.has(agentId);
}

const definitions: Record<string, AgentDefinition> = {
  "requirements-analyst": requirementsAnalystDef,
  "product-manager": productManagerDef,
  "software-architect": softwareArchitectDef,
  "delivery-manager": deliveryManagerDef,
  engineer: engineerDef,
  "qa-reviewer": qaReviewerDef,
  "technical-writer": technicalWriterDef,
  "refactor-guardian": refactorGuardianDef,
  "integration-specialist": integrationSpecialistDef,
  "db-designer": dbDesignerDef,
  "security-reviewer": securityReviewerDef,
  "ux-reviewer": uxReviewerDef,
  "sprint-planner": sprintPlannerDef,
  "cost-optimizer": costOptimizerDef,
  "observability-agent": observabilityAgentDef,
  "release-manager": releaseManagerDef,
  "portfolio-strategist": portfolioStrategistDef,
};

const handlers: Record<string, AgentHandler> = {
  "requirements-analyst": runRequirementsAnalyst,
  "product-manager": runProductManager,
  "software-architect": runSoftwareArchitect,
  "delivery-manager": runDeliveryManager,
  engineer: runEngineerRouteHint,
  "qa-reviewer": runQaRouteHint,
  "technical-writer": runTechnicalWriter,
  "refactor-guardian": runRefactorGuardian,
  "integration-specialist": runIntegrationSpecialist,
  "db-designer": runDbDesigner,
  "security-reviewer": runSecurityReviewer,
  "ux-reviewer": runUxReviewer,
  "sprint-planner": runSprintPlanner,
  "cost-optimizer": runCostOptimizer,
  "observability-agent": runObservabilityAgent,
  "release-manager": runReleaseManager,
  "portfolio-strategist": runPortfolioStrategist,
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
