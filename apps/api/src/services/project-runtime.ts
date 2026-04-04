import { loadProjectConfig, projectPath } from "@aios-celx/project-manager";
import { access, readFile } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";

type RuntimeTarget = "web" | "api";

type ProjectRuntimeConfigShape = {
  runtime?: {
    web?: { command: string; cwd?: string };
    api?: { command: string; cwd?: string };
  };
};

type RuntimeHandle = {
  target: RuntimeTarget;
  process: ChildProcess;
  pid: number;
  command: string;
  url: string;
  port: number;
  startedAt: string;
};

type RuntimeSnapshot = {
  status: "stopped" | "running";
  url: string | null;
  port: number | null;
  pid: number | null;
  command: string | null;
  startedAt: string | null;
};

type ProjectRuntimeStatus = {
  projectId: string;
  web: RuntimeSnapshot;
  api: RuntimeSnapshot;
};

const runtimeHandles = new Map<string, Partial<Record<RuntimeTarget, RuntimeHandle>>>();

function nowIso(): string {
  return new Date().toISOString();
}

function hashProjectId(projectId: string): number {
  let value = 0;
  for (const char of projectId) {
    value = (value * 31 + char.charCodeAt(0)) % 1000;
  }
  return value;
}

function getRuntimePort(projectId: string, target: RuntimeTarget): number {
  const offset = hashProjectId(projectId) * 2;
  return target === "web" ? 4100 + offset : 4101 + offset;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readPackageScripts(projectRoot: string): Promise<Record<string, string>> {
  const packageJsonPath = join(projectRoot, "package.json");
  if (!(await fileExists(packageJsonPath))) {
    return {};
  }
  const raw = await readFile(packageJsonPath, "utf8");
  const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
  return parsed.scripts ?? {};
}

async function readScopedPackageScripts(
  projectRoot: string,
  scope: string,
): Promise<{ cwd: string; scripts: Record<string, string> } | null> {
  const scopeRoot = join(projectRoot, scope);
  const packageJsonPath = join(scopeRoot, "package.json");
  if (!(await fileExists(packageJsonPath))) {
    return null;
  }
  const raw = await readFile(packageJsonPath, "utf8");
  const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
  return {
    cwd: scopeRoot,
    scripts: parsed.scripts ?? {},
  };
}

async function resolveViteCommand(scopeRoot: string, port: string): Promise<string | null> {
  const viteBin = join(scopeRoot, "node_modules", "vite", "bin", "vite.js");
  if (!(await fileExists(viteBin))) {
    return null;
  }
  return `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`;
}

async function resolveRuntimeCommand(
  projectsRoot: string,
  projectId: string,
  projectRoot: string,
  target: RuntimeTarget,
  port: number,
): Promise<{ command: string; env: Record<string, string>; cwd: string } | null> {
  const config = (await loadProjectConfig(projectsRoot, projectId).catch(() => null)) as ProjectRuntimeConfigShape | null;
  const scripts = await readPackageScripts(projectRoot);
  const webPackage = await readScopedPackageScripts(projectRoot, "web");
  const apiPackage = await readScopedPackageScripts(projectRoot, "api");
  const runtimePort = String(port);
  const explicitRuntime = config?.runtime?.[target];
  if (explicitRuntime?.command) {
    return {
      command: explicitRuntime.command,
      env: {
        PORT: runtimePort,
        WEB_PORT: target === "web" ? runtimePort : "",
        API_PORT: target === "api" ? runtimePort : "",
      },
      cwd: explicitRuntime.cwd ? join(projectRoot, explicitRuntime.cwd) : projectRoot,
    };
  }

  if (target === "web") {
    if (webPackage?.scripts.dev) {
      const viteCommand = await resolveViteCommand(webPackage.cwd, runtimePort);
      return {
        command: viteCommand ?? `npm run dev -- --host 127.0.0.1 --port ${runtimePort} --strictPort`,
        env: {
          PORT: runtimePort,
        },
        cwd: webPackage.cwd,
      };
    }
    if (scripts["dev:web"]) {
      return {
        command: "npm run dev:web",
        env: {
          WEB_PORT: runtimePort,
        },
        cwd: projectRoot,
      };
    }
    if (await fileExists(join(projectRoot, "web", "index.html"))) {
      return {
        command: `python3 -m http.server ${runtimePort} --directory web`,
        env: {},
        cwd: projectRoot,
      };
    }
    return null;
  }

  if (apiPackage?.scripts.dev) {
    return {
      command: `npm run dev -- --host 127.0.0.1 --port ${runtimePort}`,
      env: {
        API_PORT: runtimePort,
        PORT: runtimePort,
      },
      cwd: apiPackage.cwd,
    };
  }

  if (await fileExists(join(projectRoot, "api", "server.ts"))) {
    return {
      command: `node ${join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs")} api/server.ts`,
      env: {
        API_PORT: runtimePort,
        PORT: runtimePort,
      },
      cwd: projectRoot,
    };
  }

  if (await fileExists(join(projectRoot, "api", "app", "main.py"))) {
    return {
      command: `python3 -m uvicorn app.main:app --host 127.0.0.1 --port ${runtimePort}`,
      env: {
        API_PORT: runtimePort,
        PORT: runtimePort,
      },
      cwd: join(projectRoot, "api"),
    };
  }

  if (scripts["dev:api"]) {
    return {
      command: "npm run dev:api",
      env: {
        API_PORT: runtimePort,
        PORT: runtimePort,
      },
      cwd: projectRoot,
    };
  }
  if (await fileExists(join(projectRoot, "api", "server.js"))) {
    return {
      command: "node api/server.js",
      env: {
        PORT: runtimePort,
      },
      cwd: projectRoot,
    };
  }
  return null;
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  let candidate = startPort;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
    candidate += 2;
  }
  return startPort;
}

