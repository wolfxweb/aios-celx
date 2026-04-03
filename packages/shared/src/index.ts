import { z } from "zod";

/** Persisted under `projects/<id>/.aios/state.json` */
export const ProjectStateSchema = z.object({
  projectId: z.string(),
  stage: z.string(),
  currentAgent: z.string(),
  currentTaskId: z.string().nullable(),
  /** Story em foco durante engineer / execução (Bloco 4.2). */
  activeStoryId: z.string().nullable().optional(),
  /** Último tipo de execução (ex.: `engineer-task`). */
  lastExecutionType: z.string().nullable().optional(),
  blocked: z.boolean(),
  requiresHumanApproval: z.boolean(),
  completedGates: z.array(z.string()),
  nextGate: z.string(),
  updatedAt: z.string(),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;

export const GitProjectConfigSchema = z.object({
  enabled: z.boolean(),
  autoInit: z.boolean(),
  defaultBranchPrefix: z.string(),
  commitPrefix: z.string(),
});

export type GitProjectConfig = z.infer<typeof GitProjectConfigSchema>;

// --- Bloco 5.2: registry & project metadata ---

export const ProjectLifecycleStatusSchema = z.enum(["active", "archived", "paused"]);
export type ProjectLifecycleStatus = z.infer<typeof ProjectLifecycleStatusSchema>;

export const ProjectPrioritySchema = z.enum(["low", "medium", "high"]);
export type ProjectPriority = z.infer<typeof ProjectPrioritySchema>;

export const ProjectRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Relative to monorepo root, e.g. `projects/my-app` */
  path: z.string(),
  blueprint: z.string(),
  status: ProjectLifecycleStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  priority: ProjectPrioritySchema,
  tags: z.array(z.string()),
});

export type ProjectRecord = z.infer<typeof ProjectRecordSchema>;

export const ProjectsRegistrySchema = z.object({
  version: z.number().int().default(1),
  updatedAt: z.string(),
  projects: z.array(ProjectRecordSchema),
});

export type ProjectsRegistry = z.infer<typeof ProjectsRegistrySchema>;

export const ProjectWorkspaceSchema = z.object({
  projectId: z.string(),
  monorepoRoot: z.string(),
  projectsRoot: z.string(),
  projectRoot: z.string(),
});

export type ProjectWorkspace = z.infer<typeof ProjectWorkspaceSchema>;

export const ProjectSummarySchema = z.object({
  record: ProjectRecordSchema,
  physical: z.boolean(),
  configPresent: z.boolean(),
  state: ProjectStateSchema.nullable(),
  backlog: z
    .object({
      storyCount: z.number(),
      taskCount: z.number(),
      tasksByStatus: z.record(z.string(), z.number()),
    })
    .nullable(),
  memory: z.object({
    entryCount: z.number(),
    present: z.boolean(),
  }),
  git: z.object({
    present: z.boolean(),
    branch: z.string().optional(),
    clean: z.boolean().optional(),
  }),
  lastUpdated: z.string(),
});

export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

// --- Bloco 5.3: portfolio executivo ---

/** Reference to a managed project (portfolio lists use project ids). */
export type PortfolioProjectRef = string;

export const PortfolioBodySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  projects: z.array(z.string()),
  priorities: z.array(z.string()),
  groups: z.record(z.string(), z.array(z.string())).default({}),
  tags: z.array(z.string()).default([]),
});

export type Portfolio = z.infer<typeof PortfolioBodySchema>;

export const PortfolioDocumentSchema = z.object({
  version: z.number().int().default(1),
  updatedAt: z.string(),
  portfolio: PortfolioBodySchema,
});

export type PortfolioDocument = z.infer<typeof PortfolioDocumentSchema>;

export const PortfolioSummarySchema = z.object({
  portfolioId: z.string(),
  portfolioName: z.string(),
  totalProjects: z.number(),
  activeCount: z.number(),
  blockedCount: z.number(),
  archivedOrPausedCount: z.number(),
  stageDistribution: z.record(z.string(), z.number()),
  priorityProjectIds: z.array(z.string()),
  recentlyUpdated: z.array(
    z.object({
      projectId: z.string(),
      lastUpdated: z.string(),
      stage: z.string().optional(),
    }),
  ),
});

