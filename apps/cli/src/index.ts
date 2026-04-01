#!/usr/bin/env node
import {
  canRunWithoutCurrentAgentMatch,
  executeAgentWithEngine,
  executeQueueItem,
  resolveExecutionConfig,
  runEngineerTask,
  runQaTask,
  runStoryExecution,
} from "@aios-celx/agent-runtime";
import { describeExecutionConfig } from "@aios-celx/engine-adapters";
import {
  claimNextQueueItem,
  enqueue,
  listQueueItems,
  listQueueItemsByStatus,
  peekNextEligibleItem,
  markQueueItemDone,
  markQueueItemFailed,
  QueueItemStatusSchema,
  QueueItemTypeSchema,
} from "@aios-celx/execution-queue";
import { evaluateAutonomyForSchedulerStep, setAutonomyEnabled } from "@aios-celx/autonomy-control";
import { runScheduler, SchedulerRunModeSchema } from "@aios-celx/scheduler";
import { resolveMonorepoRoot } from "@aios-celx/memory-system";
import {
  addProjectToPortfolio,
  buildPortfolioExecutiveSummary,
  initPortfolioDocument,
  removeProjectFromPortfolio,
} from "@aios-celx/portfolio";
import { DEFAULT_BLUEPRINT_ID } from "@aios-celx/blueprints";
import {
  buildProjectSummary,
  createProject,
  listProjectRecords,
  loadProjectConfig,
  loadProjectsRegistry,
  projectExists,
  projectPath,
  syncProjectsRegistry,
} from "@aios-celx/project-manager";
import { readState, writeState } from "@aios-celx/state-manager";
import {
  createGitService,
  resolvePrefixedBranchName,
} from "@aios-celx/git-integration";
import {
  advanceAfterGateApproval,
  evaluateGate,
  getActiveStep,
  getNextStep,
  loadWorkflowForConfig,
  resolveNextAction,
  syncStateToActiveStep,
} from "@aios-celx/workflow-engine";
import type { ProjectConfig } from "@aios-celx/shared";
import { mergeAutonomyPolicy } from "@aios-celx/shared";
import {
  addGlobalMemoryEntry,
  addProjectMemoryEntry,
  createProjectMemorySnapshot,
  loadGlobalMemory,
  loadProjectMemory,
  MemoryCategorySchema,
} from "@aios-celx/memory-system";
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const cliPackageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
const cliVersion = (JSON.parse(readFileSync(cliPackageJsonPath, "utf-8")) as { version: string })
  .version;

function assertGitEnabled(config: ProjectConfig): void {
  if (!config.git?.enabled) {
    throw new Error(
      "Git is disabled for this project. Set `git.enabled: true` in .aios/config.yaml",
    );
  }
}

function resolveProjectsRoot(): string {
  const fromEnv = process.env.AIOS_PROJECTS_ROOT;
  if (fromEnv && fromEnv.length > 0) {
    return isAbsolute(fromEnv) ? fromEnv : join(process.cwd(), fromEnv);
  }
  const monorepoRoot = resolveMonorepoRoot(process.cwd());
  return join(monorepoRoot, "projects");
}

const program = new Command();

program
  .name("aios")
  .description("aios-celx — agent orchestration CLI (fases 1–6)")
  .version(cliVersion);

program
  .command("project:create")
  .description("Create a new managed project under projects/")
  .argument("<projectId>", "Project identifier (directory name)")
  .option(
    "--blueprint <id>",
    `Blueprint id (default: ${DEFAULT_BLUEPRINT_ID})`,
    DEFAULT_BLUEPRINT_ID,
  )
  .action(async (projectId: string, opts: { blueprint: string }) => {
    const root = resolveProjectsRoot();
    await createProject({ projectsRoot: root, projectId, blueprintId: opts.blueprint });
    console.log(`Created project "${projectId}" at ${join(root, projectId)} (blueprint: ${opts.blueprint})`);
  });

