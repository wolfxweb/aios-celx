import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import { interpolateTemplate, loadPromptTemplate } from "../../agent-kit/load-prompt.js";
import type { AgentExecutionContext } from "../../context.js";
import { agentMission, agentRole } from "./definition.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runSprintPlanner(ctx: AgentExecutionContext): Promise<AgentResult> {
  const tasks = ctx.files["backlog/tasks.yaml"] ?? "";
  const stories = ctx.files["backlog/stories.yaml"] ?? "";
  const prd = ctx.files["docs/prd.md"] ?? "";

  const resolvedContext = [prd.slice(0, 1200), tasks.slice(0, 1200), stories.slice(0, 800)].join(
    "\n---\n",
  );

  let promptAppendix = "";
  try {
    const tpl = await loadPromptTemplate(import.meta.url);
    const filled = interpolateTemplate(tpl, {
      agent_id: "sprint-planner",
      role: agentRole,
      mission: agentMission,
      resolved_context:
        resolvedContext + (prd.length + tasks.length + stories.length > 3200 ? "\n…" : ""),
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

  const body = `# Sprint plan — ${ctx.projectId}

## Proposed waves (mock)

| Wave | Focus | Task ids (illustrative) |
|------|-------|-------------------------|
| W1 | Foundation | TASK-1 |
| W2 | Vertical slice | _(add after backlog grows)_ |

## Dependency rules (heuristic)

1. Concluir tasks bloqueantes antes de integrações externas.
2. QA (\`run:qa\`) após engineer por task.

## Backlog snapshot

**Tasks**

\`\`\`
${tasks.split("\n").slice(0, 40).join("\n")}
\`\`\`

**Stories**

\`\`\`
${stories.split("\n").slice(0, 30).join("\n")}
\`\`\`

_Mock — **sprint-planner** — ${new Date().toISOString()}_
${promptAppendix}
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "sprint-planner", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
