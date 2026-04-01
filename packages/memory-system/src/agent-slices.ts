import type { MemoryCategory, MemoryEntry } from "./schemas.js";
import { loadGlobalMemory, loadProjectMemory } from "./service.js";
import { resolveMonorepoRootFromProjectRoot } from "./monorepo-root.js";

/** Categories each agent receives (Bloco 5.1). */
export const AGENT_MEMORY_CATEGORIES: Partial<Record<string, MemoryCategory[]>> = {
  "requirements-analyst": ["product-context", "business-rules", "domain-context"],
  "product-manager": ["product-context", "business-rules", "workflow-notes"],
  "software-architect": ["technical-decisions", "architecture", "integrations"],
  "delivery-manager": ["workflow-notes", "execution-history"],
  engineer: ["technical-decisions", "coding-standards", "execution-history"],
  "qa-reviewer": ["coding-standards", "execution-history", "technical-decisions"],
  "technical-writer": ["workflow-notes", "product-context", "technical-decisions"],
  "refactor-guardian": ["technical-decisions", "architecture", "coding-standards"],
  "integration-specialist": ["integrations", "business-rules", "technical-decisions"],
  "db-designer": ["architecture", "domain-context", "technical-decisions"],
  "security-reviewer": ["technical-decisions", "business-rules"],
  "ux-reviewer": ["product-context", "business-rules", "domain-context"],
  "sprint-planner": ["workflow-notes", "execution-history"],
  "cost-optimizer": ["workflow-notes", "technical-decisions"],
  "observability-agent": ["technical-decisions", "execution-history"],
  "release-manager": ["workflow-notes", "product-context"],
  "portfolio-strategist": ["product-context", "business-rules", "workflow-notes"],
};

function filterEntries(entries: MemoryEntry[], categories: MemoryCategory[] | undefined): MemoryEntry[] {
  if (!categories || categories.length === 0) {
    return [...entries];
  }
  const set = new Set(categories);
  return entries.filter((e) => set.has(e.category));
}

/**
 * Load global + project memory slices filtered for the agent.
 * `projectRoot` is `projects/<projectId>` on disk.
 */
export async function resolveMemorySlicesForAgent(options: {
  agentId: string;
  projectRoot: string;
  projectsRoot: string;
  projectId: string;
}): Promise<{ global: MemoryEntry[]; project: MemoryEntry[] }> {
  const { agentId, projectRoot, projectsRoot, projectId } = options;
  const monorepoRoot = resolveMonorepoRootFromProjectRoot(projectRoot);
  const categories = AGENT_MEMORY_CATEGORIES[agentId];

  const [gDoc, pDoc] = await Promise.all([
    loadGlobalMemory(monorepoRoot),
    loadProjectMemory(projectsRoot, projectId),
  ]);

  return {
    global: filterEntries(gDoc.entries, categories),
    project: filterEntries(pDoc.entries, categories),
  };
}

/** Serialize for `EngineRunInput.memorySlices` (plain JSON). */
export function memorySlicesToPlain(slices: {
  global: MemoryEntry[];
  project: MemoryEntry[];
}): { global: Record<string, unknown>[]; project: Record<string, unknown>[] } {
  return {
    global: slices.global.map((e) => ({ ...e })),
    project: slices.project.map((e) => ({ ...e })),
  };
}