program
  .command("project:list")
  .description("List projects from the registry (syncs from disk once if registry is empty)")
  .option("--status <status>", "Filter: active | archived | paused")
  .option("--blueprint <id>", "Filter by blueprint id")
  .option("--tag <tag>", "Filter by tag (exact match)")
  .option("--json", "Print registry records as JSON", false)
  .action(
    async (opts: { status?: string; blueprint?: string; tag?: string; json?: boolean }) => {
      const root = resolveProjectsRoot();
      const mono = resolveMonorepoRoot(dirname(root));
      let reg = await loadProjectsRegistry(mono);
      if (reg.projects.length === 0) {
        await syncProjectsRegistry({ monorepoRoot: mono, projectsRoot: root });
        reg = await loadProjectsRegistry(mono);
      }
      const filters: {
        status?: "active" | "archived" | "paused";
        blueprint?: string;
        tag?: string;
      } = {};
      if (opts.status) {
        if (!["active", "archived", "paused"].includes(opts.status)) {
          console.error("--status must be active, archived, or paused");
          process.exitCode = 1;
          return;
        }
        filters.status = opts.status as "active" | "archived" | "paused";
      }
      if (opts.blueprint) {
        filters.blueprint = opts.blueprint;
      }
      if (opts.tag) {
        filters.tag = opts.tag;
      }
      const records = await listProjectRecords(root, filters, mono);
      if (opts.json) {
        console.log(JSON.stringify(records, null, 2));
        return;
      }
      if (records.length === 0) {
        console.log("No projects match.");
        return;
      }
      for (const r of records) {
        console.log(r.id);
      }
    },
  );

program
  .command("project:show")
  .description("Consolidated status: state, backlog, memory, Git (JSON)")
  .requiredOption("--project <projectId>", "Project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    const mono = resolveMonorepoRoot(dirname(root));
    const summary = await buildProjectSummary(mono, root, opts.project);
    if (!summary) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(summary, null, 2));
  });

program
  .command("project:sync")
  .description("Align projects-registry.yaml with folders under projects/")
  .option("--prune", "Remove registry entries whose project directory is missing", false)
  .action(async (opts: { prune?: boolean }) => {
    const root = resolveProjectsRoot();
    const mono = resolveMonorepoRoot(dirname(root));
    const result = await syncProjectsRegistry({
      monorepoRoot: mono,
      projectsRoot: root,
      prune: Boolean(opts.prune),
    });
    console.log(JSON.stringify({ ok: true, monorepoRoot: mono, ...result }, null, 2));
  });

program
  .command("portfolio:init")
  .description("Create .aios/portfolio.yaml if missing (default portfolio shell)")
  .option("--force", "Overwrite existing portfolio.yaml with a fresh default", false)
  .action(async (opts: { force?: boolean }) => {
    const root = resolveProjectsRoot();
    const mono = resolveMonorepoRoot(dirname(root));
    const doc = await initPortfolioDocument(mono, { force: Boolean(opts.force) });
    console.log(JSON.stringify({ ok: true, portfolio: doc.portfolio }, null, 2));
  });

program
  .command("portfolio:show")
  .description("Executive aggregate over portfolio projects (uses project summaries only)")
  .action(async () => {
    const root = resolveProjectsRoot();
    const mono = resolveMonorepoRoot(dirname(root));
    const out = await buildPortfolioExecutiveSummary(mono, root);
    console.log(
      JSON.stringify(
        {
          portfolio: out.document.portfolio,
          aggregate: out.summary,
          projects: out.projects.map((p) => ({
            projectId: p.projectId,
            lastUpdated: p.summary?.lastUpdated,
            stage: p.summary?.state?.stage,
            blocked: p.summary?.state?.blocked,
            registryStatus: p.summary?.record.status,
            backlogTasks: p.summary?.backlog?.taskCount,
          })),
        },
        null,
        2,
      ),
    );
  });

program
  .command("portfolio:add-project")
  .description("Add a project id to the portfolio list")
  .requiredOption("--project <projectId>", "Managed project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    const mono = resolveMonorepoRoot(dirname(root));
    await addProjectToPortfolio(root, opts.project, mono);
    console.log(JSON.stringify({ ok: true, projectId: opts.project }, null, 2));
  });

