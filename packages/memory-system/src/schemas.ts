import { z } from "zod";

export const MemoryCategorySchema = z.enum([
  "business-rules",
  "technical-decisions",
  "architecture",
  "integrations",
  "domain-context",
  "coding-standards",
  "product-context",
  "workflow-notes",
  "execution-history",
]);

export type MemoryCategory = z.infer<typeof MemoryCategorySchema>;

export const MemoryEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: MemoryCategorySchema,
  content: z.string(),
  tags: z.array(z.string()).default([]),
  source: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  priority: z.number().int().min(0).max(100).default(50),
  status: z.enum(["active", "archived", "superseded"]).default("active"),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

export const GlobalMemorySchema = z.object({
  version: z.number().int().default(1),
  entries: z.array(MemoryEntrySchema).default([]),
  updatedAt: z.string(),
});

export type GlobalMemory = z.infer<typeof GlobalMemorySchema>;

export const ProjectMemorySchema = z.object({
  version: z.number().int().default(1),
  entries: z.array(MemoryEntrySchema).default([]),
  updatedAt: z.string(),
});

export type ProjectMemory = z.infer<typeof ProjectMemorySchema>;

export const MemorySnapshotSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  createdAt: z.string(),
  entries: z.array(MemoryEntrySchema),
  note: z.string().optional(),
});

export type MemorySnapshot = z.infer<typeof MemorySnapshotSchema>;
