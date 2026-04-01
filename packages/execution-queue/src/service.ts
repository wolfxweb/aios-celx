import { readJson, writeJson } from "@aios-celx/artifact-manager";
import { loadProjectConfig } from "@aios-celx/project-manager";
import { readState } from "@aios-celx/state-manager";
import { randomUUID } from "node:crypto";
import { appendQueueLog } from "./logs.js";
import { queueJsonPath } from "./paths.js";
import type { ProjectQueue, QueueItem, QueueItemStatus, QueueItemType } from "./schemas.js";
import { ProjectQueueSchema, QueueItemSchema } from "./schemas.js";

function nowIso(): string {
  return new Date().toISOString();
}

function assertSafeProjectId(projectId: string): void {
  if (projectId.includes("..") || projectId.includes("/") || projectId.includes("\\")) {
    throw new Error(`Invalid projectId: ${projectId}`);
  }
}

export function emptyProjectQueue(projectId: string): ProjectQueue {
  return {
    schemaVersion: 1,
    projectId,
    updatedAt: nowIso(),
    items: [],
  };
}

export async function loadProjectQueue(projectsRoot: string, projectId: string): Promise<ProjectQueue> {
  assertSafeProjectId(projectId);
  const path = queueJsonPath(projectsRoot, projectId);
  try {
    const raw = await readJson<unknown>(path);
    const parsed = ProjectQueueSchema.safeParse(raw);
    if (!parsed.success) {
      return emptyProjectQueue(projectId);
    }
    return parsed.data;
  } catch {
    return emptyProjectQueue(projectId);
  }
}

export async function saveProjectQueue(
  projectsRoot: string,
  projectId: string,
  queue: ProjectQueue,
): Promise<void> {
  assertSafeProjectId(projectId);
  const next: ProjectQueue = {
    ...queue,
    projectId,
    updatedAt: nowIso(),
  };
  await writeJson(queueJsonPath(projectsRoot, projectId), next);
}

export type EnqueueInput = {
  type: QueueItemType;
  priority?: number;
  payload?: Record<string, unknown>;
  dependsOn?: string[];
  requiresApproval?: boolean;
  metadata?: Record<string, unknown>;
  scheduledAt?: string | null;
};

function validateDependsOn(queue: ProjectQueue, item: QueueItem): void {
  const ids = new Set(queue.items.map((i) => i.id));
  for (const dep of item.dependsOn) {
    if (!ids.has(dep)) {
      throw new Error(`enqueue: dependsOn references unknown item id: ${dep}`);
    }
  }
}

export async function enqueue(
  projectsRoot: string,
  projectId: string,
  input: EnqueueInput,
): Promise<QueueItem> {
  assertSafeProjectId(projectId);
  const config = await loadProjectConfig(projectsRoot, projectId);
  if (config.projectId !== projectId) {
    throw new Error("Queue: config projectId mismatch (isolation check)");
  }

  const queue = await loadProjectQueue(projectsRoot, projectId);
  const id = randomUUID();
  const t = nowIso();
  const item: QueueItem = QueueItemSchema.parse({
    id,
    projectId,
    type: input.type,
    status: "pending",
    priority: input.priority ?? 0,
    payload: input.payload ?? {},
    createdAt: t,
    updatedAt: t,
    scheduledAt: input.scheduledAt ?? null,
    startedAt: null,
    finishedAt: null,
    dependsOn: input.dependsOn ?? [],
    requiresApproval: input.requiresApproval ?? false,
    metadata: input.metadata ?? {},
    reason: null,
  });

  validateDependsOn(queue, item);

  queue.items.push(item);
  await saveProjectQueue(projectsRoot, projectId, queue);
  void appendQueueLog(projectsRoot, projectId, {
    type: "queue.enqueue",
    projectId,
    itemId: id,
    itemType: input.type,
    priority: item.priority,
  });

  return item;
}

function doneIds(queue: ProjectQueue): Set<string> {
  return new Set(queue.items.filter((i) => i.status === "done").map((i) => i.id));
}

/** Promote pending items whose dependencies are done and approval (if required) is granted. */
export function reconcilePendingToReady(queue: ProjectQueue): ProjectQueue {
  const done = doneIds(queue);
  const nextItems = queue.items.map((item) => {
    if (item.status !== "pending") {
      return item;
    }
    const depsOk = item.dependsOn.every((id) => done.has(id));
    const approved =
      !item.requiresApproval ||
      item.metadata.approved === true ||
      item.metadata.approvalGranted === true;
    if (depsOk && approved) {
      return {
        ...item,
        status: "ready" as const,
        updatedAt: nowIso(),
        reason: null,
      };
    }
    return item;
  });
  return { ...queue, items: nextItems, updatedAt: nowIso() };
}