program
  .command("portfolio:remove-project")
  .description("Remove a project id from portfolio, priorities, and groups")
  .requiredOption("--project <projectId>", "Managed project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    const mono = resolveMonorepoRoot(dirname(root));
    const removed = await removeProjectFromPortfolio(opts.project, mono);
    console.log(JSON.stringify({ ok: true, removed }, null, 2));
  });

program
  .command("status")
  .description("Show config and state for a project")
  .requiredOption("--project <projectId>", "Project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const [config, state] = await Promise.all([
      loadProjectConfig(root, opts.project),
      readState(root, opts.project),
    ]);
    console.log(JSON.stringify({ config, state }, null, 2));
  });

program
  .command("next")
  .description("Resolve workflow: steps, gates, engine routing, inputs/outputs, optional state sync")
  .requiredOption("--project <projectId>", "Project id")
  .option("--sync", "Write state aligned to the active workflow step", false)
  .action(async (opts: { project: string; sync?: boolean }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const [state0, projectConfig] = await Promise.all([
      readState(root, opts.project),
      loadProjectConfig(root, opts.project),
    ]);
    const workflow = await loadWorkflowForConfig(projectConfig);
    let state = state0;
    const projRoot = projectPath(root, opts.project);

    if (opts.sync) {
      const synced = syncStateToActiveStep(workflow, state);
      if (synced.updatedAt !== state.updatedAt) {
        await writeState(root, opts.project, synced);
        state = synced;
      }
    }

    const active = getActiveStep(workflow, state);
    const nextStep = getNextStep(workflow, state);
    const action = await resolveNextAction(projRoot, workflow, state);

    const gatePreview = active
      ? await evaluateGate(projRoot, active.gate, { taskId: state.currentTaskId ?? undefined })
      : null;
    const engine = active
      ? describeExecutionConfig(projectConfig, active.agent)
      : describeExecutionConfig(projectConfig, state.currentAgent);

    const out = {
      workflowId: workflow.id,
      blocked: state.blocked,
      stage: state.stage,
      currentAgent: state.currentAgent,
      nextGate: state.nextGate,
      completedGates: state.completedGates,
      activeStep: active
        ? {
            ...active,
            inputs: active.inputs ?? [],
            outputs: active.outputs ?? [],
          }
        : null,
      nextWorkflowStep: nextStep,
      gateEvaluationPreview: gatePreview,
      engine,
      recommendedAction: action,
    };
    console.log(JSON.stringify(out, null, 2));
  });

