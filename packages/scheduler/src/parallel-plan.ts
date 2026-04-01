import type { QueueItem } from "@aios-celx/execution-queue";
import { z } from "zod";

export const ExecutionConflictSchema = z.object({
  kind: z.enum([
    "same_story",
    "unknown_story",
    "touch_paths_overlap",
    "touch_paths_unknown",
    "depends_on_pair",
  ]),
  itemIds: z.tuple([z.string(), z.string()]),
  message: z.string(),
});

export type ExecutionConflict = z.infer<typeof ExecutionConflictSchema>;

export const ExecutionSlotSchema = z.object({
  itemIds: z.array(z.string()),
});

export type ExecutionSlot = z.infer<typeof ExecutionSlotSchema>;

export const ParallelExecutionPlanSchema = z.object({
  slots: z.array(ExecutionSlotSchema),
  conflicts: z.array(ExecutionConflictSchema),
  parallelAllowed: z.boolean(),
  reason: z.string(),
});

export type ParallelExecutionPlan = z.infer<typeof ParallelExecutionPlanSchema>;

export function extractStoryKeyForParallelism(item: QueueItem): string | null {
  const p = item.payload;
  if (p && typeof p === "object" && "storyId" in p) {
    const s = (p as { storyId?: unknown }).storyId;
    if (typeof s === "string" && s.length > 0) {
      return s;
    }
  }
  const m = item.metadata;
  if (m && typeof m === "object" && "storyId" in m) {
    const s = (m as { storyId?: unknown }).storyId;
    if (typeof s === "string" && s.length > 0) {
      return s;
    }
  }
  return null;
}

function touchPathsInfo(
  item: QueueItem,
): { known: false } | { known: true; paths: Set<string> } {
  const m = item.metadata;
  if (!m || typeof m !== "object" || !("touchPaths" in m)) {
    return { known: false };
  }
  const tp = (m as { touchPaths?: unknown }).touchPaths;
  if (!Array.isArray(tp)) {
    return { known: false };
  }
  const paths = tp.filter((x): x is string => typeof x === "string");
  return { known: true, paths: new Set(paths) };
}

/** Returns a conflict if these two ready items must not run in parallel. */
export function describePairConflict(a: QueueItem, b: QueueItem): ExecutionConflict | null {
  if (a.dependsOn.includes(b.id) || b.dependsOn.includes(a.id)) {
    return {
      kind: "depends_on_pair",
      itemIds: [a.id, b.id],
      message: "Items depend on each other in the queue graph.",
    };
  }

  const sa = extractStoryKeyForParallelism(a);
  const sb = extractStoryKeyForParallelism(b);
  if (!sa || !sb) {
    return {
      kind: "unknown_story",
      itemIds: [a.id, b.id],
      message:
        "Missing storyId in payload/metadata; refusing parallel pair (declare storyId for run-task/run-qa or use run-story payload).",
    };
  }
  if (sa === sb) {
    return {
      kind: "same_story",
      itemIds: [a.id, b.id],
      message: `Same story (${sa}).`,
    };
  }

  const ta = touchPathsInfo(a);
  const tb = touchPathsInfo(b);
  if (!ta.known || !tb.known) {
    return {
      kind: "touch_paths_unknown",
      itemIds: [a.id, b.id],
      message: "metadata.touchPaths (string[]) not set on both items; refusing parallel pair.",
    };
  }
  for (const path of ta.paths) {
    if (tb.paths.has(path)) {
      return {
        kind: "touch_paths_overlap",
        itemIds: [a.id, b.id],
        message: `Overlapping touch path: ${path}`,
      };
    }
  }

  return null;
}

/**
 * Greedy plan: pair the first ready item with the earliest next item that has no conflict.
 * Cap 2 (Bloco 6.6). If in doubt, single-item slot.
 */
export function buildParallelExecutionPlan(
  readyItems: QueueItem[],
  maxConcurrent: number,
): ParallelExecutionPlan {
  const conflicts: ExecutionConflict[] = [];
  if (readyItems.length === 0) {
    return {
      slots: [],
      conflicts: [],
      parallelAllowed: false,
      reason: "No ready items.",
    };
  }

  const cap = Math.min(Math.max(1, maxConcurrent), 2);
  const first = readyItems[0]!;

  if (cap === 1) {
    return {
      slots: [{ itemIds: [first.id] }],
      conflicts: [],
      parallelAllowed: false,
      reason: "maxConcurrent=1 — sequential execution.",
    };
  }

  for (let j = 1; j < readyItems.length; j++) {
    const other = readyItems[j]!;
    const c = describePairConflict(first, other);
    if (c) {
      conflicts.push(c);
      continue;
    }
    return {
      slots: [{ itemIds: [first.id, other.id] }],
      conflicts,
      parallelAllowed: true,
      reason: `Parallel batch: items ${first.id} and ${other.id} are independent.`,
    };
  }

  return {
    slots: [{ itemIds: [first.id] }],
    conflicts,
    parallelAllowed: false,
    reason: "No independent second item; sequential execution.",
  };
}
