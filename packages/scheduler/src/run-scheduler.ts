import { evaluateAutonomyForSchedulerStep } from "@aios-celx/autonomy-control";
import { executeQueueItem } from "@aios-celx/agent-runtime";
import {
  claimNextQueueItem,
  claimQueueItemsByIds,
  listReadyEligibleItems,
  markQueueItemDone,
  markQueueItemFailed,
  peekNextEligibleItem,
} from "@aios-celx/execution-queue";
import type { QueueItem } from "@aios-celx/execution-queue";
import { loadProjectConfig } from "@aios-celx/project-manager";
import { mergeAutonomyPolicy } from "@aios-celx/shared";
import { readState } from "@aios-celx/state-manager";
import { appendSchedulerLog } from "./logs.js";
import { mapAutonomyDenyToStopReason } from "./map-autonomy-stop.js";
import { buildParallelExecutionPlan } from "./parallel-plan.js";
import type { ParallelExecutionPlan } from "./parallel-plan.js";
import type {
  SchedulerConfig,
  SchedulerResult,
  SchedulerStopReason,
  ScheduledExecutionSummary,
} from "./schemas.js";
import { SchedulerConfigSchema } from "./schemas.js";

function nowIso(): string {
  return new Date().toISOString();
}

export async function runScheduler(raw: SchedulerConfig): Promise<SchedulerResult> {
  const c = SchedulerConfigSchema.parse(raw);
  const startedAt = nowIso();
  const wallStart = Date.now();
  const maxConcurrent = Math.min(Math.max(1, c.maxConcurrent ?? 1), 2);

  const maxItemsToProcess =
    c.mode === "loop" ? (c.maxSteps ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

  void appendSchedulerLog(c.projectsRoot, c.projectId, {
    type: "scheduler.start",
    projectId: c.projectId,
    mode: c.mode,
    maxSteps: c.maxSteps ?? null,
    maxDurationMs: c.maxDurationMs ?? null,
    maxConcurrent,
  });

  const projectConfig = await loadProjectConfig(c.projectsRoot, c.projectId);
  const policy = mergeAutonomyPolicy(projectConfig.autonomy);

  const summaries: ScheduledExecutionSummary[] = [];
  let executedOk = 0;
  let executedFailed = 0;
  let stopReason: SchedulerStopReason | null = null;
  let processed = 0;
  let lastStepFailed = false;
  let lastParallelPlan: ParallelExecutionPlan | null = null;

  if (!policy.enabled) {
    stopReason = "autonomy_disabled";
  } else if (c.mode === "loop" && !policy.allowLoopExecution) {
    stopReason = "autonomy_loop_forbidden";
  }

  while (stopReason === null) {
    if (c.mode === "loop" && c.maxDurationMs != null && Date.now() - wallStart >= c.maxDurationMs) {
      stopReason = "max_duration";
      break;
    }
    if (c.mode === "loop" && processed >= maxItemsToProcess) {
      stopReason = "max_steps";
      break;
    }

    const state = await readState(c.projectsRoot, c.projectId);
    if (state.blocked) {
      stopReason = "project_blocked";
      break;
    }
    if (state.requiresHumanApproval) {
      stopReason = "requires_human_approval";
      break;
    }

    if (maxConcurrent > 1) {
      const itemBudget =
        c.mode === "loop" && maxItemsToProcess !== Number.POSITIVE_INFINITY
          ? maxItemsToProcess - processed
          : maxConcurrent;
      const planCap = Math.min(maxConcurrent, Math.max(1, itemBudget));

      const batchResult = await runParallelAwareBatch({
        cfg: c,
        policy,
        state,
        processed,
        lastStepFailed,
        maxConcurrent: planCap,
      });
      lastParallelPlan = batchResult.plan;
      if (batchResult.stopReason) {
        stopReason = batchResult.stopReason;
        break;
      }
      if (batchResult.summaries.length === 0) {
        stopReason = "no_eligible_item";
        break;
      }
      for (const s of batchResult.summaries) {
        summaries.push(s);
        if (s.ok) {
          executedOk += 1;
        } else {
          executedFailed += 1;
        }
      }
      processed += batchResult.summaries.length;
      lastStepFailed = batchResult.summaries.some((x) => !x.ok);
      void appendSchedulerLog(c.projectsRoot, c.projectId, {
        type: "scheduler.parallel_batch",
        projectId: c.projectId,
        plan: batchResult.plan,
        itemIds: batchResult.summaries.map((s) => s.itemId),
      });

      if (c.mode === "once") {
        stopReason = "once_complete";
        break;
      }
      continue;
    }

    const nextItem = await peekNextEligibleItem(c.projectsRoot, c.projectId);
    if (!nextItem) {
      stopReason = "no_eligible_item";
      break;
    }

    const decision = await evaluateAutonomyForSchedulerStep(c.projectsRoot, c.projectId, {
      policy,
      state,
      mode: c.mode,
      processedThisRun: processed,
      lastStepFailed,
      nextItem,
    });

    if (!decision.allow && decision.denyCode) {
      stopReason = mapAutonomyDenyToStopReason(decision.denyCode);
      void appendSchedulerLog(c.projectsRoot, c.projectId, {
        type: "scheduler.autonomy_halt",
        projectId: c.projectId,
        denyCode: decision.denyCode,
        message: decision.message,
      });
      break;
    }

    const item = await claimNextQueueItem(c.projectsRoot, c.projectId);
    if (!item || item.id !== nextItem.id) {
      stopReason = "no_eligible_item";
      break;
    }

    lastStepFailed = false;
    processed += 1;
    const t0 = Date.now();
    try {
      const execResult = await executeQueueItem(c.projectsRoot, c.projectId, item);
      const durationMs = Date.now() - t0;
      if (execResult.ok) {
        await markQueueItemDone(c.projectsRoot, c.projectId, item.id);
        executedOk += 1;
        summaries.push({
          itemId: item.id,
          type: item.type,
          ok: true,
          message: execResult.message,
          durationMs,
        });
      } else {
        lastStepFailed = true;
        await markQueueItemFailed(
          c.projectsRoot,
          c.projectId,
          item.id,
          execResult.message ?? "execution not ok",
        );
        executedFailed += 1;
        summaries.push({
          itemId: item.id,
          type: item.type,
          ok: false,
          message: execResult.message,
          durationMs,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const durationMs = Date.now() - t0;
      lastStepFailed = true;
      await markQueueItemFailed(c.projectsRoot, c.projectId, item.id, msg);
      executedFailed += 1;
      summaries.push({
        itemId: item.id,
        type: item.type,
        ok: false,
        message: msg,
        durationMs,
      });
    }

    void appendSchedulerLog(c.projectsRoot, c.projectId, {
      type: "scheduler.step",
      projectId: c.projectId,
      itemId: item.id,
      itemType: item.type,
      lastSummary: summaries[summaries.length - 1],
    });

    if (c.mode === "once") {
      stopReason = "once_complete";
      break;
    }
  }

  if (stopReason === null) {
    stopReason = "no_eligible_item";
  }

  const nextPeek = await peekNextEligibleItem(c.projectsRoot, c.projectId);
  const finishedAt = nowIso();

  const result: SchedulerResult = {
    projectId: c.projectId,
    mode: c.mode,
    executedOk,
    executedFailed,
    stopReason,
    summaries,
    nextPeek,
    startedAt,
    finishedAt,
    lastParallelPlan,
  };

  void appendSchedulerLog(c.projectsRoot, c.projectId, {
    type: "scheduler.stop",
    projectId: c.projectId,
    stopReason,
    executedOk,
    executedFailed,
    processed,
    durationMsWall: Date.now() - wallStart,
    maxConcurrent,
  });

  return result;
}

type BatchCtx = {
  cfg: SchedulerConfig;
  policy: ReturnType<typeof mergeAutonomyPolicy>;
  state: Awaited<ReturnType<typeof readState>>;
  processed: number;
  lastStepFailed: boolean;
  maxConcurrent: number;
};

async function runParallelAwareBatch(ctx: BatchCtx): Promise<{
  summaries: ScheduledExecutionSummary[];
  plan: ParallelExecutionPlan;
  stopReason: SchedulerStopReason | null;
}> {
  const { cfg, policy, state, processed, lastStepFailed, maxConcurrent } = ctx;
  const readyList = await listReadyEligibleItems(cfg.projectsRoot, cfg.projectId);
  if (readyList.length === 0) {
    return { summaries: [], plan: buildParallelExecutionPlan([], maxConcurrent), stopReason: null };
  }

  const plan = buildParallelExecutionPlan(readyList, maxConcurrent);
  void appendSchedulerLog(cfg.projectsRoot, cfg.projectId, {
    type: "scheduler.parallel_plan",
    projectId: cfg.projectId,
    plan,
    conflicts: plan.conflicts,
  });

  const slot = plan.slots[0];
  if (!slot || slot.itemIds.length === 0) {
    return { summaries: [], plan, stopReason: "no_eligible_item" };
  }

  const batchItems: QueueItem[] = slot.itemIds
    .map((id) => readyList.find((qi: QueueItem) => qi.id === id))
    .filter((x): x is QueueItem => x != null);

  if (batchItems.length === 0) {
    return { summaries: [], plan, stopReason: "no_eligible_item" };
  }

  const effective: QueueItem[] = [];
  for (let i = 0; i < batchItems.length; i++) {
    const item = batchItems[i]!;
    const decision = await evaluateAutonomyForSchedulerStep(cfg.projectsRoot, cfg.projectId, {
      policy,
      state,
      mode: cfg.mode,
      processedThisRun: processed + i,
      lastStepFailed: i === 0 ? lastStepFailed : false,
      nextItem: item,
    });

    if (!decision.allow && decision.denyCode) {
      if (i === 0) {
        return {
          summaries: [],
          plan,
          stopReason: mapAutonomyDenyToStopReason(decision.denyCode),
        };
      }
      void appendSchedulerLog(cfg.projectsRoot, cfg.projectId, {
        type: "scheduler.parallel_autonomy_shrink",
        projectId: cfg.projectId,
        droppedItemId: item.id,
        message: decision.message ?? "",
      });
      break;
    }
    effective.push(item);
  }

  if (effective.length === 0) {
    return { summaries: [], plan, stopReason: "no_eligible_item" };
  }

  const claimed = await claimQueueItemsByIds(
    cfg.projectsRoot,
    cfg.projectId,
    effective.map((i) => i.id),
  );
  if (!claimed || claimed.length !== effective.length) {
    return { summaries: [], plan, stopReason: "no_eligible_item" };
  }

  const summaries: ScheduledExecutionSummary[] = await Promise.all(
    claimed.map(async (item: QueueItem) => {
      const t0 = Date.now();
      try {
        const execResult = await executeQueueItem(cfg.projectsRoot, cfg.projectId, item);
        const durationMs = Date.now() - t0;
        if (execResult.ok) {
          await markQueueItemDone(cfg.projectsRoot, cfg.projectId, item.id);
          return {
            itemId: item.id,
            type: item.type,
            ok: true,
            message: execResult.message,
            durationMs,
          } satisfies ScheduledExecutionSummary;
        }
        await markQueueItemFailed(
          cfg.projectsRoot,
          cfg.projectId,
          item.id,
          execResult.message ?? "execution not ok",
        );
        return {
          itemId: item.id,
          type: item.type,
          ok: false,
          message: execResult.message,
          durationMs,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const durationMs = Date.now() - t0;
        await markQueueItemFailed(cfg.projectsRoot, cfg.projectId, item.id, msg);
        return {
          itemId: item.id,
          type: item.type,
          ok: false,
          message: msg,
          durationMs,
        };
      }
    }),
  );

  for (const s of summaries) {
    void appendSchedulerLog(cfg.projectsRoot, cfg.projectId, {
      type: "scheduler.step",
      projectId: cfg.projectId,
      itemId: s.itemId,
      itemType: s.type,
      lastSummary: s,
    });
  }

  return { summaries, plan, stopReason: null };
}