program
  .command("run")
  .description("Execute a registered agent via resolved engine (default: mock-engine) and persist artifacts")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--agent <agentId>", "Agent id")
  .action(async (opts: { project: string; agent: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const [state, projectConfig] = await Promise.all([
      readState(root, opts.project),
      loadProjectConfig(root, opts.project),
    ]);
    const workflow = await loadWorkflowForConfig(projectConfig);
    const projRoot = projectPath(root, opts.project);
    const agentId = opts.agent;

    if (!canRunWithoutCurrentAgentMatch(agentId) && agentId !== state.currentAgent) {
      console.error(
        `Agent mismatch: requested ${agentId} but project state expects ${state.currentAgent}.`,
      );
      process.exitCode = 1;
      return;
    }

    const routing = resolveExecutionConfig(projectConfig, agentId);
    const result = await executeAgentWithEngine(
      agentId,
      projRoot,
      opts.project,
      state,
      workflow,
      projectConfig,
    );
    console.log(JSON.stringify({ engine: routing, result }, null, 2));
    if (!result.success) {
      process.exitCode = 1;
    }
  });

program
  .command("approve")
  .description("Approve a gate (requires gate checks to pass) and advance workflow state")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--gate <gateId>", "Gate id")
  .action(async (opts: { project: string; gate: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const projectConfig = await loadProjectConfig(root, opts.project);
    const workflow = await loadWorkflowForConfig(projectConfig);
    const state = await readState(root, opts.project);
    const projRoot = projectPath(root, opts.project);
    const gateId = opts.gate;

    const active = getActiveStep(workflow, state);
    if (!active) {
      console.error("No active workflow step; nothing to approve.");
      process.exitCode = 1;
      return;
    }
    if (gateId !== active.gate) {
      console.error(
        `Gate mismatch: active gate is ${active.gate} but you passed ${gateId}.`,
      );
      process.exitCode = 1;
      return;
    }

    const evaluation = await evaluateGate(projRoot, gateId, {
      taskId: state.currentTaskId ?? undefined,
    });
    if (!evaluation.passed) {
      console.error("Gate checks failed; fix artifacts before approving.");
      console.error(JSON.stringify(evaluation, null, 2));
      process.exitCode = 1;
      return;
    }

    const next = advanceAfterGateApproval(workflow, state, gateId);
    await writeState(root, opts.project, next);
    console.log(JSON.stringify({ approved: gateId, state: next }, null, 2));
  });

program
  .command("git:status")
  .description("Show Git branch, porcelain-style status, and unstaged diff preview (project root only)")
  .requiredOption("--project <projectId>", "Project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const config = await loadProjectConfig(root, opts.project);
    try {
      assertGitEnabled(config);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 1;
      return;
    }
    const projRoot = projectPath(root, opts.project);
    const svc = createGitService(projRoot);
    if (!(await svc.isRepository())) {
      console.error("Not a Git repository. Run: pnpm exec aios git:init --project " + opts.project);
      process.exitCode = 1;
      return;
    }
    const [branch, status, dirty, diff] = await Promise.all([
      svc.getCurrentBranch(),
      svc.status(),
      svc.hasUncommittedChanges(),
      svc.diff(),
    ]);
    console.log(
      JSON.stringify(
        {
          projectRoot: projRoot,
          branch,
          dirty,
          status,
          diffChars: diff.length,
          diffPreview: diff.slice(0, 12_000),
        },
        null,
        2,
      ),
    );
  });

program
  .command("git:init")
  .description("Initialize a Git repository at the project root (local only)")
  .requiredOption("--project <projectId>", "Project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const config = await loadProjectConfig(root, opts.project);
    try {
      assertGitEnabled(config);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 1;
      return;
    }
    const projRoot = projectPath(root, opts.project);
    const svc = createGitService(projRoot);
    if (await svc.isRepository()) {
      console.log(JSON.stringify({ ok: true, message: "Already a Git repository", projectRoot: projRoot }, null, 2));
      return;
    }
    await svc.init(opts.project);
    console.log(JSON.stringify({ ok: true, message: "Git initialized", projectRoot: projRoot }, null, 2));
  });

