/**
 * Smoke checks for parallel planning (Bloco 6.6).
 * Run: pnpm --filter @aios-celx/scheduler run selftest
 */
import type { QueueItem } from "@aios-celx/execution-queue";
import { buildParallelExecutionPlan, describePairConflict } from "./parallel-plan.js";

function base(id: string, overrides: Partial<QueueItem>): QueueItem {
  return {
    id,
    projectId: "demo",
    type: "run-task",
    status: "ready",
    priority: 0,
    payload: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    scheduledAt: null,
    startedAt: null,
    finishedAt: null,
    dependsOn: [],
    requiresApproval: false,
    metadata: {},
    reason: null,
    ...overrides,
  };
}

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    throw new Error(msg);
  }
}

function main(): void {
  const a = base("a", {
    metadata: { storyId: "S1", touchPaths: ["/src/a.ts"] },
  });
  const b = base("b", {
    metadata: { storyId: "S2", touchPaths: ["/src/b.ts"] },
  });
  const planOk = buildParallelExecutionPlan([a, b], 2);
  assert(planOk.parallelAllowed && planOk.slots[0]!.itemIds.length === 2, "expected parallel pair");

  const c = base("c", {
    metadata: { storyId: "S1", touchPaths: ["/src/c.ts"] },
  });
  const planSame = buildParallelExecutionPlan([a, c], 2);
  assert(!planSame.parallelAllowed && planSame.slots[0]!.itemIds.length === 1, "same story → sequential");

  const unk = base("u", { metadata: { touchPaths: ["/x"] } });
  const cf = describePairConflict(a, unk);
  assert(cf != null && cf.kind === "unknown_story", "missing storyId → conflict");

  const overlap1 = base("o1", {
    metadata: { storyId: "S1", touchPaths: ["/shared/foo.ts"] },
  });
  const overlap2 = base("o2", {
    metadata: { storyId: "S2", touchPaths: ["/shared/foo.ts"] },
  });
  const co = describePairConflict(overlap1, overlap2);
  assert(co != null && co.kind === "touch_paths_overlap", "touch path overlap → conflict");

  console.log("parallel-plan.selftest: OK");
}

main();
