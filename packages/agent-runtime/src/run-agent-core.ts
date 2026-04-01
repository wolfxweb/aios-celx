import type { MemoryEntry } from "@aios-celx/memory-system";
import type { AgentResult, EngineRunInput } from "@aios-celx/shared";
import type { AgentExecutionContext } from "./context.js";
import { getAgentDefinition, getAgentHandler } from "./registry.js";

function coerceMemory(
  slices: EngineRunInput["memorySlices"],
): { global: MemoryEntry[]; project: MemoryEntry[] } {
  if (!slices) {
    return { global: [], project: [] };
  }
  return {
    global: slices.global as MemoryEntry[],
    project: slices.project as MemoryEntry[],
  };
}

export async function runAgentCore(input: EngineRunInput): Promise<AgentResult> {
  const def = getAgentDefinition(input.agentId);
  const handler = getAgentHandler(input.agentId);
  if (!def || !handler) {
    return {
      agentId: input.agentId,
      success: false,
      message: `Unknown agent: ${input.agentId}`,
      artifactsWritten: [],
      errors: ["not-registered"],
    };
  }

  const memory = coerceMemory(input.memorySlices);

  const ctx: AgentExecutionContext = {
    projectRoot: input.projectRoot,
    projectId: input.projectId,
    agentId: input.agentId,
    state: input.state,
    workflow: input.workflow,
    files: input.contextFiles,
    memory,
  };

  return handler(ctx);
}
