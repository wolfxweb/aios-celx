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
    description: "Placeholder for future Claude / Claude Code integration.",
  },
  {
    id: "codex",
    label: "OpenAI Codex",
    kind: "cloud",
    description: "Placeholder for future Codex-style integration.",
  },
  {
    id: "cursor",
    label: "Cursor",
    kind: "ide",
    description: "Placeholder for future Cursor agents integration.",
  },
];
