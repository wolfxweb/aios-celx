import { readYaml, writeYaml } from "@aios-celx/artifact-manager";
import { stat } from "node:fs/promises";
import { resolveMonorepoRoot } from "@aios-celx/memory-system";
import {
  buildProjectSummary,
  findProjectRecord,
  loadProjectsRegistry,
  projectExists,
} from "@aios-celx/project-manager";
import type { Portfolio, PortfolioDocument, PortfolioSummary, ProjectSummary } from "@aios-celx/shared";
import {
  PortfolioBodySchema,
  PortfolioDocumentSchema,
  PortfolioSummarySchema,
} from "@aios-celx/shared";
import { appendPortfolioLog } from "./logs.js";
import { portfolioYamlPath } from "./paths.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function emptyPortfolioDocument(): PortfolioDocument {
  const t = nowIso();
  return {
    version: 1,
    updatedAt: t,
    portfolio: PortfolioBodySchema.parse({
      id: "default",
      name: "Default portfolio",
      description: "Executive view over managed projects (Bloco 5.3).",
      projects: [],
      priorities: [],
      groups: {},
      tags: [],
    }),
  };
}

export async function loadPortfolioDocument(monorepoRoot: string): Promise<PortfolioDocument> {
  const path = portfolioYamlPath(monorepoRoot);
  try {
    const raw = await readYaml<unknown>(path);
    return PortfolioDocumentSchema.parse(raw);
  } catch {
    return emptyPortfolioDocument();
  }
}

export async function savePortfolioDocument(monorepoRoot: string, doc: PortfolioDocument): Promise<void> {
  const parsed = PortfolioDocumentSchema.parse(doc);
  parsed.updatedAt = nowIso();
  await writeYaml(portfolioYamlPath(monorepoRoot), parsed);
}

function stripProject(body: Portfolio, projectId: string): Portfolio {
  const projects = body.projects.filter((id) => id !== projectId);
  const priorities = body.priorities.filter((id) => id !== projectId);
  const groups: Record<string, string[]> = {};
  for (const [k, ids] of Object.entries(body.groups)) {
    const next = ids.filter((id) => id !== projectId);
    if (next.length > 0) {
      groups[k] = next;
    }
  }
  return { ...body, projects, priorities, groups };
}

export async function initPortfolioDocument(
  monorepoRoot?: string,
  options?: { force?: boolean },
): Promise<PortfolioDocument> {
  const root = monorepoRoot ?? resolveMonorepoRoot();
  const path = portfolioYamlPath(root);
  let exists = false;
  try {
    await stat(path);
    exists = true;
  } catch {
    exists = false;
  }
  if (exists && !options?.force) {
    const doc = await loadPortfolioDocument(root);
    await appendPortfolioLog(root, { type: "portfolio.init.noop", portfolioId: doc.portfolio.id });
    return doc;
  }
  const doc = emptyPortfolioDocument();
  await savePortfolioDocument(root, doc);
  await appendPortfolioLog(root, {
    type: "portfolio.init",
    portfolioId: doc.portfolio.id,
    force: Boolean(options?.force),
  });
  return doc;
}

export async function addProjectToPortfolio(
  projectsRoot: string,
  projectId: string,
  monorepoRoot?: string,
): Promise<void> {
  const root = monorepoRoot ?? resolveMonorepoRoot();
  const reg = await loadProjectsRegistry(root);
  const inRegistry = Boolean(findProjectRecord(reg, projectId));
  if (!inRegistry && !(await projectExists(projectsRoot, projectId))) {
    throw new Error(`Unknown project: ${projectId} (not in registry or on disk)`);
  }
  const doc = await loadPortfolioDocument(root);
  if (doc.portfolio.projects.includes(projectId)) {
    return;
  }
  doc.portfolio.projects.push(projectId);
  await savePortfolioDocument(root, doc);
  await appendPortfolioLog(root, { type: "portfolio.add-project", projectId });
}

export async function removeProjectFromPortfolio(projectId: string, monorepoRoot?: string): Promise<boolean> {
  const root = monorepoRoot ?? resolveMonorepoRoot();
  const doc = await loadPortfolioDocument(root);
  if (!doc.portfolio.projects.includes(projectId)) {
    return false;
  }
  doc.portfolio = stripProject(doc.portfolio, projectId);
  await savePortfolioDocument(root, doc);
  await appendPortfolioLog(root, { type: "portfolio.remove-project", projectId });
  return true;
}

export function listPortfolioProjectIds(doc: PortfolioDocument): string[] {
  return [...doc.portfolio.projects];
}

export type PortfolioProjectSnapshot = {
  projectId: string;
  summary: ProjectSummary | null;
};

/**
 * Aggregates registry-backed `ProjectSummary` rows only — no raw memory / artifact reads beyond summaries.
 */
export async function buildPortfolioExecutiveSummary(
  monorepoRoot: string,
  projectsRoot: string,
): Promise<{ document: PortfolioDocument; summary: PortfolioSummary; projects: PortfolioProjectSnapshot[] }> {
  const doc = await loadPortfolioDocument(monorepoRoot);
  const projects: PortfolioProjectSnapshot[] = [];
  for (const id of doc.portfolio.projects) {
    const summary = await buildProjectSummary(monorepoRoot, projectsRoot, id);
    projects.push({ projectId: id, summary });
  }

  let activeCount = 0;
  let blockedCount = 0;
  let archivedOrPausedCount = 0;
  const stageDistribution: Record<string, number> = {};

  for (const { summary } of projects) {
    if (!summary?.physical) {
      continue;
    }
    const st = summary.state;
    const rec = summary.record;
    if (st?.blocked) {
      blockedCount++;
    }
    if (rec.status === "archived" || rec.status === "paused") {
      archivedOrPausedCount++;
    } else if (rec.status === "active" && !st?.blocked) {
      activeCount++;
    }
    const stage = st?.stage ?? "unknown";
    stageDistribution[stage] = (stageDistribution[stage] ?? 0) + 1;
  }

  const recentlyUpdated = projects
    .filter((p) => p.summary?.physical)
    .map((p) => ({
      projectId: p.projectId,
      lastUpdated: p.summary!.lastUpdated,
      stage: p.summary!.state?.stage,
    }))
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 10);

  const priorityProjectIds = doc.portfolio.priorities.filter((id) => doc.portfolio.projects.includes(id));

  const summary = PortfolioSummarySchema.parse({
    portfolioId: doc.portfolio.id,
    portfolioName: doc.portfolio.name,
    totalProjects: doc.portfolio.projects.length,
    activeCount,
    blockedCount,
    archivedOrPausedCount,
    stageDistribution,
    priorityProjectIds,
    recentlyUpdated,
  });

  return { document: doc, summary, projects };
}
