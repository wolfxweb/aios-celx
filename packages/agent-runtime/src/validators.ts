import type { AgentResult } from "@aios-celx/shared";

/** Minimal structural validation for mock agents. */
export function validateAgentResult(result: AgentResult): AgentResult {
  if (!result.agentId) {
    return {
      ...result,
      success: false,
      errors: [...(result.errors ?? []), "agentId is required"],
    };
  }
  if (result.success && result.artifactsWritten.length === 0) {
    return {
      ...result,
      success: false,
      message: result.message || "No artifacts reported",
      errors: [...(result.errors ?? []), "artifactsWritten must not be empty on success"],
    };
  }
  return result;
}
