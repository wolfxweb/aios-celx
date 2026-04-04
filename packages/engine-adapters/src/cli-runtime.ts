import type { AgentResult, EngineRunInput, EngineRunResult } from "@aios-celx/shared";
import { spawn } from "node:child_process";

export type CliExecutionResult = {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  combined: string;
  timedOut: boolean;
};

export type CliTaskRunResult = {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
  combined: string;
  engineId: string;
};

type SpawnSpec = {
  command: string;
  args: string[];
};

function tailText(value: string, maxChars = 4000): string {
  if (value.length <= maxChars) {
    return value.trim();
  }
  return value.slice(value.length - maxChars).trim();
}

function quoteContextBlock(name: string, body: string): string {
  return `## ${name}\n\n\`\`\`\n${body}\n\`\`\`\n`;
}

function buildAiosJsonFooter(agentId: string): string {
  return [
    "",
    "At the end of your work, print exactly one final line in this format:",
    `AIOS_RESULT_JSON:{\"agentId\":\"${agentId}\",\"success\":true,\"message\":\"...\",\"artifactsWritten\":[\"relative/path\"],\"errors\":[]}`,
    "Only the final line should use that prefix.",
  ].join("\n");
}

export function buildGenericAgentPrompt(input: EngineRunInput): string {
  const contextEntries = Object.entries(input.contextFiles).slice(0, 12);
  const contextText =
    contextEntries.length === 0
      ? "No explicit context files were provided."
      : contextEntries
          .map(([path, content]) => quoteContextBlock(path, content.slice(0, 5000)))
          .join("\n");
  const workflowSteps = input.workflow.steps.map((step) => `${step.stage}:${step.agent}`).join(" | ");

  return [
    `You are the AIOS agent "${input.agentId}" working inside the local project at "${input.projectRoot}".`,
    "You may read, edit, and run commands inside this project directory when the CLI allows it.",
    "",
    "## Mission",
    `Project: ${input.projectId}`,
    `Current stage: ${input.state.stage}`,
    `Current task: ${input.state.currentTaskId ?? "none"}`,
    `Workflow: ${input.workflow.id}`,
    `Workflow steps: ${workflowSteps}`,
    "",
    "## Rules",
    "- Make real file edits when needed.",
    "- Keep changes scoped to this project.",
    "- Prefer concise, safe changes aligned with the provided context.",
    "- If you cannot proceed, explain why in the final JSON line.",
    "",
    "## Context",
    contextText,
    buildAiosJsonFooter(input.agentId),
  ].join("\n");
}

export function coerceEngineResult(
  engineId: string,
  agentId: string,
  cliResult: CliExecutionResult,
): EngineRunResult {
  const marker = "AIOS_RESULT_JSON:";
  const line = cliResult.combined
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part.startsWith(marker));
  if (line) {
    const raw = line.slice(marker.length);
    try {
      const parsed = JSON.parse(raw) as AgentResult;
      return {
        engineId,
        ok: cliResult.ok && parsed.success,
        agentResult: parsed,
        message: parsed.message,
        metadata: {
          exitCode: cliResult.exitCode,
          stdoutTail: tailText(cliResult.stdout, 1200),
          stderrTail: tailText(cliResult.stderr, 1200),
        },
      };
    } catch {
      // Fall through to synthesized result.
    }
  }

  const message = tailText(cliResult.combined || cliResult.stderr || cliResult.stdout || "No output captured.", 1800);
  return {
    engineId,
    ok: cliResult.ok,
    agentResult: {
      agentId,
      success: cliResult.ok,
      message,
      artifactsWritten: [],
      errors: cliResult.ok ? [] : ["cli-run-failed"],
    },
    message,
    errorCode: cliResult.ok ? undefined : "cli-run-failed",
    metadata: {
      exitCode: cliResult.exitCode,
      timedOut: cliResult.timedOut,
      stdoutTail: tailText(cliResult.stdout, 1200),
      stderrTail: tailText(cliResult.stderr, 1200),
    },
  };
}

export async function commandExists(command: string): Promise<boolean> {
  const result = await runCliProcess("bash", ["-lc", `command -v ${command}`], {
    cwd: process.cwd(),
    timeoutMs: 5000,
  });
  return result.ok;
}

export async function runCliProcess(
  command: string,
  args: string[],
  options: {
    cwd: string;
    env?: Record<string, string | undefined>;
    timeoutMs?: number;
  },
): Promise<CliExecutionResult> {
  const timeoutMs = options.timeoutMs ?? 1000 * 60 * 20;

  return new Promise<CliExecutionResult>((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;
    let timedOut = false;

    const finalize = (exitCode: number | null) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
      resolve({
        ok: exitCode === 0 && !timedOut,
        exitCode,
        stdout,
        stderr,
        combined,
        timedOut,
      });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2000).unref();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      stderr += error.message;
      finalize(-1);
    });
    child.on("close", (code) => {
      finalize(code);
    });
  });
}

function resolveCodexCommandSpec(prompt: string): SpawnSpec {
  const command = process.env.AIOS_CODEX_BIN?.trim() || "codex";
  const args = ["-a", "never", "-s", "workspace-write", "exec", prompt];
  return { command, args };
}

function resolveClaudeCommandSpec(prompt: string, cwd: string): SpawnSpec {
  const command = process.env.AIOS_CLAUDE_BIN?.trim() || "claude";
  const args = [
    "-p",
    prompt,
    "--dangerously-skip-permissions",
    "--add-dir",
    cwd,
    "--output-format",
    "text",
    "--max-turns",
    process.env.AIOS_CLAUDE_MAX_TURNS?.trim() || "12",
  ];
  const model = process.env.AIOS_CLAUDE_MODEL?.trim();
  if (model) {
    args.push("--model", model);
  }
  return { command, args };
}

export async function runCodexPrompt(prompt: string, cwd: string): Promise<CliTaskRunResult> {
  const spec = resolveCodexCommandSpec(prompt);
  const result = await runCliProcess(spec.command, spec.args, {
    cwd,
    timeoutMs: 1000 * 60 * 30,
  });
  return {
    ok: result.ok,
    message: tailText(result.combined || "Codex CLI finished without output.", 1800),
    stdout: result.stdout,
    stderr: result.stderr,
    combined: result.combined,
    engineId: "codex",
  };
}

export async function runClaudeCodePrompt(prompt: string, cwd: string): Promise<CliTaskRunResult> {
  const spec = resolveClaudeCommandSpec(prompt, cwd);
  const result = await runCliProcess(spec.command, spec.args, {
    cwd,
    timeoutMs: 1000 * 60 * 30,
  });
  return {
    ok: result.ok,
    message: tailText(result.combined || "Claude Code finished without output.", 1800),
    stdout: result.stdout,
    stderr: result.stderr,
    combined: result.combined,
    engineId: "claude-code",
  };
}
