import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runIntegrationSpecialist(ctx: AgentExecutionContext): Promise<AgentResult> {
  const disc = ctx.files["docs/discovery.md"] ?? "";
  const prd = ctx.files["docs/prd.md"] ?? "";
  const api = ctx.files["docs/api-contracts.md"] ?? "";

  const body = `# Integration landscape — ${ctx.projectId}

## External systems (candidates — confirm with discovery/PRD)

| Integration | Purpose | Risk | Notes |
|-------------|---------|------|-------|
| Payment (ex. Stripe) | Billing | Medium | Webhooks idempotent |
| Messaging (ex. WhatsApp) | Notifications | Medium | Rate limits / templates |
| Automation (ex. n8n) | Orchestration | Low | Secrets outside repo |
| Data (ex. Supabase) | Persistence | Medium | RLS policies |

## Contract touchpoints

- Entrada de dados de terceiros deve mapear para endpoints em \`docs/api-contracts.md\`.
- Documentar versão mínima de APIs externas e ambientes (sandbox vs prod).

## Signals

**Discovery**

\`\`\`
${disc.split("\n").slice(0, 10).join("\n")}
\`\`\`

**PRD**

\`\`\`
${prd.split("\n").slice(0, 10).join("\n")}
\`\`\`

**API**

\`\`\`
${api.split("\n").slice(0, 14).join("\n")}
\`\`\`

_Mock — **integration-specialist** — ${new Date().toISOString()}_
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "integration-specialist", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
