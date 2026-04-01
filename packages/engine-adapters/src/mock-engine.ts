import type { AgentResult, EngineRunInput, EngineRunResult } from "@aios-celx/shared";
import type { BaseEngine } from "./base-engine.js";

/**
 * Factory: inject the actual agent execution (implemented in `@aios-celx/agent-runtime`)
 * so this package stays free of circular imports.
 */
export function createMockEngine(
  runAgent: (input: EngineRunInput) => Promise<AgentResult>,
): BaseEngine {
  const id = "mock-engine";
  return {
    id,
    async run(input: EngineRunInput): Promise<EngineRunResult> {
      const agentResult = await runAgent(input);
      return {
        engineId: id,
        ok: agentResult.success,
        agentResult,
        message: agentResult.message,
        metadata: { kind: "mock" },
      };
    },
    async isAvailable(): Promise<boolean> {
      return true;
    },
  };
}
