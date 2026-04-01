import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_DIR = join(dirname(fileURLToPath(import.meta.url)), "content");

const FILE_BY_KEY: Record<string, string> = {
  vision: "vision.md",
  discovery: "discovery.md",
  prd: "prd.md",
  architecture: "architecture.md",
  "api-contracts": "api-contracts.md",
  "decision-log": "decision-log.md",
  epics: "epics.yaml",
  stories: "stories.yaml",
  tasks: "tasks.yaml",
};

export function listTemplateKeys(): string[] {
  return Object.keys(FILE_BY_KEY);
}

export async function loadTemplateSource(templateKey: string): Promise<string> {
  const file = FILE_BY_KEY[templateKey];
  if (!file) {
    throw new Error(`Unknown template key: ${templateKey}`);
  }
  return readFile(join(CONTENT_DIR, file), "utf8");
}

export function renderTemplateString(source: string, vars: Record<string, string>): string {
  let out = source;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export async function renderTemplate(
  templateKey: string,
  vars: Record<string, string>,
): Promise<string> {
  const src = await loadTemplateSource(templateKey);
  return renderTemplateString(src, vars);
}
