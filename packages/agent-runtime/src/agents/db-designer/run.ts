import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runDbDesigner(ctx: AgentExecutionContext): Promise<AgentResult> {
  const prd = ctx.files["docs/prd.md"] ?? "";
  const arch = ctx.files["docs/architecture.md"] ?? "";
  const stories = ctx.files["backlog/stories.yaml"] ?? "";

  const body = `# Data model notes — ${ctx.projectId}

## Candidate entities (from PRD/architecture)

| Entity | Description | Notes |
|--------|-------------|--------|
| User | Core actor | AuthN/AuthZ |
| Resource | Domain object | TBD from PRD |

## Relationships (high level)

- User 1—N Resource (illustrative).

## Migration strategy (draft)

- Versioned schema; backward-compatible changes when possível.
- Document breaking changes em \`docs/decision-log.md\`.

## Stories signal

\`\`\`
${stories.split("\n").slice(0, 16).join("\n")}
\`\`\`

## PRD excerpt

\`\`\`
${prd.split("\n").slice(0, 10).join("\n")}
\`\`\`

_Mock — **db-designer** — ${new Date().toISOString()}_
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "db-designer", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
