import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runCostOptimizer(ctx: AgentExecutionContext): Promise<AgentResult> {
  const status = ctx.files["docs/delivery-status.md"] ?? "(run delivery-manager first for richer context)";
  const prd = ctx.files["docs/prd.md"] ?? "";

  const body = `# Cost optimization — ${ctx.projectId}

## Policy draft (mock)

| Tier | Model class | Use case |
|------|-------------|----------|
| default | economical | Structural edits, summaries |
| standard | balanced | PRD/discovery refinement |
| premium | capable | Rare architecture deep-dives |

## Guardrails

- Preferir **mock-engine** em CI; reservar chamadas pagas a steps aprovados.
- Cache de contexto por \`projectId\` para reduzir re-envios.

## Delivery status signal

\`\`\`
${status.split("\n").slice(0, 16).join("\n")}
\`\`\`

## PRD excerpt

\`\`\`
${prd.split("\n").slice(0, 8).join("\n")}
\`\`\`

_Mock — **cost-optimizer** — ${new Date().toISOString()}_
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "cost-optimizer", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
