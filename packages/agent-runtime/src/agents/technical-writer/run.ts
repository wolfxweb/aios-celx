import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import { interpolateTemplate, loadPromptTemplate } from "../../agent-kit/load-prompt.js";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runTechnicalWriter(ctx: AgentExecutionContext): Promise<AgentResult> {
  const discovery = ctx.files["docs/discovery.md"] ?? "(missing)";
  const prd = ctx.files["docs/prd.md"] ?? "(missing)";
  const arch = ctx.files["docs/architecture.md"] ?? "(missing)";
  const decisions = ctx.files["docs/decision-log.md"] ?? "(missing)";
  const readme = ctx.files["README.md"] ?? "(missing — blueprint may omit root README)";

  let tplNote = "";
  try {
    const tpl = await loadPromptTemplate(import.meta.url);
    tplNote = interpolateTemplate(tpl, {
      resolved_context: [discovery, prd].join("\n---\n").slice(0, 2500),
    }).slice(0, 1500);
  } catch {
    tplNote = "";
  }

  const path = OUTPUT_PATHS[0];
  const body = `# Living documentation — ${ctx.projectId}

## Executive summary

Consolidação mock **technical-writer**: apontar lacunas entre vision/discovery, PRD, arquitetura e registo de decisões.

## Doc coverage (snapshot)

| Artefacto | Presente no contexto |
|-----------|------------------------|
| discovery | ${discovery === "(missing)" ? "não" : "sim (excerpt abaixo)"} |
| prd | ${prd === "(missing)" ? "não" : "sim"} |
| architecture | ${arch === "(missing)" ? "não" : "sim"} |
| decision-log | ${decisions === "(missing)" ? "não" : "sim"} |
| README raiz projeto | ${readme.includes("missing") ? "não" : "sim"} |

## Suggested changelog (mock)

- Sincronizar \`docs/prd.md\` com últimas decisões em \`docs/decision-log.md\`.
- Referenciar \`docs/architecture.md\` no README quando existir stack definida.

## Gaps & follow-ups

1. Garantir que cada decisão arquitectónica relevante tem entrada em \`docs/decision-log.md\`.
2. Revisar links entre PRD ↔ backlog ↔ contratos API.

## Excerpts for writers

**Discovery**

\`\`\`
${discovery.split("\n").slice(0, 8).join("\n")}
\`\`\`

**Decision log**

\`\`\`
${decisions.split("\n").slice(0, 8).join("\n")}
\`\`\`

${
  tplNote
    ? `## Prompt reference (truncated)\n\n\`\`\`\n${tplNote}\n\`\`\``
    : ""
}

_Mock — **technical-writer** — ${new Date().toISOString()}_
`;

  await writeMarkdown(join(ctx.projectRoot, path), body);
  return {
    agentId: "technical-writer",
    success: true,
    message: `Wrote ${path}`,
    artifactsWritten: [path],
  };
}
