import { projectExists } from "@aios-celx/project-manager";
import { SchedulerRunModeSchema } from "@aios-celx/scheduler";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { ApiEnvConfig } from "./config.js";
import * as authSvc from "./services/auth-service.js";
import * as chatSvc from "./services/chat-service.js";
import * as modelRoutingSvc from "./services/model-routing.js";
import * as portfolioSvc from "./services/portfolio.js";
import * as projectRuntimeSvc from "./services/project-runtime.js";
import * as projectWorkbench from "./services/project-workbench.js";
import * as projects from "./services/projects.js";
import * as schedSvc from "./services/scheduler.js";
import * as workspaceSvc from "./services/workspace.js";
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

const projectChatBodySchema = z.object({
  message: z.string().trim().min(1),
});

const createChatBodySchema = z.object({
  scope: z.enum(["global", "project"]),
  projectId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  runner: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
});

const loginBodySchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().trim().min(1),
});

const projectExecutionModeBodySchema = z.object({
  mode: z.enum(["auto", "manual"]),
});

const projectRuntimeBodySchema = z.object({
  target: z.enum(["web", "api", "all"]).default("all"),
});

export async function buildApp(cfg: ApiEnvConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  const version = readApiPackageVersion();

  app.addHook("preHandler", async (request, reply) => {
    const path = request.url.split("?")[0] ?? request.url;
    const publicPaths = new Set(["/health", "/auth/login", "/auth/default-user"]);
    if (publicPaths.has(path)) {
      return;
    }
    const session = authSvc.resolveUserFromAuthHeader(
      typeof request.headers.authorization === "string" ? request.headers.authorization : undefined,
    );
    if (!session) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    (request as typeof request & { authUser?: unknown }).authUser = session.user;
  });

  app.get("/health", async () => ({
    ok: true,
    service: "aios-celx-api",
    version,
    projectsRoot: cfg.projectsRoot,
    monorepoRoot: cfg.monorepoRoot,
  }));

  app.get("/auth/default-user", async () => ({
    user: authSvc.getDefaultUserInfo(),
    credentials: authSvc.getDefaultCredentials(),
  }));

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    const session = authSvc.loginWithPassword(parsed.data.username, parsed.data.password);
    if (!session) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }
    return session;
  });

  app.get("/projects", async () => {
    const projectIds = await projects.listProjectIds(cfg.projectsRoot);
    return { projectIds, projectsRoot: cfg.projectsRoot };
  });

  app.get("/workspace/overview", async () => {
    const overview = await workspaceSvc.buildWorkspaceOverview(cfg.monorepoRoot, cfg.projectsRoot);
    return overview;
  });

  app.get("/model-routing", async () => {
    const config = await modelRoutingSvc.ensureModelRoutingConfig(cfg.monorepoRoot);
    return { config };
  });

  app.get("/chats", async (request) => {
    const query = request.query as { scope?: "global" | "project"; projectId?: string };
    const chats = await chatSvc.listChats(cfg.monorepoRoot, {
      scope: query.scope,
      projectId: query.projectId,
    });
    return { chats };
  });

  app.post("/chats", async (request, reply) => {
    const parsed = createChatBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    if (parsed.data.scope === "project" && !parsed.data.projectId) {
      return reply.code(400).send({ error: "project_id_required" });
    }
    const chat = await chatSvc.createChat(cfg.monorepoRoot, parsed.data);
    return { chat };
  });

  app.get("/chats/:chatId", async (request, reply) => {
    const { chatId } = request.params as { chatId: string };
    const chat = await chatSvc.getChat(cfg.monorepoRoot, chatId);
    if (!chat) {
      return reply.code(404).send({ error: "chat_not_found", chatId });
    }
    return { chat };
  });

  app.post("/chats/:chatId/messages", async (request, reply) => {
    const { chatId } = request.params as { chatId: string };
    const parsed = projectChatBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    try {
      const chat = await chatSvc.appendUserMessageAndRespond(
        cfg.monorepoRoot,
        cfg.projectsRoot,
        chatId,
        parsed.data.message,
      );
      return { chat };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return reply.code(400).send({ error: "chat_failed", message });
    }
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

  app.get("/projects/:projectId/tasks", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    try {
      const tasks = await projects.getProjectTasks(cfg.projectsRoot, projectId);
      return { projectId, tasks };
    } catch {
      return reply.code(404).send({ error: "tasks_not_found", projectId });
    }
  });

  app.get("/projects/:projectId/runtime", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const runtime = await projectRuntimeSvc.getProjectRuntimeStatus(cfg.projectsRoot, projectId);
    return runtime;
  });

  app.post("/projects/:projectId/runtime/start", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const parsed = projectRuntimeBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    const runtime = await projectRuntimeSvc.startProjectRuntime(
      cfg.projectsRoot,
      projectId,
      parsed.data.target,
    );
    return runtime;
  });

  app.post("/projects/:projectId/runtime/stop", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const parsed = projectRuntimeBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    const runtime = await projectRuntimeSvc.stopProjectRuntime(
      cfg.projectsRoot,
      projectId,
      parsed.data.target,
    );
    return runtime;
  });

  app.get("/projects/:projectId/context", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    try {
      const context = await projectWorkbench.getProjectWorkbenchContext(
        cfg.monorepoRoot,
        cfg.projectsRoot,
        projectId,
      );
      return { projectId, context };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return reply.code(400).send({ error: "context_failed", message });
    }
  });

  app.post("/projects/:projectId/chat", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const parsed = projectChatBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    try {
      const result = await projectWorkbench.chatAboutProject(
        cfg.monorepoRoot,
        cfg.projectsRoot,
        projectId,
        parsed.data.message,
      );
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return reply.code(400).send({ error: "chat_failed", message });
    }
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

  app.get("/projects/:projectId/execution-mode", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const mode = await projects.getProjectExecutionMode(cfg.projectsRoot, projectId);
    return { projectId, mode };
  });

  app.post("/projects/:projectId/execution-mode", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!assertSafeProjectId(projectId)) {
      return reply.code(400).send({ error: "invalid_project_id" });
    }
    if (!(await projectExists(cfg.projectsRoot, projectId))) {
      return reply.code(404).send({ error: "project_not_found", projectId });
    }
    const parsed = projectExecutionModeBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    const mode = await projects.setProjectExecutionMode(cfg.projectsRoot, projectId, parsed.data.mode);
    return { projectId, mode };
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