function runtimeUrl(port: number): string {
  return `http://127.0.0.1:${port}`;
}

function emptySnapshot(): RuntimeSnapshot {
  return {
    status: "stopped",
    url: null,
    port: null,
    pid: null,
    command: null,
    startedAt: null,
  };
}

function handleToSnapshot(handle?: RuntimeHandle): RuntimeSnapshot {
  if (!handle || !isPidAlive(handle.pid)) {
    return emptySnapshot();
  }
  return {
    status: "running",
    url: handle.url,
    port: handle.port,
    pid: handle.pid,
    command: handle.command,
    startedAt: handle.startedAt,
  };
}

export async function getProjectRuntimeStatus(projectsRoot: string, projectId: string): Promise<ProjectRuntimeStatus> {
  const handles = runtimeHandles.get(projectId);
  return {
    projectId,
    web: handleToSnapshot(handles?.web),
    api: handleToSnapshot(handles?.api),
  };
}

export async function startProjectRuntime(
  projectsRoot: string,
  projectId: string,
  target: RuntimeTarget | "all",
): Promise<ProjectRuntimeStatus> {
  const projectRoot = projectPath(projectsRoot, projectId);
  const targets: RuntimeTarget[] = target === "all" ? ["web", "api"] : [target];
  const handles = runtimeHandles.get(projectId) ?? {};

  for (const item of targets) {
    const existing = handles[item];
    if (existing && isPidAlive(existing.pid)) {
      continue;
    }

    const port = await findAvailablePort(getRuntimePort(projectId, item));
    const resolved = await resolveRuntimeCommand(projectsRoot, projectId, projectRoot, item, port);
    if (!resolved) {
      continue;
    }

    const child = spawn("bash", ["-lc", resolved.command], {
      cwd: resolved.cwd,
      env: {
        ...process.env,
        ...resolved.env,
      },
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    if (!child.pid) {
      continue;
    }

    handles[item] = {
      target: item,
      process: child,
      pid: child.pid,
      command: resolved.command,
      url: runtimeUrl(port),
      port,
      startedAt: nowIso(),
    };
  }

  runtimeHandles.set(projectId, handles);
  return getProjectRuntimeStatus(projectsRoot, projectId);
}

export async function stopProjectRuntime(
  projectsRoot: string,
  projectId: string,
  target: RuntimeTarget | "all",
): Promise<ProjectRuntimeStatus> {
  const handles = runtimeHandles.get(projectId) ?? {};
  const targets: RuntimeTarget[] = target === "all" ? ["web", "api"] : [target];

  for (const item of targets) {
    const handle = handles[item];
    if (!handle) {
      continue;
    }
    try {
      process.kill(-handle.pid, "SIGTERM");
    } catch {
      try {
        process.kill(handle.pid, "SIGTERM");
      } catch {
        // ignore
      }
    }
    delete handles[item];
  }

  runtimeHandles.set(projectId, handles);
  return getProjectRuntimeStatus(projectsRoot, projectId);
}