export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;

/** Bloco 6.3 — approval categories referenced by queue item `metadata.approvalCategory`. */
export const ApprovalRequirementSchema = z.enum([
  "architecture",
  "scope-change",
  "delivery-summary",
  "generic",
]);
export type ApprovalRequirement = z.infer<typeof ApprovalRequirementSchema>;

/** Bloco 6.3 — autonomy policy under `projects/<id>/.aios/config.yaml` → `autonomy`. */
export const AutonomyPolicySchema = z.object({
  enabled: z.boolean(),
  autoRunTask: z.boolean(),
  autoRunQA: z.boolean(),
  autoRunStory: z.boolean(),
  allowLoopExecution: z.boolean(),
  maxAutoSteps: z.number().int().positive(),
  haltOnBlockedTask: z.boolean(),
  haltOnApprovalRequired: z.boolean(),
  haltOnArchitectureDecision: z.boolean(),
  haltOnScopeChange: z.boolean(),
  haltOnFailure: z.boolean(),
  requireApprovalFor: z.array(ApprovalRequirementSchema).default([]),
  notes: z.string().optional(),
});

export type AutonomyPolicy = z.infer<typeof AutonomyPolicySchema>;

/** Keys allowed omitted in YAML; normalized config always has full `AutonomyPolicy`. */
export const AutonomyPolicyPartialSchema = AutonomyPolicySchema.partial();
export type AutonomyPolicyPartial = z.infer<typeof AutonomyPolicyPartialSchema>;

export const DEFAULT_AUTONOMY_POLICY: AutonomyPolicy = {
  enabled: true,
  autoRunTask: true,
  autoRunQA: true,
  autoRunStory: false,
  allowLoopExecution: true,
  maxAutoSteps: 10,
  haltOnBlockedTask: true,
  haltOnApprovalRequired: true,
  haltOnArchitectureDecision: true,
  haltOnScopeChange: true,
  haltOnFailure: false,
  requireApprovalFor: [],
  notes: "",
};

export function mergeAutonomyPolicy(partial?: AutonomyPolicyPartial | undefined): AutonomyPolicy {
  return AutonomyPolicySchema.parse({
    ...DEFAULT_AUTONOMY_POLICY,
    ...partial,
    requireApprovalFor: partial?.requireApprovalFor ?? DEFAULT_AUTONOMY_POLICY.requireApprovalFor,
    notes: partial?.notes ?? DEFAULT_AUTONOMY_POLICY.notes,
  });
}

/** Persisted under `projects/<id>/.aios/config.yaml` */
export const ProjectConfigSchema = z.object({
  projectId: z.string(),
  blueprint: z.string(),
  name: z.string().optional(),
  /** Bloco 5.2 — mirrored in projects registry. */
  status: ProjectLifecycleStatusSchema.optional(),
  priority: ProjectPrioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  /** Workflow id (YAML basename without path), e.g. `default-software-delivery`. */
  workflow: z.string().optional(),
  /**
   * Engine routing: must include `default`. Other keys are agent ids → engine id
   * (e.g. `requirements-analyst: mock-engine`).
   */
  engines: z.record(z.string(), z.string()).optional(),
  /** Local Git integration (Bloco 4.1). */
  git: GitProjectConfigSchema.optional(),
  /** Bloco 6.3 — governed automation limits (partial in YAML; merged on load). */
  autonomy: AutonomyPolicyPartialSchema.optional(),
  /**
   * When workflow gate checks pass: `auto` advances state without `aios approve` (default);
   * `manual` requires `aios approve --gate <id>` per gate.
   */
  gateApproval: z.enum(["auto", "manual"]).optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/** Defaults applied after parse when fields are missing (Bloco 3). */
export const DEFAULT_WORKFLOW_ID = "default-software-delivery";
export const DEFAULT_ENGINE_ID = "mock-engine";

export const DEFAULT_GIT_CONFIG: GitProjectConfig = {
  enabled: true,
  autoInit: true,
  defaultBranchPrefix: "aios",
  commitPrefix: "[aios-celx]",
};

export function normalizeProjectConfig(config: ProjectConfig): ProjectConfig {
  const engines = {
    default: config.engines?.default ?? DEFAULT_ENGINE_ID,
    ...config.engines,
  };
  const git: GitProjectConfig = {
    enabled: config.git?.enabled ?? DEFAULT_GIT_CONFIG.enabled,
    autoInit: config.git?.autoInit ?? DEFAULT_GIT_CONFIG.autoInit,
    defaultBranchPrefix: config.git?.defaultBranchPrefix ?? DEFAULT_GIT_CONFIG.defaultBranchPrefix,
    commitPrefix: config.git?.commitPrefix ?? DEFAULT_GIT_CONFIG.commitPrefix,
  };
  return {
    ...config,
    name: config.name ?? config.projectId,
    status: config.status ?? "active",
    priority: config.priority ?? "medium",
    tags: config.tags ?? [],
    workflow: config.workflow ?? DEFAULT_WORKFLOW_ID,
    engines,
    git,
    autonomy: mergeAutonomyPolicy(config.autonomy),
    gateApproval: config.gateApproval ?? "auto",
  };
}

/** Shape of `initialState` inside a blueprint (no `projectId` / `updatedAt`; filled at creation). */
export const BlueprintInitialStateSchema = ProjectStateSchema.omit({
  projectId: true,
  updatedAt: true,
});

export type BlueprintInitialState = z.infer<typeof BlueprintInitialStateSchema>;

export const BlueprintDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  directories: z.array(z.string()),
  /** Relative path from project root → template key (see `@aios-celx/templates`). */
  files: z.record(z.string(), z.string()),
  initialState: BlueprintInitialStateSchema,
  /** Optional extras merged into `ProjectConfig` besides `projectId`, `blueprint`, `createdAt`. */
  initialConfig: ProjectConfigSchema.partial().optional(),
});