program
  .command("git:branch:create")
  .description("Create and switch to a new branch (prefix from config unless name contains /)")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--name <branchName>", "Short name (e.g. feature-x) or full ref (e.g. fix/auth)")
  .action(async (opts: { project: string; name: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const config = await loadProjectConfig(root, opts.project);
    try {
      assertGitEnabled(config);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 1;
      return;
    }
    if (!config.git) {
      process.exitCode = 1;
      return;
    }
    const projRoot = projectPath(root, opts.project);
    const svc = createGitService(projRoot);
    if (!(await svc.isRepository())) {
      console.error("Not a Git repository. Run git:init first.");
      process.exitCode = 1;
      return;
    }
    const fullName = resolvePrefixedBranchName(config.git, opts.name);
    await svc.createBranch(fullName, opts.project);
    console.log(JSON.stringify({ ok: true, branch: fullName, projectRoot: projRoot }, null, 2));
  });

program
  .command("git:commit")
  .description("Stage all tracked/untracked files under the project and commit (message prefixed from config)")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--message <text>", "Commit message body (prefix added automatically)")
  .action(async (opts: { project: string; message: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const config = await loadProjectConfig(root, opts.project);
    try {
      assertGitEnabled(config);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 1;
      return;
    }
    if (!config.git) {
      process.exitCode = 1;
      return;
    }
    const projRoot = projectPath(root, opts.project);
    const svc = createGitService(projRoot);
    if (!(await svc.isRepository())) {
      console.error("Not a Git repository. Run git:init first.");
      process.exitCode = 1;
      return;
    }
    const fullMessage = `${config.git.commitPrefix} ${opts.message}`.trim();
    await svc.addAll(opts.project);
    await svc.commit(fullMessage, opts.project);
    console.log(JSON.stringify({ ok: true, message: fullMessage, projectRoot: projRoot }, null, 2));
  });

program
  .command("run:task")
  .description("Engineer agent (mock): execute backlog task, write docs/execution report, update YAML + state, optional Git branch")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--task <taskId>", "Task id from backlog/tasks.yaml (e.g. TASK-1)")
  .option("--enqueue", "Enqueue run-task instead of executing now", false)
  .action(async (opts: { project: string; task: string; enqueue?: boolean }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    if (opts.enqueue) {
      try {
        const item = await enqueue(root, opts.project, {
          type: "run-task",
          payload: { taskId: opts.task },
        });
        console.log(JSON.stringify({ ok: true, enqueued: true, item }, null, 2));
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
      }
      return;
    }
    const result = await runEngineerTask({
      projectsRoot: root,
      projectId: opts.project,
      taskId: opts.task,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

program
  .command("run:qa")
  .description("QA agent (mock): validate task implementation report, write qa/reports, update task + story status")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--task <taskId>", "Task id (engineer report must exist under docs/execution/)")
  .option("--enqueue", "Enqueue run-qa instead of executing now", false)
  .action(async (opts: { project: string; task: string; enqueue?: boolean }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    if (opts.enqueue) {
      try {
        const item = await enqueue(root, opts.project, {
          type: "run-qa",
          payload: { taskId: opts.task },
        });
        console.log(JSON.stringify({ ok: true, enqueued: true, item }, null, 2));
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
      }
      return;
    }
    const result = await runQaTask({
      projectsRoot: root,
      projectId: opts.project,
      taskId: opts.task,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

program
  .command("run:story")
  .description("Run all backlog tasks for a story in order (engineer; optional QA per task)")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--story <storyId>", "Story id from backlog/stories.yaml")
  .option("--with-qa", "Run QA after each task", false)
  .option("--enqueue", "Enqueue run-story instead of executing now", false)
  .action(async (opts: { project: string; story: string; withQa?: boolean; enqueue?: boolean }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    if (opts.enqueue) {
      try {
        const item = await enqueue(root, opts.project, {
          type: "run-story",
          payload: { storyId: opts.story, withQa: Boolean(opts.withQa) },
        });
        console.log(JSON.stringify({ ok: true, enqueued: true, item }, null, 2));
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
      }
      return;
    }
    const result = await runStoryExecution({
      projectsRoot: root,
      projectId: opts.project,
      storyId: opts.story,
      withQa: Boolean(opts.withQa),
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

program
  .command("queue:list")
  .description("List execution queue items for a project (Bloco 6.1)")
  .requiredOption("--project <projectId>", "Project id")
  .option("--status <status>", "Filter by status (pending, ready, running, …)")
  .action(async (opts: { project: string; status?: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    let items;
    if (opts.status) {
      const parsed = QueueItemStatusSchema.safeParse(opts.status);
      if (!parsed.success) {
        console.error(`Invalid status: ${opts.status}`);
        process.exitCode = 1;
        return;
      }
      items = await listQueueItemsByStatus(root, opts.project, parsed.data);
    } else {
      items = await listQueueItems(root, opts.project);
    }
    console.log(JSON.stringify({ projectId: opts.project, items }, null, 2));
  });

program
  .command("queue:add")
  .description("Enqueue an item (types: run-task, run-qa, run-story, …)")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--type <type>", "Queue item type")
  .option("--task <taskId>", "Payload taskId (run-task, run-qa)")
  .option("--story <storyId>", "Payload storyId (run-story)")
  .option("--with-qa", "Payload withQa for run-story", false)
  .option("--priority <n>", "Priority (higher runs first)", "0")
  .option("--depends-on <ids>", "Comma-separated item ids", "")
  .option("--requires-approval", "Item needs approval before becoming ready", false)
  .option("--payload <json>", "Raw JSON payload (merged after task/story flags)")
  .action(
    async (opts: {
      project: string;
      type: string;
      task?: string;
      story?: string;
      withQa?: boolean;
      priority: string;
      dependsOn: string;
      requiresApproval?: boolean;
      payload?: string;
    }) => {
      const root = resolveProjectsRoot();
      if (!(await projectExists(root, opts.project))) {
        console.error(`Unknown project: ${opts.project}`);
        process.exitCode = 1;
        return;
      }
      const typeParsed = QueueItemTypeSchema.safeParse(opts.type);
      if (!typeParsed.success) {
        console.error(`Invalid type: ${opts.type}`);
        process.exitCode = 1;
        return;
      }
      const priority = Number.parseInt(opts.priority, 10);
      if (Number.isNaN(priority)) {
        console.error(`Invalid priority: ${opts.priority}`);
        process.exitCode = 1;
        return;
      }
      const dependsOn = (opts.dependsOn ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload: Record<string, unknown> = {};
      if (opts.task) {
        payload.taskId = opts.task;
      }
      if (opts.story) {
        payload.storyId = opts.story;
      }
      if (typeParsed.data === "run-story") {
        payload.withQa = Boolean(opts.withQa);
      }
      if (opts.payload) {
        try {
          const extra = JSON.parse(opts.payload) as Record<string, unknown>;
          Object.assign(payload, extra);
        } catch {
          console.error("Invalid --payload JSON");
          process.exitCode = 1;
          return;
        }
      }
      try {
        const item = await enqueue(root, opts.project, {
          type: typeParsed.data,
          priority,
          payload,
          dependsOn,
          requiresApproval: Boolean(opts.requiresApproval),
        });
        console.log(JSON.stringify({ ok: true, item }, null, 2));
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
      }
    },
  );

program
  .command("queue:next")
  .description("Show next eligible queue item (peek; promotes pending→ready)")
  .requiredOption("--project <projectId>", "Project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const next = await peekNextEligibleItem(root, opts.project);
    console.log(JSON.stringify({ projectId: opts.project, next }, null, 2));
  });

program
  .command("queue:run-next")
  .description("Claim next eligible item and execute (run-task, run-qa, run-story)")
  .requiredOption("--project <projectId>", "Project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const item = await claimNextQueueItem(root, opts.project);
    if (!item) {
      console.log(JSON.stringify({ ok: true, ran: false, message: "No eligible item" }, null, 2));
      return;
    }
    try {
      const execResult = await executeQueueItem(root, opts.project, item);
      if (execResult.ok) {
        await markQueueItemDone(root, opts.project, item.id);
        console.log(
          JSON.stringify(
            { ok: true, ran: true, itemId: item.id, type: item.type, execution: execResult },
            null,
            2,
          ),
        );
      } else {
        await markQueueItemFailed(
          root,
          opts.project,
          item.id,
          execResult.message ?? "execution returned not ok",
        );
        console.log(
          JSON.stringify(
            { ok: false, ran: true, itemId: item.id, type: item.type, execution: execResult },
            null,
            2,
          ),
        );
        process.exitCode = 1;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markQueueItemFailed(root, opts.project, item.id, msg);
      console.error(msg);
      process.exitCode = 1;
    }
  });

program
  .command("scheduler:run")
  .description("Drain queue: once or loop; respects autonomy policy before each step (Bloco 6.2–6.3)")
  .requiredOption("--project <projectId>", "Project id")
  .option("--mode <mode>", "once | loop", "once")
  .option("--max-steps <n>", "Loop only: max queue items to process")
  .option("--max-duration-ms <n>", "Loop only: wall-clock limit (ms)")
  .option(
    "--max-concurrent <n>",
    "Bloco 6.6: max parallel queue items per batch (1–2); requires independent stories + touchPaths",
  )
  .action(
    async (opts: {
      project: string;
      mode: string;
      maxSteps?: string;
      maxDurationMs?: string;
      maxConcurrent?: string;
    }) => {
      const root = resolveProjectsRoot();
      if (!(await projectExists(root, opts.project))) {
        console.error(`Unknown project: ${opts.project}`);
        process.exitCode = 1;
        return;
      }
      const modeParsed = SchedulerRunModeSchema.safeParse(opts.mode);
      if (!modeParsed.success) {
        console.error(`Invalid mode: ${opts.mode} (use once or loop)`);
        process.exitCode = 1;
        return;
      }
      const maxSteps =
        opts.maxSteps !== undefined && opts.maxSteps !== ""
          ? Number.parseInt(opts.maxSteps, 10)
          : undefined;
      const maxDurationMs =
        opts.maxDurationMs !== undefined && opts.maxDurationMs !== ""
          ? Number.parseInt(opts.maxDurationMs, 10)
          : undefined;
      if (maxSteps !== undefined && (Number.isNaN(maxSteps) || maxSteps < 1)) {
        console.error("Invalid --max-steps");
        process.exitCode = 1;
        return;
      }
      if (maxDurationMs !== undefined && (Number.isNaN(maxDurationMs) || maxDurationMs < 1)) {
        console.error("Invalid --max-duration-ms");
        process.exitCode = 1;
        return;
      }
      const maxConcurrent =
        opts.maxConcurrent !== undefined && opts.maxConcurrent !== ""
          ? Number.parseInt(opts.maxConcurrent, 10)
          : undefined;
      if (maxConcurrent !== undefined && (Number.isNaN(maxConcurrent) || maxConcurrent < 1 || maxConcurrent > 2)) {
        console.error("Invalid --max-concurrent (use 1 or 2)");
        process.exitCode = 1;
        return;
      }
      try {
        const result = await runScheduler({
          projectsRoot: root,
          projectId: opts.project,
          mode: modeParsed.data,
          maxSteps,
          maxDurationMs,
          maxConcurrent,
        });
        console.log(JSON.stringify(result, null, 2));
        const autonomyHardFail = [
          "autonomy_halt_on_failure",
          "autonomy_blocked_task_in_backlog",
          "autonomy_item_type_blocked",
          "autonomy_approval_category_required",
          "autonomy_architecture_decision",
          "autonomy_scope_change",
        ] as const;
        if (
          result.executedFailed > 0 ||
          result.stopReason === "project_blocked" ||
          result.stopReason === "requires_human_approval" ||
          autonomyHardFail.includes(
            result.stopReason as (typeof autonomyHardFail)[number],
          )
        ) {
          process.exitCode = 1;
        }
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
      }
    },
  );

program
  .command("autonomy:show")
  .description("Show merged autonomy policy from project config (Bloco 6.3)")
  .requiredOption("--project <projectId>", "Project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const cfg = await loadProjectConfig(root, opts.project);
    console.log(JSON.stringify({ projectId: opts.project, autonomy: cfg.autonomy }, null, 2));
  });

program
  .command("autonomy:check")
  .description("Evaluate autonomy for the next eligible queue item (dry check)")
  .requiredOption("--project <projectId>", "Project id")
  .option("--as-loop", "Assume scheduler loop mode for this check", false)
  .action(async (opts: { project: string; asLoop?: boolean }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const cfg = await loadProjectConfig(root, opts.project);
    const policy = mergeAutonomyPolicy(cfg.autonomy);
    const state = await readState(root, opts.project);
    const nextItem = await peekNextEligibleItem(root, opts.project);
    const decision = await evaluateAutonomyForSchedulerStep(root, opts.project, {
      policy,
      state,
      mode: opts.asLoop ? "loop" : "once",
      processedThisRun: 0,
      lastStepFailed: false,
      nextItem,
    });
    console.log(JSON.stringify({ projectId: opts.project, nextItem, decision }, null, 2));
  });

program
  .command("autonomy:toggle")
  .description("Enable or disable autonomy for a project (updates .aios/config.yaml)")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--enabled <bool>", "true or false")
  .action(async (opts: { project: string; enabled: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const v = opts.enabled.toLowerCase();
    if (v !== "true" && v !== "false") {
      console.error("--enabled must be true or false");
      process.exitCode = 1;
      return;
    }
    await setAutonomyEnabled(root, opts.project, v === "true");
    const cfg = await loadProjectConfig(root, opts.project);
    console.log(JSON.stringify({ ok: true, projectId: opts.project, autonomy: cfg.autonomy }, null, 2));
  });

program
  .command("memory:global:list")
  .description("List global framework memory (.aios/global-memory.json at monorepo root)")
  .action(async () => {
    const monorepoRoot = resolveMonorepoRoot();
    const doc = await loadGlobalMemory(monorepoRoot);
    console.log(JSON.stringify({ monorepoRoot, ...doc }, null, 2));
  });

program
  .command("memory:global:add")
  .description("Append a global memory entry")
  .requiredOption("--title <text>", "Title")
  .requiredOption("--category <id>", "Category (e.g. coding-standards, product-context)")
  .requiredOption("--content <text>", "Body")
  .option("--tags <csv>", "Comma-separated tags", "")
  .option("--source <text>", "Source label")
  .action(
    async (opts: { title: string; category: string; content: string; tags?: string; source?: string }) => {
      const cat = MemoryCategorySchema.safeParse(opts.category);
      if (!cat.success) {
        console.error("Invalid category. Use one of:", MemoryCategorySchema.options.join(", "));
        process.exitCode = 1;
        return;
      }
      const tags = (opts.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const entry = await addGlobalMemoryEntry({
        title: opts.title,
        category: cat.data,
        content: opts.content,
        tags,
        source: opts.source,
        priority: 50,
        status: "active",
      });
      console.log(JSON.stringify({ ok: true, entry }, null, 2));
    },
  );

program
  .command("memory:project:list")
  .description("List structured memory for a managed project")
  .requiredOption("--project <projectId>", "Project id")
  .action(async (opts: { project: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const doc = await loadProjectMemory(root, opts.project);
    console.log(JSON.stringify(doc, null, 2));
  });

program
  .command("memory:project:add")
  .description("Append a project-scoped memory entry")
  .requiredOption("--project <projectId>", "Project id")
  .requiredOption("--title <text>", "Title")
  .requiredOption("--category <id>", "Category")
  .requiredOption("--content <text>", "Body")
  .option("--tags <csv>", "Comma-separated tags", "")
  .option("--source <text>", "Source label")
  .action(
    async (opts: {
      project: string;
      title: string;
      category: string;
      content: string;
      tags?: string;
      source?: string;
    }) => {
      const root = resolveProjectsRoot();
      if (!(await projectExists(root, opts.project))) {
        console.error(`Unknown project: ${opts.project}`);
        process.exitCode = 1;
        return;
      }
      const cat = MemoryCategorySchema.safeParse(opts.category);
      if (!cat.success) {
        console.error("Invalid category. Use one of:", MemoryCategorySchema.options.join(", "));
        process.exitCode = 1;
        return;
      }
      const tags = (opts.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const entry = await addProjectMemoryEntry(root, opts.project, {
        title: opts.title,
        category: cat.data,
        content: opts.content,
        tags,
        source: opts.source,
        priority: 50,
        status: "active",
      });
      console.log(JSON.stringify({ ok: true, entry }, null, 2));
    },
  );

program
  .command("memory:project:snapshot")
  .description("Write a JSON snapshot of current project memory under .aios/memory/snapshots/")
  .requiredOption("--project <projectId>", "Project id")
  .option("--note <text>", "Optional note stored in snapshot")
  .action(async (opts: { project: string; note?: string }) => {
    const root = resolveProjectsRoot();
    if (!(await projectExists(root, opts.project))) {
      console.error(`Unknown project: ${opts.project}`);
      process.exitCode = 1;
      return;
    }
    const snap = await createProjectMemorySnapshot(root, opts.project, opts.note);
    console.log(JSON.stringify({ ok: true, snapshot: snap }, null, 2));
  });

await program.parseAsync(process.argv);
