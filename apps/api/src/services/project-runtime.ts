import { projectPath } from "@aios-celx/project-manager";
import { access, readFile } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";

type RuntimeTarget = "web" | "api";

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

async function resolveRuntimeCommand(
  projectId: string,
  projectRoot: string,
  target: RuntimeTarget,
): Promise<{ command: string; env: Record<string, string> } | null> {
  const scripts = await readPackageScripts(projectRoot);
  const webPort = String(getRuntimePort(projectId, "web"));
  const apiPort = String(getRuntimePort(projectId, "api"));

  if (target === "web") {
    if (scripts["dev:web"]) {
      return {
        command: "npm run dev:web",
        env: {
          WEB_PORT: webPort,
        },
      };
    }
    if (await fileExists(join(projectRoot, "web", "index.html"))) {
      return {
        command: `python3 -m http.server ${webPort} --directory web`,
        env: {},
      };
    }
    return null;
  }

  if (scripts["dev:api"]) {
    return {
      command: "npm run dev:api",
      env: {
        API_PORT: apiPort,
        PORT: apiPort,
      },
    };
  }
  if (await fileExists(join(projectRoot, "api", "server.js"))) {
    return {
      command: "node api/server.js",
      env: {
        PORT: apiPort,
      },
    };
  }
  return null;
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

    const port = getRuntimePort(projectId, item);
    const resolved = await resolveRuntimeCommand(projectId, projectRoot, item);
    if (!resolved) {
      continue;
    }

    const child = spawn("bash", ["-lc", resolved.command], {
      cwd: projectRoot,
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