export type BlueprintDefinition = z.infer<typeof BlueprintDefinitionSchema>;

// --- Bloco 2: workflow & agents ---

export const WorkflowStepSchema = z.object({
  id: z.string(),
  stage: z.string(),
  agent: z.string(),
  gate: z.string(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  steps: z.array(WorkflowStepSchema),
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

export const AgentDefinitionSchema = z.object({
  id: z.string(),
  description: z.string(),
  reads: z.array(z.string()),
  writes: z.array(z.string()),
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

export const AgentResultSchema = z.object({
  agentId: z.string(),
  success: z.boolean(),
  message: z.string(),
  artifactsWritten: z.array(z.string()),
  errors: z.array(z.string()).optional(),
});

export type AgentResult = z.infer<typeof AgentResultSchema>;

export const GateCheckSchema = z.object({
  id: z.string(),
  passed: z.boolean(),
  detail: z.string(),
});

export type GateCheck = z.infer<typeof GateCheckSchema>;

export const GateResultSchema = z.object({
  gateId: z.string(),
  passed: z.boolean(),
  checks: z.array(GateCheckSchema),
});

export type GateResult = z.infer<typeof GateResultSchema>;

export const NextActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("run-agent"),
    stage: z.string(),
    agentId: z.string(),
    gate: z.string(),
  }),
  z.object({
    type: z.literal("await-approval"),
    stage: z.string(),
    agentId: z.string(),
    gate: z.string(),
  }),
  z.object({
    type: z.literal("workflow-complete"),
    message: z.string(),
  }),
]);

export type NextAction = z.infer<typeof NextActionSchema>;

// --- Bloco 3: engine adapters ---

/** Metadata for a registered engine implementation (for UI / docs). */
export const EngineAdapterSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["mock", "cloud", "ide"]),
  description: z.string().optional(),
});

export type EngineAdapter = z.infer<typeof EngineAdapterSchema>;

export const EngineRunInputSchema = z.object({
  agentId: z.string(),
  projectId: z.string(),
  projectRoot: z.string(),
  state: ProjectStateSchema,
  workflow: WorkflowDefinitionSchema,
  /** Relative path → UTF-8 content (inputs already resolved). */
  contextFiles: z.record(z.string(), z.string()),
  /** Bloco 5.1 — structured memory (JSON-serializable entries). */
  memorySlices: z
    .object({
      global: z.array(z.record(z.string(), z.unknown())),
      project: z.array(z.record(z.string(), z.unknown())),
    })
    .optional(),
});

