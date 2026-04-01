import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runSecurityReviewer(ctx: AgentExecutionContext): Promise<AgentResult> {
  const arch = ctx.files["docs/architecture.md"] ?? "";
  const api = ctx.files["docs/api-contracts.md"] ?? "";
  const prd = ctx.files["docs/prd.md"] ?? "";

  const body = `# Security review — ${ctx.projectId}

## Checklist (mock)

| Topic | Status | Action |
|-------|--------|--------|
| Authentication | review | Confirm session/JWT strategy in architecture |
| Authorization | review | RBAC / scopes on sensitive endpoints |
| Secrets | review | No secrets in repo; use env / vault |
| Data exposure | review | Minimize PII in logs and API errors |
| API surface | review | Rate limits on public endpoints |

## Findings

- Correlacionar endpoints sensíveis listados em \`docs/api-contracts.md\` com requisitos de compliance do PRD.

## Architecture excerpt

\`\`\`
${arch.split("\n").slice(0, 12).join("\n")}
\`\`\`

## PRD excerpt

\`\`\`
${prd.split("\n").slice(0, 8).join("\n")}
\`\`\`

_Mock — **security-reviewer** — ${new Date().toISOString()}_
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "security-reviewer", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
