import type { EngineRunInput, EngineRunResult } from "@aios-celx/shared";
import type { BaseEngine } from "./base-engine.js";

/** Placeholder — no Cursor Cloud Agents API (Bloco 3). */
export class CursorEnginePlaceholder implements BaseEngine {
  readonly id = "cursor";

  async run(_input: EngineRunInput): Promise<EngineRunResult> {
    return {
      engineId: this.id,
      ok: false,
      message:
        "Cursor engine is not integrated yet. Keep `engines.*` on `mock-engine` or implement this adapter.",
      errorCode: "not-implemented",
    };
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}
