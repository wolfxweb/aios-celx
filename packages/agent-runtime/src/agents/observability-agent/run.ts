import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runObservabilityAgent(ctx: AgentExecutionContext): Promise<AgentResult> {
  const arch = ctx.files["docs/architecture.md"] ?? "";
  const del = ctx.files["docs/delivery-status.md"] ?? "";

  const body = `# Observability brief — ${ctx.projectId}

## Recommended signals

| Signal | Purpose |
|--------|---------|
| Structured logs | Correlate \`projectId\`, \`taskId\`, \`agentId\` |
| Execution JSONL | Already under \`.aios/logs/\` in aios-managed projects |
| Health endpoints | Align with \`docs/api-contracts.md\` |

## Failure patterns (generic)

- Retries with backoff for external APIs.
- Dead-letter or blocked queue items — inspect \`queue.json\`.

## Architecture excerpt

\`\`\`
${arch.split("\n").slice(0, 12).join("\n")}
\`\`\`

## Delivery excerpt

\`\`\`
${del.split("\n").slice(0, 14).join("\n")}
\`\`\`

_Mock — **observability-agent** — ${new Date().toISOString()}_
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "observability-agent", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
