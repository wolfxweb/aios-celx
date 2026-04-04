import type { EngineRunInput, EngineRunResult } from "@aios-celx/shared";
import type { BaseEngine } from "./base-engine.js";
import { buildGenericAgentPrompt, coerceEngineResult, commandExists, runCliProcess } from "./cli-runtime.js";

export class ClaudeCodeEngine implements BaseEngine {
  readonly id = "claude-code";

  async run(input: EngineRunInput): Promise<EngineRunResult> {
    const prompt = buildGenericAgentPrompt(input);
    const args = [
      "-p",
      prompt,
      "--dangerously-skip-permissions",
      "--add-dir",
      input.projectRoot,
      "--output-format",
      "text",
      "--max-turns",
      process.env.AIOS_CLAUDE_MAX_TURNS?.trim() || "12",
    ];
    const model = process.env.AIOS_CLAUDE_MODEL?.trim();
    if (model) {
      args.push("--model", model);
    }
    const result = await runCliProcess(process.env.AIOS_CLAUDE_BIN?.trim() || "claude", args, {
      cwd: input.projectRoot,
      timeoutMs: 1000 * 60 * 30,
    });
    return coerceEngineResult(this.id, input.agentId, result);
  }

  async isAvailable(): Promise<boolean> {
    return commandExists(process.env.AIOS_CLAUDE_BIN?.trim() || "claude");
  }
}