export function isProjectRunnable(state: { blocked: boolean; requiresHumanApproval: boolean }): boolean {
  if (state.blocked) {
    return false;
  }
  if (state.requiresHumanApproval) {
    return false;
  }
  return true;
}

/** Assumes `reconcilePendingToReady` already applied. */
export function selectNextReadyItem(queue: ProjectQueue): QueueItem | null {
  const sorted = listReadyItemsSorted(queue);
  return sorted[0] ?? null;
}

/** All `ready` items, same ordering as `selectNextReadyItem` (priority desc, then createdAt asc). */
export function listReadyItemsSorted(queue: ProjectQueue): QueueItem[] {
  const ready = queue.items.filter((i) => i.status === "ready");
  ready.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
  return ready;
}

export async function peekNextEligibleItem(
  projectsRoot: string,
  projectId: string,
): Promise<QueueItem | null> {
  assertSafeProjectId(projectId);
  const state = await readState(projectsRoot, projectId);
  if (!isProjectRunnable(state)) {
    return null;
  }
  let queue = await loadProjectQueue(projectsRoot, projectId);
  queue = reconcilePendingToReady(queue);
  await saveProjectQueue(projectsRoot, projectId, queue);
  return selectNextReadyItem(queue);
}

/** Promote pending→ready, mark first ready item as running. Returns null if project blocked or queue empty. */
export async function claimNextQueueItem(
  projectsRoot: string,
  projectId: string,
): Promise<QueueItem | null> {
  assertSafeProjectId(projectId);
  const state = await readState(projectsRoot, projectId);
  if (!isProjectRunnable(state)) {
    void appendQueueLog(projectsRoot, projectId, {
      type: "queue.claim_skipped",
      projectId,
      reason: state.blocked ? "project_blocked" : "requires_human_approval",
    });
    return null;
  }

  let queue = await loadProjectQueue(projectsRoot, projectId);
  queue = reconcilePendingToReady(queue);
  const next = selectNextReadyItem(queue);
  if (!next) {
    await saveProjectQueue(projectsRoot, projectId, queue);
    return null;
  }

  const started = nowIso();
  const items = queue.items.map((i) =>
    i.id === next.id
      ? { ...i, status: "running" as const, startedAt: started, updatedAt: started, reason: null }
      : i,
  );
  const updated: ProjectQueue = { ...queue, items, updatedAt: started };
  await saveProjectQueue(projectsRoot, projectId, updated);
  const claimed = items.find((i) => i.id === next.id)!;

  void appendQueueLog(projectsRoot, projectId, {
    type: "queue.claim",
    projectId,
    itemId: claimed.id,
    itemType: claimed.type,
  });

  return claimed;
}

/**
 * Marks multiple `ready` items as `running` in a single save (Bloco 6.6 — parallel batch).
 * Returns null if the project is not runnable or any id is not ready.
 */
export async function claimQueueItemsByIds(
  projectsRoot: string,
  projectId: string,
  itemIds: string[],
): Promise<QueueItem[] | null> {
  if (itemIds.length === 0) {
    return [];
  }
  assertSafeProjectId(projectId);
  const state = await readState(projectsRoot, projectId);
  if (!isProjectRunnable(state)) {
    void appendQueueLog(projectsRoot, projectId, {
      type: "queue.claim_skipped",
      projectId,
      reason: state.blocked ? "project_blocked" : "requires_human_approval",
    });
    return null;
  }

  let queue = await loadProjectQueue(projectsRoot, projectId);
  queue = reconcilePendingToReady(queue);
  const readyIds = new Set(queue.items.filter((i) => i.status === "ready").map((i) => i.id));
  for (const id of itemIds) {
    if (!readyIds.has(id)) {
      await saveProjectQueue(projectsRoot, projectId, queue);
      return null;
    }
  }

  const idSet = new Set(itemIds);
  const started = nowIso();
  const nextItems = queue.items.map((i) =>
    idSet.has(i.id)
      ? { ...i, status: "running" as const, startedAt: started, updatedAt: started, reason: null }
      : i,
  );
  await saveProjectQueue(projectsRoot, projectId, { ...queue, items: nextItems, updatedAt: started });
  const claimed = itemIds.map((id) => nextItems.find((i) => i.id === id)!);
  for (const c of claimed) {
    void appendQueueLog(projectsRoot, projectId, {
      type: "queue.claim",
      projectId,
      itemId: c.id,
      itemType: c.type,
    });
  }
  return claimed;
}

