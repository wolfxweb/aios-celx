import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../context.js";

export async function runRequirementsAnalyst(ctx: AgentExecutionContext): Promise<AgentResult> {
  const vision = ctx.files["docs/vision.md"] ?? "(missing vision — add `docs/vision.md` before refining discovery)";
  const memoryHint =
    ctx.memory.project.length > 0 || ctx.memory.global.length > 0
      ? `${ctx.memory.global.length} global + ${ctx.memory.project.length} project memory entries were available to context (see memória no runtime).`
      : "No memory slices in context for this run (normal for early projects).";

  const outPath = "docs/discovery.md";
  const body = `# Discovery — ${ctx.projectId}

## Mandate

Structured discovery to **remove ambiguity** before PRD and backlog: problem, users, scope, business rules, constraints.

## Problem statement

Users and stakeholders need a **single coherent narrative** from raw vision to testable scope, so downstream agents (product-manager, architect) do not invent missing requirements.

_Vision input (excerpt):_

\`\`\`
${vision.split("\n").slice(0, 18).join("\n")}
\`\`\`

## Goals & users

| | (draft — refine with stakeholders) |
|--|--------------------------------------|
| **Primary goal** | Deliver measurable value described in vision; define v1 success metric. |
| **Primary users** | TBD from vision / interviews (list personas when known). |
| **Non-goals (v1)** | Explicitly list what is out of scope to prevent scope creep. |

## Scope (initial)

### In scope (candidate)

- Core workflow or slice implied by vision.
- Deliverables that must exist for v1 to be considered “shipped”.

### Out of scope (candidate)

- Integrations marked optional until discovery confirms need.
- Nice-to-haves without owner or metric.

## Business rules (draft)

- Record **rules** as bullet list; tag ambiguity with _[NEEDS CONFIRMATION]_.
- Link money, compliance, or SLA-sensitive rules explicitly.

## Constraints & dependencies

- Technical, legal, budget, timeline, third-party APIs.
- **Project isolation:** artefacts for this product live under this project root.

_Context / memory:_ ${memoryHint}

## Hypotheses

- H1: Early discovery reduces thrash in epics and acceptance criteria.
- H2: Listing constraints before architecture prevents “surprise integrations”.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vision drift | Medium | Re-sync \`docs/vision.md\` before planning gate |
| Missing stakeholders | High | Record owners in \`docs/decision-log.md\` |
| Assumed scope | High | Mark assumptions; validate before \`product-manager\` |

## Open questions

1. What is the measurable outcome for v1 (metric + timeframe)?
2. Which integrations are mandatory vs optional?
3. Who approves scope changes after discovery is “frozen”?

_Mock pipeline — **requirements-analyst** — ${new Date().toISOString()}_
`;

  await writeMarkdown(join(ctx.projectRoot, outPath), body);

  return {
    agentId: "requirements-analyst",
    success: true,
    message: `Wrote structured discovery at ${outPath}`,
    artifactsWritten: [outPath],
  };
}
