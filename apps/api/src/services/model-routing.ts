import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type ModelRoutingConfig = {
  version: number;
  updatedAt: string;
  providers: Record<
    string,
    {
      type: "cli" | "api";
      enabled: boolean;
      command?: string;
      baseUrl?: string;
      defaultModel?: string;
    }
  >;
  defaults: {
    global: { provider: string; model: string };
    project: { provider: string; model: string };
  };
};

function nowIso(): string {
  return new Date().toISOString();
}

function configPath(monorepoRoot: string): string {
  return join(monorepoRoot, ".aios", "model-routing.json");
}

function defaultConfig(): ModelRoutingConfig {
  return {
    version: 1,
    updatedAt: nowIso(),
    providers: {
      "codex-cli": {
        type: "cli",
        enabled: true,
        command: "codex",
        defaultModel: "codex",
      },
      "gemini-cli": {
        type: "cli",
        enabled: true,
        command: "gemini",
        defaultModel: "gemini-2.5-pro",
      },
      "claude-code-cli": {
        type: "cli",
        enabled: true,
        command: "claude",
        defaultModel: "sonnet",
      },
      openrouter: {
        type: "api",
        enabled: true,
        baseUrl: "https://openrouter.ai/api/v1",
        defaultModel: "anthropic/claude-sonnet-4",
      },
    },
    defaults: {
      global: { provider: "claude-code-cli", model: "sonnet" },
      project: { provider: "codex-cli", model: "codex" },
    },
  };
}

export async function loadModelRoutingConfig(monorepoRoot: string): Promise<ModelRoutingConfig> {
  try {
    const raw = await readFile(configPath(monorepoRoot), "utf8");
    const parsed = JSON.parse(raw) as ModelRoutingConfig;
    return parsed;
  } catch {
    return defaultConfig();
  }
}

export async function ensureModelRoutingConfig(monorepoRoot: string): Promise<ModelRoutingConfig> {
  const path = configPath(monorepoRoot);
  const existing = await loadModelRoutingConfig(monorepoRoot);
  try {
    await readFile(path, "utf8");
    return existing;
  } catch {
    await mkdir(join(monorepoRoot, ".aios"), { recursive: true });
    await writeFile(path, JSON.stringify(existing, null, 2));
    return existing;
  }
}

