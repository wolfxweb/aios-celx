import type { EngineRunInput, EngineRunResult } from "@aios-celx/shared";
import type { BaseEngine } from "./base-engine.js";

/** Placeholder — no real Codex integration (Bloco 3). */
export class CodexEnginePlaceholder implements BaseEngine {
  readonly id = "codex";

  async run(_input: EngineRunInput): Promise<EngineRunResult> {
    return {
      engineId: this.id,
      ok: false,
      message:
        "Codex engine is not integrated yet. Keep `engines.*` on `mock-engine` or implement this adapter.",
      errorCode: "not-implemented",
    };
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}
