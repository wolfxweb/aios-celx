import type { MemoryCategory } from "@aios-celx/memory-system";

export type BacklogMode = "none" | "full" | "stories_and_tasks";

export type AgentContextRule = {
  readPaths: string[];
  backlogMode: BacklogMode;
  memory: { global: MemoryCategory[]; project: MemoryCategory[] };
  /** Add `context/current-task.json` when taskId is set. */
  attachTaskJson?: boolean;
  /** Add implementation report path when taskId is set. */
  attachImplementationReport?: boolean;
};

/**
 * Bloco 5.4 — deterministic paths + memory categories per agent.
 */
export const AGENT_CONTEXT_RULES: Record<string, AgentContextRule> = {
  "requirements-analyst": {
    readPaths: ["docs/vision.md"],
    backlogMode: "none",
    memory: {
      global: ["workflow-notes"],
      project: ["product-context", "business-rules"],
    },
  },
  "product-manager": {
    readPaths: ["docs/discovery.md"],
    backlogMode: "full",
    memory: { global: [], project: ["product-context", "business-rules"] },
  },
  "software-architect": {
    readPaths: ["docs/discovery.md", "docs/prd.md", "backlog/stories.yaml"],
    backlogMode: "none",
    memory: { global: [], project: ["technical-decisions", "integrations", "architecture"] },
  },
  "delivery-manager": {
    readPaths: [".aios/queue.json"],
    backlogMode: "full",
    memory: { global: ["workflow-notes"], project: ["execution-history", "workflow-notes"] },
  },
  engineer: {
    readPaths: ["docs/architecture.md", "docs/api-contracts.md", "backlog/stories.yaml", "backlog/tasks.yaml"],
    backlogMode: "none",
    memory: { global: [], project: ["technical-decisions", "coding-standards", "execution-history"] },
    attachTaskJson: true,
  },
  "qa-reviewer": {
    readPaths: ["docs/architecture.md", "docs/api-contracts.md"],
    backlogMode: "none",
    memory: { global: [], project: ["coding-standards", "execution-history", "technical-decisions"] },
    attachTaskJson: true,
    attachImplementationReport: true,
  },
};

export function mergeReadPaths(rule: AgentContextRule | undefined, fallback: string[] | undefined): string[] {
  const a = rule?.readPaths ?? [];
  const b = fallback ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of [...a, ...b]) {
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}