export type EngineRunInput = z.infer<typeof EngineRunInputSchema>;

export const EngineRunResultSchema = z.object({
  engineId: z.string(),
  ok: z.boolean(),
  agentResult: AgentResultSchema.optional(),
  message: z.string(),
  errorCode: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EngineRunResult = z.infer<typeof EngineRunResultSchema>;

export const AgentExecutionConfigSchema = z.object({
  agentId: z.string(),
  engineId: z.string(),
  usedFallback: z.boolean().optional(),
});

export type AgentExecutionConfig = z.infer<typeof AgentExecutionConfigSchema>;

// --- Bloco 4.2: backlog + engineer task ---

export const TaskStatusSchema = z.enum(["todo", "in_progress", "blocked", "done"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const StoryStatusSchema = z.enum([
  "draft",
  "todo",
  "in_progress",
  "blocked",
  "done",
]);
export type StoryStatus = z.infer<typeof StoryStatusSchema>;

export const EpicSchema = z.object({
  id: z.string(),
  title: z.string(),
  goal: z.string().optional(),
  status: z.string().optional(),
});

export type Epic = z.infer<typeof EpicSchema>;

export const StorySchema = z.object({
  id: z.string(),
  epicId: z.string().optional(),
  title: z.string(),
  acceptance: z.array(z.string()).optional(),
  status: z.union([StoryStatusSchema, z.string()]).optional(),
});

export type Story = z.infer<typeof StorySchema>;

export const TaskSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.union([TaskStatusSchema, z.string()]),
  files: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const EpicsDocumentSchema = z.object({
  epics: z.array(EpicSchema),
});

export const StoriesDocumentSchema = z.object({
  stories: z.array(StorySchema),
});

export const TasksDocumentSchema = z.object({
  tasks: z.array(TaskSchema),
});

export type EpicsDocument = z.infer<typeof EpicsDocumentSchema>;
export type StoriesDocument = z.infer<typeof StoriesDocumentSchema>;
export type TasksDocument = z.infer<typeof TasksDocumentSchema>;

export const ActiveExecutionContextSchema = z.object({
  projectId: z.string(),
  taskId: z.string(),
  storyId: z.string().nullable().optional(),
  executionType: z.literal("engineer-task"),
  startedAt: z.string(),
});

export type ActiveExecutionContext = z.infer<typeof ActiveExecutionContextSchema>;

// --- Bloco 4.3: QA ---

export const QAStatusSchema = z.enum(["approved", "changes_requested", "blocked"]);
export type QAStatus = z.infer<typeof QAStatusSchema>;

export const QAFindingSchema = z.object({
  type: z.string(),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  title: z.string(),
  description: z.string(),
  relatedTaskId: z.string().optional(),
  relatedStoryId: z.string().optional(),
});

export type QAFinding = z.infer<typeof QAFindingSchema>;

export const ValidationSummarySchema = z.object({
  criteriaChecked: z.array(z.string()),
  passedCount: z.number(),
  failedCount: z.number(),
});

export type ValidationSummary = z.infer<typeof ValidationSummarySchema>;

export const QAReportSchema = z.object({
  taskId: z.string(),
  storyId: z.string().optional(),
  status: QAStatusSchema,
  findings: z.array(QAFindingSchema),
  summary: ValidationSummarySchema,
  recommendation: z.string(),
  generatedAt: z.string(),
});

export type QAReport = z.infer<typeof QAReportSchema>;

/** Map QA outcome to backlog task status (Bloco 4.3). */
export function deriveTaskStatusAfterQa(qaStatus: QAStatus): TaskStatus {
  switch (qaStatus) {
    case "approved":
      return "done";
    case "changes_requested":
      return "in_progress";
    case "blocked":
      return "blocked";
    default: {
      const _x: never = qaStatus;
      return _x;
    }
  }
}

/** Derive story status from all tasks belonging to that story (Bloco 4.4). */
export function deriveStoryStatusFromTasks(tasksForStory: Task[]): StoryStatus {
  if (tasksForStory.length === 0) {
    return "draft";
  }
  if (tasksForStory.some((t) => t.status === "blocked")) {
    return "blocked";
  }
  if (tasksForStory.every((t) => t.status === "done")) {
    return "done";
  }
  return "in_progress";
}
