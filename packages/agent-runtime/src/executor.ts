import {
  describeExecutionConfig,
  getEngine,
  resolveEngineId,
} from "@aios-celx/engine-adapters";
import { memorySlicesToPlain } from "@aios-celx/memory-system";
import type {
  AgentResult,
  EngineRunInput,
  ProjectConfig,
  ProjectState,
  WorkflowDefinition,
} from "@aios-celx/shared";
import { normalizeProjectConfig } from "@aios-celx/shared";
import { buildAgentContext } from "./context.js";
import "./register-engines.js"; // side-effect: register engines
import { appendEventLogLine, appendExecutionLogLine } from "./project-logs.js";
import { getAgentDefinition } from "./registry.js";
import { validateAgentResult } from "./validators.js";

/** Bloco 2 compatibility: same as routed execution with normalized config (mock-engine). */
export async function executeAgent(
  agentId: string,
  projectRoot: string,
  projectId: string,
  state: ProjectState,
  workflow: WorkflowDefinition,
  config?: ProjectConfig,
): Promise<AgentResult> {
  const fallbackConfig: ProjectConfig = {
    projectId,
    blueprint: "saas-webapp",
    createdAt: new Date().toISOString(),
    engines: { default: "mock-engine" },
  };
  return executeAgentWithEngine(
    agentId,
    projectRoot,
    projectId,
    state,
    workflow,
    config ?? fallbackConfig,
  );
}

/** Resolves engine from project config, runs it, writes JSONL logs. */
export async function executeAgentWithEngine(
  agentId: string,
  projectRoot: string,
  projectId: string,
  state: ProjectState,
  workflow: WorkflowDefinition,
  config: ProjectConfig,
): Promise<AgentResult> {
  const cfg = normalizeProjectConfig(config);
  const engineId = resolveEngineId(cfg, agentId);
  const engine = getEngine(engineId);

  const def = getAgentDefinition(agentId);
  if (!def) {
    return {
      agentId,
      success: false,
      message: `Unknown agent: ${agentId}`,
      artifactsWritten: [],
      errors: ["not-registered"],
    };
  }

  if (!engine) {
    await appendEventLogLine(projectRoot, {
      type: "engine.missing",
      agentId,
      engineId,
      projectId,
    });
    return {
      agentId,
      success: false,
      message: `Unknown engine: ${engineId}`,
      artifactsWritten: [],
      errors: ["unknown-engine"],
    };
  }

  const available = await engine.isAvailable();
  if (!available) {
    await appendEventLogLine(projectRoot, {
      type: "engine.unavailable",
      agentId,
      engineId,
      projectId,
    });
    return {
      agentId,
      success: false,
      message: `Engine ${engineId} is not available (stub or offline).`,
      artifactsWritten: [],
      errors: ["unavailable"],
    };
  }

  const ctx = await buildAgentContext(projectRoot, projectId, agentId, state, workflow, def.reads);

  const input: EngineRunInput = {
    agentId,
    projectId,
    projectRoot,
    state,
    workflow,
    contextFiles: ctx.files,
    memorySlices: memorySlicesToPlain({ global: ctx.memory.global, project: ctx.memory.project }),
  };

  await appendEventLogLine(projectRoot, {
    type: "engine.run.start",
    agentId,
    engineId,
    projectId,
  });

  const started = Date.now();
  const engineResult = await engine.run(input);
  const ms = Date.now() - started;

  await appendExecutionLogLine(projectRoot, {
    type: "engine.run.finish",
    agentId,
    engineId,
    projectId,
    ok: engineResult.ok,
    ms,
    message: engineResult.message,
  });

  await appendEventLogLine(projectRoot, {
    type: "engine.run.finish",
    agentId,
    engineId,
    projectId,
    ok: engineResult.ok,
  });

  if (!engineResult.ok || !engineResult.agentResult) {
    return {
      agentId,
      success: false,
      message: engineResult.message,
      artifactsWritten: [],
      errors: [engineResult.errorCode ?? "engine-failed"],
    };
  }

  return validateAgentResult(engineResult.agentResult);
}

export function resolveExecutionConfig(config: ProjectConfig, agentId: string) {
  return describeExecutionConfig(config, agentId);
}
