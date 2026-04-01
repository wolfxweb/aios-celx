import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../context.js";

export async function runRequirementsAnalyst(ctx: AgentExecutionContext): Promise<AgentResult> {
  const vision = ctx.files["docs/vision.md"] ?? "(missing vision — placeholder intake)";
  const outPath = "docs/discovery.md";
  const body = `# Discovery — ${ctx.projectId}

## Problem

Users need a **single coherent narrative** linking vision → scope → delivery risks before backlog work begins.

_Vision signal (excerpt):_
${vision.split("\n").slice(0, 14).join("\n")}

## Hypotheses

- H1: Writing discovery before PRD reduces thrash in backlog structure.
- H2: Listing constraints early prevents “surprise integrations” in architecture.

## Constraints

- Mock pipeline (no external LLM APIs in Bloco 3 default engine).
- Strict project isolation: artifacts live only under this project root.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vision drift | Medium | Re-sync \`docs/vision.md\` before planning gate |
| Missing stakeholders | High | Record owners in decision log |

## Open questions

1. What is the measurable outcome for v1 (metric + timeframe)?
2. Which integrations are mandatory vs optional?

_Mock output — **requirements-analyst** — ${new Date().toISOString()}_
`;

  await writeMarkdown(join(ctx.projectRoot, outPath), body);

  return {
    agentId: "requirements-analyst",
    success: true,
    message: `Wrote structured discovery at ${outPath}`,
    artifactsWritten: [outPath],
  };
}
