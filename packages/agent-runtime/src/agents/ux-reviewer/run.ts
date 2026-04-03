import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import { interpolateTemplate, loadPromptTemplate } from "../../agent-kit/load-prompt.js";
import type { AgentExecutionContext } from "../../context.js";
import { agentMission, agentRole } from "./definition.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runUxReviewer(ctx: AgentExecutionContext): Promise<AgentResult> {
  const prd = ctx.files["docs/prd.md"] ?? "";
  const disc = ctx.files["docs/discovery.md"] ?? "";
  const stories = ctx.files["backlog/stories.yaml"] ?? "";

  const resolvedContext = [prd.slice(0, 1200), disc.slice(0, 1200), stories.slice(0, 800)].join(
    "\n---\n",
  );

  let promptAppendix = "";
  try {
    const tpl = await loadPromptTemplate(import.meta.url);
    const filled = interpolateTemplate(tpl, {
      agent_id: "ux-reviewer",
      role: agentRole,
      mission: agentMission,
      resolved_context:
        resolvedContext + (prd.length + disc.length + stories.length > 3200 ? "\n…" : ""),
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

  const body = `# UX review — ${ctx.projectId}

## Journey hypotheses (mock)

- **Onboarding:** primeira tarefa de valor deve ser atingível em poucos passos.
- **Errors:** mensagens acionáveis; evitar jargão técnico ao utilizador final.
- **Consistency:** terminologia alinhada entre PRD e stories.

## Friction radar

| Area | Severity | Hint |
|------|----------|------|
| Scope clarity | low | Revisar user stories para personas explícitas |
| Empty states | info | Planejar estados vazios nas features v1 |

## Stories excerpt

\`\`\`
${stories.split("\n").slice(0, 18).join("\n")}
\`\`\`

## PRD excerpt

\`\`\`
${prd.split("\n").slice(0, 10).join("\n")}
\`\`\`

_Mock — **ux-reviewer** — ${new Date().toISOString()}_
${promptAppendix}
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "ux-reviewer", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