/** Ready items after reconcile+save; empty if project blocked or requires approval. */
export async function listReadyEligibleItems(
  projectsRoot: string,
  projectId: string,
): Promise<QueueItem[]> {
  assertSafeProjectId(projectId);
  const state = await readState(projectsRoot, projectId);
  if (!isProjectRunnable(state)) {
    return [];
  }
  let queue = await loadProjectQueue(projectsRoot, projectId);
  queue = reconcilePendingToReady(queue);
  await saveProjectQueue(projectsRoot, projectId, queue);
  return listReadyItemsSorted(queue);
}

/** Alias aligned with the execution plan naming. */
export const dequeueNextReady = claimNextQueueItem;

export async function listQueueItems(projectsRoot: string, projectId: string): Promise<QueueItem[]> {
  const q = await loadProjectQueue(projectsRoot, projectId);
  return [...q.items];
}

export async function listQueueItemsByStatus(
  projectsRoot: string,
  projectId: string,
  status: QueueItemStatus,
): Promise<QueueItem[]> {
  const items = await listQueueItems(projectsRoot, projectId);
  return items.filter((i) => i.status === status);
}

async function patchItem(
  projectsRoot: string,
  projectId: string,
  itemId: string,
  mutate: (item: QueueItem) => QueueItem,
): Promise<QueueItem | null> {
  const queue = await loadProjectQueue(projectsRoot, projectId);
  const idx = queue.items.findIndex((i) => i.id === itemId);
  if (idx === -1) {
    return null;
  }
  const next = mutate(queue.items[idx]!);
  const items = [...queue.items];
  items[idx] = next;
  await saveProjectQueue(projectsRoot, projectId, { ...queue, items });
  return next;
}

export async function markQueueItemRunning(
  projectsRoot: string,
  projectId: string,
  itemId: string,
): Promise<QueueItem | null> {
  const t = nowIso();
  return patchItem(projectsRoot, projectId, itemId, (i) => ({
    ...i,
    status: "running",
    startedAt: t,
    updatedAt: t,
    reason: null,
  }));
}

export async function markQueueItemDone(
  projectsRoot: string,
  projectId: string,
  itemId: string,
): Promise<QueueItem | null> {
  const t = nowIso();
  const item = await patchItem(projectsRoot, projectId, itemId, (i) => ({
    ...i,
    status: "done",
    finishedAt: t,
    updatedAt: t,
    reason: null,
  }));
  if (item) {
    void appendQueueLog(projectsRoot, projectId, {
      type: "queue.done",
      projectId,
      itemId,
      itemType: item.type,
    });
  }
  return item;
}

export async function markQueueItemFailed(
  projectsRoot: string,
  projectId: string,
  itemId: string,
  reason: string,
): Promise<QueueItem | null> {
  const t = nowIso();
  const item = await patchItem(projectsRoot, projectId, itemId, (i) => ({
    ...i,
    status: "failed",
    finishedAt: t,
    updatedAt: t,
    reason,
  }));
  if (item) {
    void appendQueueLog(projectsRoot, projectId, {
      type: "queue.failed",
      projectId,
      itemId,
      itemType: item.type,
      reason,
    });
  }
  return item;
}

export async function markQueueItemBlocked(
  projectsRoot: string,
  projectId: string,
  itemId: string,
  reason: string,
): Promise<QueueItem | null> {
  const t = nowIso();
  const item = await patchItem(projectsRoot, projectId, itemId, (i) => ({
    ...i,
    status: "blocked",
    updatedAt: t,
    reason,
  }));
  if (item) {
    void appendQueueLog(projectsRoot, projectId, {
      type: "queue.blocked",
      projectId,
      itemId,
      reason,
    });
  }
  return item;
}

/** Sets metadata so `requiresApproval` items can become `ready` after reconcile. */
export async function grantQueueItemApproval(
  projectsRoot: string,
  projectId: string,
  itemId: string,
): Promise<QueueItem | null> {
  return patchItem(projectsRoot, projectId, itemId, (i) => ({
    ...i,
    metadata: { ...i.metadata, approved: true },
    updatedAt: nowIso(),
  }));
}
