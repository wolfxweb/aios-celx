import type { EngineRunInput, EngineRunResult } from "@aios-celx/shared";
import type { BaseEngine } from "./base-engine.js";
import { buildGenericAgentPrompt, coerceEngineResult, commandExists, runCliProcess } from "./cli-runtime.js";

export class CodexCliEngine implements BaseEngine {
  readonly id = "codex";

  async run(input: EngineRunInput): Promise<EngineRunResult> {
    const prompt = buildGenericAgentPrompt(input);
    const result = await runCliProcess(
      process.env.AIOS_CODEX_BIN?.trim() || "codex",
      ["-a", "never", "-s", "workspace-write", "exec", prompt],
      {
        cwd: input.projectRoot,
        timeoutMs: 1000 * 60 * 30,
      },
    );
    return coerceEngineResult(this.id, input.agentId, result);
  }

  async isAvailable(): Promise<boolean> {
    return commandExists(process.env.AIOS_CODEX_BIN?.trim() || "codex");
  }
}
