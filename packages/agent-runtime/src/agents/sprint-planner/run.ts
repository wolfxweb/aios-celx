import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";

export async function runSprintPlanner(ctx: AgentExecutionContext): Promise<AgentResult> {
  const tasks = ctx.files["backlog/tasks.yaml"] ?? "";
  const stories = ctx.files["backlog/stories.yaml"] ?? "";

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
`;

  const path = OUTPUT_PATHS[0];
  await writeMarkdown(join(ctx.projectRoot, path), body);
  return { agentId: "sprint-planner", success: true, message: `Wrote ${path}`, artifactsWritten: [path] };
}
