import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runReleaseManager(ctx: AgentExecutionContext): Promise<AgentResult> {
  const tasks = ctx.files["backlog/tasks.yaml"] ?? "";
  const prd = ctx.files["docs/prd.md"] ?? "";
  const del = ctx.files["docs/delivery-status.md"] ?? "";

  const body = `# Release readiness — ${ctx.projectId}

## Gates (mock checklist)

- [ ] Tasks críticas em \`done\` ou explicitamente deferred
- [ ] QA reports para trabalho de alto risco
- [ ] Documentação alinhada (\`docs/prd.md\`, \`docs/architecture.md\`)

## Release notes (stub)

### Added
- _(list features per PRD goals)_

### Known limitations
- _(from discovery risks)_

## Task snapshot

\`\`\`
${tasks.split("\n").slice(0, 35).join("\n")}
\`\`\`

## Delivery snapshot

\`\`\`
${del.split("\n").slice(0, 12).join("\n")}
\`\`\`

_Mock — **release-manager** — ${new Date().toISOString()}_
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "release-manager", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
