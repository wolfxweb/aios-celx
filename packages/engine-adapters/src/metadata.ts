import type { EngineAdapter } from "@aios-celx/shared";

export const ENGINE_ADAPTERS: EngineAdapter[] = [
  {
    id: "mock-engine",
    label: "Mock engine",
    kind: "mock",
    description: "Deterministic mock agents writing real files (default).",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    kind: "cloud",
    description: "Runs the local Claude Code CLI for real project edits when installed.",
  },
  {
    id: "codex",
    label: "OpenAI Codex",
    kind: "cloud",
    description: "Runs the local Codex CLI for real project edits when installed.",
  },
  {
    id: "cursor",
    label: "Cursor",
    kind: "ide",
    description: "Placeholder for future Cursor agents integration.",
  },
];
