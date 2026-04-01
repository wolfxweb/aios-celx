import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runRefactorGuardian(ctx: AgentExecutionContext): Promise<AgentResult> {
  const arch = ctx.files["docs/architecture.md"] ?? "";
  const api = ctx.files["docs/api-contracts.md"] ?? "";
  const tasks = ctx.files["backlog/tasks.yaml"] ?? "";

  const body = `# Technical health — ${ctx.projectId}

## Focus (mock)

- **Acoplamento:** rever boundaries em \`docs/architecture.md\`; listar dependências circulares potenciais.
- **Duplicação:** agrupar tasks similares em \`backlog/tasks.yaml\`.
- **Padrões:** alinhar contratos API com convenções descritas.

## Heuristic findings (illustrative)

| Área | Severity | Note |
|------|----------|------|
| Boundaries | info | Validar módulos após mudanças em PRD |
| Tasks | low | Manter \`files\` e \`acceptanceCriteria\` preenchidos por task |

## Architecture signal

\`\`\`
${arch.split("\n").slice(0, 12).join("\n")}
\`\`\`

## Tasks signal

\`\`\`
${tasks.split("\n").slice(0, 20).join("\n")}
\`\`\`

## API contracts signal

\`\`\`
${api.split("\n").slice(0, 12).join("\n")}
\`\`\`

_Recommended next step:_ executar \`software-architect\` ou revisão humana após grandes refactorings.

_Mock — **refactor-guardian** — ${new Date().toISOString()}_
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "refactor-guardian", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
