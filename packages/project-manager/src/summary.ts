import { loadStories, loadTasks } from "@aios-celx/backlog-manager";
import { createGitService, hasLocalGitRepository } from "@aios-celx/git-integration";
import { loadProjectMemory, projectMemoryFile } from "@aios-celx/memory-system";
import type { ProjectSummary } from "@aios-celx/shared";
import { ProjectSummarySchema } from "@aios-celx/shared";
import { readState } from "@aios-celx/state-manager";
import { stat } from "node:fs/promises";
import {
  loadProjectConfig,
  projectExists,
  projectPath,
} from "./project-core.js";
import {
  findProjectRecord,
  loadProjectsRegistry,
  projectRecordFromConfig,
} from "./registry.js";

function maxIso(...dates: string[]): string {
  return dates.reduce((a, b) => (a > b ? a : b));
}

export async function buildProjectSummary(
  monorepoRoot: string,
  projectsRoot: string,
  projectId: string,
): Promise<ProjectSummary | null> {
  const reg = await loadProjectsRegistry(monorepoRoot);
  const recordFromReg = findProjectRecord(reg, projectId);
  const onDisk = await projectExists(projectsRoot, projectId);

  if (!onDisk && !recordFromReg) {
    return null;
  }

  if (!onDisk && recordFromReg) {
    const raw = {
      record: recordFromReg,
      physical: false,
      configPresent: false,
      state: null,
      backlog: null,
      memory: { entryCount: 0, present: false },
      git: { present: false },
      lastUpdated: recordFromReg.updatedAt,
    };
    return ProjectSummarySchema.parse(raw);
  }

  const projectRoot = projectPath(projectsRoot, projectId);
  let record = recordFromReg;
  const config = await loadProjectConfig(projectsRoot, projectId);
  if (!record) {
    record = projectRecordFromConfig(projectId, config);
  }

  const physical = true;

  let state = null;
  try {
    state = await readState(projectsRoot, projectId);
  } catch {
    state = null;
  }

  let backlog: ProjectSummary["backlog"] = null;
  try {
    const [storiesDoc, tasksDoc] = await Promise.all([
      loadStories(projectRoot),
      loadTasks(projectRoot),
    ]);
    const tasksByStatus: Record<string, number> = {};
    for (const t of tasksDoc.tasks) {
      const s = String(t.status);
      tasksByStatus[s] = (tasksByStatus[s] ?? 0) + 1;
    }
    backlog = {
      storyCount: storiesDoc.stories.length,
      taskCount: tasksDoc.tasks.length,
      tasksByStatus,
    };
  } catch {
    backlog = null;
  }

  let memPresent = false;
  let entryCount = 0;
  try {
    await stat(projectMemoryFile(projectRoot));
    memPresent = true;
    const m = await loadProjectMemory(projectsRoot, projectId);
    entryCount = m.entries.length;
  } catch {
    memPresent = false;
  }

  let git: ProjectSummary["git"] = { present: false };
  if (await hasLocalGitRepository(projectRoot)) {
    try {
      const gitSvc = createGitService(projectRoot);
      const st = await gitSvc.status();
      git = {
        present: true,
        branch: st.current ?? undefined,
        clean: st.isClean,
      };
    } catch {
      git = { present: true };
    }
  }

  const lastUpdated = maxIso(
    record.updatedAt,
    state?.updatedAt ?? record.createdAt,
    config.createdAt,
  );

  const raw = {
    record,
    physical,
    configPresent: true,
    state,
    backlog,
    memory: { entryCount, present: memPresent },
    git,
    lastUpdated,
  };

  return ProjectSummarySchema.parse(raw);
}
