import { projectExists } from "@aios-celx/project-manager";
import { SchedulerRunModeSchema } from "@aios-celx/scheduler";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { ApiEnvConfig } from "./config.js";
import * as portfolioSvc from "./services/portfolio.js";
import * as projects from "./services/projects.js";
import * as schedSvc from "./services/scheduler.js";
import { readApiPackageVersion } from "./version.js";

function assertSafeProjectId(projectId: string): boolean {
  return !projectId.includes("..") && !projectId.includes("/") && !projectId.includes("\\");
}

const schedulerBodySchema = z.object({
  mode: SchedulerRunModeSchema.optional().default("once"),
  maxSteps: z.number().int().positive().optional(),
  maxDurationMs: z.number().int().positive().optional(),
  maxConcurrent: z.number().int().min(1).max(2).optional(),
});

export async function buildApp(cfg: ApiEnvConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  const version = readApiPackageVersion();

  app.get("/health", async () => ({
    ok: true,
    service: "aios-celx-api",
    version,
    projectsRoot: cfg.projectsRoot,
    monorepoRoot: cfg.monorepoRoot,
  }));

  app.get("/projects", async () => {
    const projectIds = await projects.listProjectIds(cfg.projectsRoot);
    return { projectIds, projectsRoot: cfg.projectsRoot };
  });

  app.get("/projects/:projectId", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    const data = await projects.getProjectDetail(cfg.monorepoRoot, cfg.projectsRoot, projectId);
    if (!data) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    return { projectId, config: data.config, summary: data.summary };
  });

  app.get("/projects/:projectId/state", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    try {
      const state = await projects.getProjectState(cfg.projectsRoot, projectId);
      return { projectId, state };
    } catch {
      return reply.code(404).send({ error: "state_not_found", projectId });
    }
  });

  app.get("/projects/:projectId/queue", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const items = await projects.getProjectQueue(cfg.projectsRoot, projectId);
    return { projectId, items };
  });

  app.get("/projects/:projectId/memory", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    try {
      const memory = await projects.getProjectMemory(cfg.projectsRoot, projectId);
      return { projectId, memory };
    } catch {
      return reply.code(500).send({ error: "memory_load_failed", projectId });
    }
  });

  app.get("/projects/:projectId/summary", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    const summary = await projects.getProjectSummary(cfg.monorepoRoot, cfg.projectsRoot, projectId);
    if (!summary) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    return { projectId, summary };
  });

  app.get("/projects/:projectId/autonomy", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const autonomy = await projects.getProjectAutonomy(cfg.projectsRoot, projectId);
    return { projectId, autonomy };
  });

  app.post("/projects/:projectId/scheduler/run", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const parsed = schedulerBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    const { mode, maxSteps, maxDurationMs, maxConcurrent } = parsed.data;
    try {
      const result = await schedSvc.runSchedulerForProject(cfg.projectsRoot, projectId, {
        mode,
        maxSteps,
        maxDurationMs,
        maxConcurrent,
      });
      return { projectId, result };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return reply.code(400).send({ error: "scheduler_failed", message });
    }
  });

  app.get("/portfolio", async () => {
    const document = await portfolioSvc.getPortfolioDocument(cfg.monorepoRoot);
    return { document };
  });

  app.get("/portfolio/summary", async () => {
    const executive = await portfolioSvc.getPortfolioSummary(cfg.monorepoRoot, cfg.projectsRoot);
    return executive;
  });

  return app;
}
