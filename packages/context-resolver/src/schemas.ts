import { z } from "zod";

export const ContextScopeSchema = z.object({
  projectId: z.string(),
  agentId: z.string(),
  resolvedAt: z.string(),
});

export type ContextScope = z.infer<typeof ContextScopeSchema>;

export const ContextArtifactSchema = z.object({
  path: z.string(),
  role: z.string().optional(),
  present: z.boolean(),
  charCount: z.number().optional(),
});

export type ContextArtifact = z.infer<typeof ContextArtifactSchema>;

export const ContextMemorySliceSchema = z.object({
  globalEntries: z.array(z.record(z.string(), z.unknown())),
  projectEntries: z.array(z.record(z.string(), z.unknown())),
  globalCategoriesUsed: z.array(z.string()),
  projectCategoriesUsed: z.array(z.string()),
});

export type ContextMemorySlice = z.infer<typeof ContextMemorySliceSchema>;

export const ContextRequestSchema = z.object({
  projectsRoot: z.string(),
  projectId: z.string(),
  agentId: z.string(),
  taskId: z.string().optional(),
  storyId: z.string().optional(),
  fallbackReadPaths: z.array(z.string()).optional(),
});

export type ContextRequestInput = z.infer<typeof ContextRequestSchema>;
