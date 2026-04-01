import type { EngineRunInput, EngineRunResult } from "@aios-celx/shared";
import type { BaseEngine } from "./base-engine.js";

/** Placeholder — no real Claude API/SDK (Bloco 3). */
export class ClaudeCodeEnginePlaceholder implements BaseEngine {
  readonly id = "claude-code";

  async run(_input: EngineRunInput): Promise<EngineRunResult> {
    return {
      engineId: this.id,
      ok: false,
      message:
        "Claude Code engine is not integrated yet. Keep `engines.*` on `mock-engine` or implement this adapter.",
      errorCode: "not-implemented",
    };
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}
