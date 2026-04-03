import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import { interpolateTemplate, loadPromptTemplate } from "../../agent-kit/load-prompt.js";
import type { AgentExecutionContext } from "../../context.js";
import { agentMission, agentRole } from "./definition.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runDbDesigner(ctx: AgentExecutionContext): Promise<AgentResult> {
  const prd = ctx.files["docs/prd.md"] ?? "";
  const arch = ctx.files["docs/architecture.md"] ?? "";
  const stories = ctx.files["backlog/stories.yaml"] ?? "";

  const resolvedContext = [prd.slice(0, 1200), arch.slice(0, 1200), stories.slice(0, 800)].join(
    "\n---\n",
  );

  let promptAppendix = "";
  try {
    const tpl = await loadPromptTemplate(import.meta.url);
    const filled = interpolateTemplate(tpl, {
      agent_id: "db-designer",
      role: agentRole,
      mission: agentMission,
      resolved_context: resolvedContext + (prd.length + arch.length + stories.length > 3200 ? "\n…" : ""),
      output_contract: OUTPUT_PATHS.join(", "),
    });
    promptAppendix = `

## Prompt template (reference — mock engine)

\`\`\`
${filled.slice(0, 3500)}${filled.length > 3500 ? "\n…(truncated)" : ""}
\`\`\`
`;
  } catch {
    promptAppendix = "";
  }

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
${promptAppendix}
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "db-designer", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
