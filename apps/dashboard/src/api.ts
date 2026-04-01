export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw && raw.length > 0) {
    return raw.replace(/\/$/, "");
  }
  return "http://127.0.0.1:3030";
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${getApiBase()}${path}`);
  if (!r.ok) {
    let detail = "";
    try {
      const j: unknown = await r.json();
      detail =
        typeof j === "object" && j !== null && "error" in j
          ? ` — ${JSON.stringify(j)}`
          : "";
    } catch {
      /* ignore */
    }
    throw new Error(`${r.status} ${r.statusText}${detail}`);
  }
  return r.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    let detail = "";
    try {
      const j: unknown = await r.json();
      detail = typeof j === "object" && j !== null ? ` — ${JSON.stringify(j)}` : "";
    } catch {
      /* ignore */
    }
    throw new Error(`${r.status} ${r.statusText}${detail}`);
  }
  return r.json() as Promise<T>;
}
