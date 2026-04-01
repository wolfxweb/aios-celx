import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runPortfolioStrategist(ctx: AgentExecutionContext): Promise<AgentResult> {
  const prd = ctx.files["docs/prd.md"] ?? "";
  const disc = ctx.files["docs/discovery.md"] ?? "";
  const del = ctx.files["docs/delivery-status.md"] ?? "";

  const body = `# Portfolio outlook — ${ctx.projectId}

> **Mock:** este relatório usa apenas artefactos **deste** projeto. Para visão multi-projeto real, cruzar com \`.aios/portfolio.yaml\` e \`projects-registry/**\` na raíz do monorepo aios-celx.

## Relative priority (within this project)

| Theme | Rationale |
|-------|-----------|
| Core workflow | Maximiza valor v1 descrito no PRD |
| Hardening | Após slice vertical estável |

## Cross-project prompts (manual)

- Listar outros \`projectId\` que partilham integrações (ver \`docs/integration-landscape.md\`).
- Marcar dependências upstream/downstream entre produtos.

## Project signals

**Discovery**

\`\`\`
${disc.split("\n").slice(0, 8).join("\n")}
\`\`\`

**Delivery**

\`\`\`
${del.split("\n").slice(0, 10).join("\n")}
\`\`\`

_Mock — **portfolio-strategist** — ${new Date().toISOString()}_
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "portfolio-strategist", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
