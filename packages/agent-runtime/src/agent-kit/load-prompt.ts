import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Load a UTF-8 file next to the calling module (e.g. `prompt-template.md`). */
export async function loadPromptTemplate(
  importMetaUrl: string,
  fileName: string = "prompt-template.md",
): Promise<string> {
  const dir = dirname(fileURLToPath(importMetaUrl));
  return readFile(join(dir, fileName), "utf8");
}

/** Replace `{{key}}` placeholders (simple, no nested logic). */
export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}
