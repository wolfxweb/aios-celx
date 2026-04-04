import { ensureDir, writeMarkdown } from "@aios-celx/artifact-manager";
import { resolveAgentContext } from "@aios-celx/context-resolver";
import { runClaudeCodePrompt, runCliProcess, runCodexPrompt } from "@aios-celx/engine-adapters";
import {
  findTaskById,
  loadStories,
  loadTasks,
  saveTasks,
  syncStoryStatusFromTasks,
  updateTaskStatus,
} from "@aios-celx/backlog-manager";
import { createGitService, hasLocalGitRepository } from "@aios-celx/git-integration";
import { loadProjectConfig } from "@aios-celx/project-manager";
import { readState, updateState } from "@aios-celx/state-manager";
import { loadWorkflowForConfig } from "@aios-celx/workflow-engine";
import { join } from "node:path";
import { appendExecutionLogLine } from "./project-logs.js";

export type EngineerTaskResult = {
  ok: boolean;
  taskId: string;
  reportPath: string;
  message: string;
  gitBranch?: string;
};

function safePathSegment(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function uniqueSorted(items: string[]): string[] {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

async function readGitStatusLines(projectRoot: string): Promise<string[]> {
  const result = await runCliProcess("git", ["status", "--porcelain"], {
    cwd: projectRoot,
    timeoutMs: 10000,
  });
  if (!result.ok && !result.stdout.trim()) {
    return [];
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter(Boolean);
}

function parseChangedPaths(statusLines: string[]): string[] {
  return uniqueSorted(
    statusLines
      .map((line) => line.slice(3).trim())
      .filter(Boolean),
  );
}

function buildRealTaskPrompt(options: {
  projectId: string;
  task: {
    id: string;
    storyId: string;
    title: string;
    description?: string;
    type?: string;
    files?: string[];
    acceptanceCriteria?: string[];
    notes?: string;
  };
  architectureText: string;
  apiContractsText: string;
  taskYamlPreview: string;
  storyTitle?: string;
}): string {
  const { projectId, task, architectureText, apiContractsText, taskYamlPreview, storyTitle } = options;
  return `You are implementing one backlog task inside the local project "${projectId}".

Task ID: ${task.id}
Story ID: ${task.storyId}
Story title: ${storyTitle ?? "n/a"}
Task title: ${task.title}
Task type: ${task.type ?? "not set"}

Description:
${task.description ?? "(none)"}

Target files:
${(task.files ?? []).map((file) => `- ${file}`).join("\n") || "- none listed"}

Acceptance criteria:
${(task.acceptanceCriteria ?? []).map((item) => `- ${item}`).join("\n") || "- none listed"}

Notes:
${task.notes ?? "(none)"}

Architecture excerpt:
\`\`\`
${architectureText.split("\n").slice(0, 80).join("\n")}
\`\`\`

API/contracts excerpt:
\`\`\`
${apiContractsText.split("\n").slice(0, 80).join("\n")}
\`\`\`

Backlog excerpt:
\`\`\`yaml
${taskYamlPreview}
\`\`\`

Instructions:
- Make real file edits in this project to complete only this task.
- Update or add tests if the task implies behavior changes.
- Keep changes scoped and production-oriented.
- Do not edit backlog YAML yourself.
- When finished, output a concise summary of what changed and which files were touched.`;
}

async function runRealEngineerTask(options: {
  engineId: "codex" | "claude-code";
  projectRoot: string;
  projectId: string;
  task: {
    id: string;
    storyId: string;
    title: string;
    description?: string;
    type?: string;
    files?: string[];
    acceptanceCriteria?: string[];
    notes?: string;
  };
  architectureText: string;
  apiContractsText: string;
  taskYamlPreview: string;
  storyTitle?: string;
  gitBranch?: string;
}): Promise<{ ok: boolean; message: string; changedFiles: string[]; cliOutput: string; reportBody: string }> {
  const prompt = buildRealTaskPrompt({
    projectId: options.projectId,
    task: options.task,
    architectureText: options.architectureText,
    apiContractsText: options.apiContractsText,
    taskYamlPreview: options.taskYamlPreview,
    storyTitle: options.storyTitle,
  });

  const beforeGitStatus = (await hasLocalGitRepository(options.projectRoot))
    ? await readGitStatusLines(options.projectRoot)
    : [];

  const cliResult =
    options.engineId === "codex"
      ? await runCodexPrompt(prompt, options.projectRoot)
      : await runClaudeCodePrompt(prompt, options.projectRoot);

  const afterGitStatus = (await hasLocalGitRepository(options.projectRoot))
    ? await readGitStatusLines(options.projectRoot)
    : [];
  const changedFiles = parseChangedPaths(afterGitStatus).filter((file) => !beforeGitStatus.some((line) => line.endsWith(file)));

  const touchedFiles = changedFiles.length > 0 ? changedFiles : (options.task.files ?? []);
  const ok = cliResult.ok && touchedFiles.length > 0;
  const message = ok
    ? `Task ${options.task.id} executed with ${options.engineId}; ${touchedFiles.length} file(s) touched.`
    : cliResult.ok
      ? `Engine ${options.engineId} finished but no file changes were detected for task ${options.task.id}.`
      : cliResult.message;

  const reportBody = `# Implementation report — ${options.task.id}

## Engine

- Engine: \`${options.engineId}\`
- Git branch: ${options.gitBranch ?? "(not created)"}
- Result: ${ok ? "success" : "failed"}

## Task

- ID: ${options.task.id}
- Story: ${options.task.storyId}
- Title: ${options.task.title}

## Files touched

${touchedFiles.map((file) => `- \`${file}\``).join("\n") || "- none detected"}

## Engine output

\`\`\`
${cliResult.combined.slice(0, 12000) || "(no output captured)"}
\`\`\`

---
Generated by AIOS real engine runner at ${new Date().toISOString()}
`;

  return {
    ok,
    message,
    changedFiles: touchedFiles,
    cliOutput: cliResult.combined,
    reportBody,
  };
}

export async function runEngineerTask(options: {
  projectsRoot: string;
  projectId: string;
  taskId: string;
}): Promise<EngineerTaskResult> {
  const { projectsRoot, projectId, taskId } = options;
  const projectRoot = join(projectsRoot, projectId);

  const config = await loadProjectConfig(projectsRoot, projectId);
  let tasksDoc = await loadTasks(projectRoot);
  const task = findTaskById(tasksDoc, taskId);
  if (!task) {
    return {
      ok: false,
      taskId,
      reportPath: "",
      message: `Task not found: ${taskId}`,
    };
  }

  const safeFileEarly = safePathSegment(taskId);
  const relReportEarly = `docs/execution/${safeFileEarly}-implementation.md`;
  if (task.status === "done") {
    await appendExecutionLogLine(projectRoot, {
      type: "engineer.task.skipped",
      projectId,
      taskId,
      reason: "already_done",
    });
    return {
      ok: true,
      taskId,
      reportPath: relReportEarly,
      message: `Task ${taskId} is already done; engineer skipped.`,
    };
  }

  await appendExecutionLogLine(projectRoot, {
    type: "engineer.task.start",
    projectId,
    taskId,
  });

  tasksDoc = updateTaskStatus(tasksDoc, taskId, "in_progress");
  await saveTasks(projectRoot, tasksDoc);

  await updateState(projectsRoot, projectId, {
    currentTaskId: taskId,
    activeStoryId: task.storyId,
    lastExecutionType: "engineer-task",
  });

  let gitBranch: string | undefined;
  if (config.git?.enabled && (await hasLocalGitRepository(projectRoot))) {
    const git = createGitService(projectRoot);
    const branchName = `aios/task/${safePathSegment(taskId)}`;
    try {
      await git.createBranch(branchName, projectId);
      gitBranch = branchName;
    } catch {
      await git.checkout(branchName, projectId);
      gitBranch = branchName;
    }
    await appendExecutionLogLine(projectRoot, {
      type: "engineer.task.git-branch",
      projectId,
      taskId,
      branch: branchName,
    });
  }

  const state = await readState(projectsRoot, projectId);
  const workflow = await loadWorkflowForConfig(config);
  const resolved = await resolveAgentContext({
    projectsRoot,
    projectId,
    agentId: "engineer",
    taskId,
    storyId: task.storyId,
    state,
    workflow,
    fallbackReadPaths: [],
  });

  const archText = resolved.files["docs/architecture.md"] ?? "(missing)";
  const apiText = resolved.files["docs/api-contracts.md"] ?? "(missing)";
  const storiesDoc = await loadStories(projectRoot);

  tasksDoc = await loadTasks(projectRoot);
  const tasksYamlPreview = JSON.stringify(tasksDoc, null, 2).slice(0, 6000);
  const story = storiesDoc.stories.find((s) => s.id === task.storyId);

  const safeFile = safePathSegment(taskId);
  const relReport = `docs/execution/${safeFile}-implementation.md`;
  await ensureDir(join(projectRoot, "docs", "execution"));

  const selectedEngine = config.engines?.engineer ?? config.engines?.default ?? "mock-engine";
  if (selectedEngine === "codex" || selectedEngine === "claude-code") {
    const realResult = await runRealEngineerTask({
      engineId: selectedEngine,
      projectRoot,
      projectId,
      task,
      architectureText: archText,
      apiContractsText: apiText,
      taskYamlPreview: tasksYamlPreview,
      storyTitle: story?.title,
      gitBranch,
    });

    await writeMarkdown(join(projectRoot, relReport), realResult.reportBody);

    if (!realResult.ok) {
      tasksDoc = updateTaskStatus(await loadTasks(projectRoot), taskId, "todo");
      await saveTasks(projectRoot, tasksDoc);
      await appendExecutionLogLine(projectRoot, {
        type: "engineer.task.failed",
        projectId,
        taskId,
        report: relReport,
      });
      return {
        ok: false,
        taskId,
        reportPath: relReport,
        message: realResult.message,
        gitBranch,
      };
    }

    tasksDoc = updateTaskStatus(await loadTasks(projectRoot), taskId, "done");
    await saveTasks(projectRoot, tasksDoc);
    await syncStoryStatusFromTasks(projectRoot, task.storyId);

    await appendExecutionLogLine(projectRoot, {
      type: "engineer.task.done",
      projectId,
      taskId,
      report: relReport,
    });

    return {
      ok: true,
      taskId,
      reportPath: relReport,
      message: realResult.message,
      gitBranch,
    };
  }

  const body = `# Implementation report — ${taskId}

## Task

| Field | Value |
|-------|--------|
| **ID** | ${task.id} |
| **Story** | ${task.storyId} |
| **Title** | ${task.title} |
| **Type** | ${task.type ?? "(not set)"} |
| **Status** | done (after mock run) |

### Description

${task.description ?? "(none)"}

### Target files (from task)

${(task.files ?? []).map((f) => `- \`${f}\``).join("\n") || "- _(none listed)_"}

