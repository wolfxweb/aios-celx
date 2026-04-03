import { listQueueItems } from "@aios-celx/execution-queue";
import { projectPath } from "@aios-celx/project-manager";
import { getProjectSummary, listProjectIds } from "./projects.js";

type WorkspaceProjectRow = {
  projectId: string;
  status: string;
  stage: string;
  blocked: boolean;
  requiresHumanApproval: boolean;
  currentTaskId: string | null;
  taskCount: number;
  taskTodoCount: number;
  taskInProgressCount: number;
  taskBlockedCount: number;
  taskDoneCount: number;
  queueReadyCount: number;
  queueRunningCount: number;
  updatedAt: string | null;
};

function sortDesc(a: string | null, b: string | null): number {
  return (b ?? "").localeCompare(a ?? "");
}

export async function buildWorkspaceOverview(monorepoRoot: string, projectsRoot: string) {
  const projectIds = await listProjectIds(projectsRoot);
  const rows: WorkspaceProjectRow[] = [];
  const tasksByStatus: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
  };
  const projectsByStage: Record<string, number> = {};
  const queueByStatus: Record<string, number> = {};

  for (const projectId of projectIds) {
    const summary = await getProjectSummary(monorepoRoot, projectsRoot, projectId);
    if (!summary) {
      continue;
    }
    const state = summary.state;
    const backlog = summary.backlog;
    const queueItems = await listQueueItems(projectsRoot, projectId).catch(() => []);
    const taskStatusMap = backlog?.tasksByStatus ?? {};
    for (const [status, count] of Object.entries(taskStatusMap)) {
      tasksByStatus[status] = (tasksByStatus[status] ?? 0) + count;
    }

    const stage = state?.stage ?? "unknown";
    projectsByStage[stage] = (projectsByStage[stage] ?? 0) + 1;

    for (const item of queueItems) {
      const status = String(item.status);
      queueByStatus[status] = (queueByStatus[status] ?? 0) + 1;
    }

    rows.push({
      projectId,
      status: summary.record.status,
      stage,
      blocked: state?.blocked === true,
      requiresHumanApproval: state?.requiresHumanApproval === true,
      currentTaskId: state?.currentTaskId ?? null,
      taskCount: backlog?.taskCount ?? 0,
      taskTodoCount: backlog?.tasksByStatus?.todo ?? 0,
      taskInProgressCount: backlog?.tasksByStatus?.in_progress ?? 0,
      taskBlockedCount: backlog?.tasksByStatus?.blocked ?? 0,
      taskDoneCount: backlog?.tasksByStatus?.done ?? 0,
      queueReadyCount: queueItems.filter((item) => item.status === "ready").length,
      queueRunningCount: queueItems.filter((item) => item.status === "running").length,
      updatedAt: summary.lastUpdated ?? null,
    });
  }

  const activeProjects = rows.filter((row) => row.status === "active");
  const blockedProjects = rows.filter((row) => row.blocked);
  const readyProjects = rows.filter((row) => row.queueReadyCount > 0 && !row.blocked);
  const inDevelopmentProjects = rows.filter(
    (row) => row.taskInProgressCount > 0 || row.queueRunningCount > 0 || row.stage === "implementation",
  );
  const alerts = [
    ...rows
      .filter((row) => row.blocked)
      .map((row) => ({
        level: "high",
        kind: "project_blocked",
        projectId: row.projectId,
        message: `Projeto bloqueado em stage ${row.stage}.`,
      })),
    ...rows
      .filter((row) => row.requiresHumanApproval)
      .map((row) => ({
        level: "medium",
        kind: "approval_required",
        projectId: row.projectId,
        message: "Projeto à espera de aprovação humana.",
      })),
    ...rows
      .filter((row) => row.queueReadyCount === 0 && row.queueRunningCount === 0 && row.status === "active")
      .slice(0, 8)
      .map((row) => ({
        level: "low",
        kind: "idle_project",
        projectId: row.projectId,
        message: "Projeto ativo sem execução em curso nem itens ready.",
      })),
  ];

  const recentlyUpdated = [...rows].sort((a, b) => sortDesc(a.updatedAt, b.updatedAt)).slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    metrics: {
      totalProjects: rows.length,
      activeProjects: activeProjects.length,
      readyProjects: readyProjects.length,
      inDevelopmentProjects: inDevelopmentProjects.length,
      blockedProjects: blockedProjects.length,
      tasksTodo: tasksByStatus.todo ?? 0,
      tasksInProgress: tasksByStatus.in_progress ?? 0,
      tasksBlocked: tasksByStatus.blocked ?? 0,
      tasksDone: tasksByStatus.done ?? 0,
    },
    projectsByStage,
    tasksByStatus,
    queueByStatus,
    projectRows: rows.sort((a, b) => sortDesc(a.updatedAt, b.updatedAt)),
    workingNow: inDevelopmentProjects
      .sort((a, b) => sortDesc(a.updatedAt, b.updatedAt))
      .slice(0, 8),
    readyToAdvance: readyProjects.sort((a, b) => sortDesc(a.updatedAt, b.updatedAt)).slice(0, 8),
    alerts: alerts.slice(0, 12),
    recentlyUpdated,
  };
}
