import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  await ensureDir(dirname(path));
  await writeFile(path, body, "utf8");
}

export async function readYaml<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  const parsed = parseYaml(raw);
  if (parsed === undefined || parsed === null) {
    throw new Error(`YAML at ${path} parsed to empty document`);
  }
  return parsed as T;
}

export async function writeYaml(path: string, data: unknown): Promise<void> {
  const body = `${stringifyYaml(data, { indent: 2 })}\n`;
  await ensureDir(dirname(path));
  await writeFile(path, body, "utf8");
}

export async function readMarkdown(path: string): Promise<string> {
  return readFile(path, "utf8");
}

export async function writeMarkdown(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, "utf8");
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}
