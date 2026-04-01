import { z } from "zod";

export const QueueItemTypeSchema = z.enum([
  "run-task",
  "run-qa",
  "run-story",
  "update-story-status",
  "update-project-state",
  "generate-delivery-summary",
  "request-approval",
]);

export type QueueItemType = z.infer<typeof QueueItemTypeSchema>;

export const QueueItemStatusSchema = z.enum([
  "pending",
  "ready",
  "running",
  "blocked",
  "done",
  "failed",
  "cancelled",
]);

export type QueueItemStatus = z.infer<typeof QueueItemStatusSchema>;

export const QueueItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: QueueItemTypeSchema,
  status: QueueItemStatusSchema,
  /** Higher runs first among eligible items. */
  priority: z.number().default(0),
  payload: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
  scheduledAt: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  finishedAt: z.string().nullable().optional(),
  dependsOn: z.array(z.string()).default([]),
  requiresApproval: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).default({}),
  /** When status is blocked/failed, human-readable reason. */
  reason: z.string().nullable().optional(),
});

export type QueueItem = z.infer<typeof QueueItemSchema>;

export const ProjectQueueSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: z.string(),
  updatedAt: z.string(),
  items: z.array(QueueItemSchema),
});

export type ProjectQueue = z.infer<typeof ProjectQueueSchema>;

export const QueueExecutionResultSchema = z.object({
  ok: z.boolean(),
  itemId: z.string(),
  type: QueueItemTypeSchema,
  error: z.string().optional(),
  detail: z.unknown().optional(),
});

export type QueueExecutionResult = z.infer<typeof QueueExecutionResultSchema>;