### Acceptance criteria

${(task.acceptanceCriteria ?? []).map((c) => `- ${c}`).join("\n") || "- _(none)_"}

### Notes

${task.notes ?? "(none)"}

## Context read

- **Story** (${task.storyId}): ${story?.title ?? "n/a"}
- **Architecture** (\`docs/architecture.md\`): excerpt below
- **API contracts** (\`docs/api-contracts.md\`): excerpt below
- **Backlog tasks** (\`backlog/tasks.yaml\`): snapshot excerpt

### Architecture excerpt

\`\`\`
${archText.split("\n").slice(0, 40).join("\n")}
\`\`\`

### API contracts excerpt

\`\`\`
${apiText.split("\n").slice(0, 40).join("\n")}
\`\`\`

### Tasks YAML excerpt

\`\`\`json
${tasksYamlPreview}
\`\`\`

## Implementation plan (mock)

1. Align code paths with \`files\` and architecture boundaries.
2. Add or adjust tests under \`tests/\` when the task implies behaviour changes.
3. Keep changes isolated to project \`${projectId}\`.

## Actions performed (mock)

- Marked task **in_progress** then **done** in \`backlog/tasks.yaml\`.
- Updated project state: \`currentTaskId\`, \`activeStoryId\`, \`lastExecutionType: engineer-task\`.
${gitBranch ? `- Checked out Git branch **${gitBranch}**.` : "- Git branch skipped (disabled or no local \`.git\`)."}

## Limitations

- No LLM or real code edits in Bloco 4.2 — this report is deterministic mock output.

## Next steps

- Run tests and manual verification for files listed in the task.
- Open a Git commit via \`aios git:commit\` when ready.

---
_Generated by **engineer task runner** (mock) at ${new Date().toISOString()}_
`;

  await writeMarkdown(join(projectRoot, relReport), body);

  tasksDoc = updateTaskStatus(await loadTasks(projectRoot), taskId, "done");
  await saveTasks(projectRoot, tasksDoc);
  await syncStoryStatusFromTasks(projectRoot, task.storyId);

  await appendExecutionLogLine(projectRoot, {
    type: "engineer.task.done",
    projectId,
    taskId,
    report: relReport,
  });

  return {
    ok: true,
    taskId,
    reportPath: relReport,
    message: `Wrote ${relReport}; task marked done.`,
    gitBranch,
  };
}
