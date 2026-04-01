import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import { interpolateTemplate, loadPromptTemplate } from "../../agent-kit/load-prompt.js";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";
import { agentMission, agentRole } from "./definition.js";

export async function runRequirementsAnalyst(ctx: AgentExecutionContext): Promise<AgentResult> {
  const vision = ctx.files["docs/vision.md"] ?? "(missing vision — add `docs/vision.md` before refining discovery)";
  const memoryHint =
    ctx.memory.project.length > 0 || ctx.memory.global.length > 0
      ? `${ctx.memory.global.length} global + ${ctx.memory.project.length} project memory entries were available to context (see memória no runtime).`
      : "No memory slices in context for this run (normal for early projects).";

  const resolvedContext = [
    `vision excerpt (${Math.min(vision.split("\n").length, 18)} lines)`,
    memoryHint,
  ].join("\n");

  const outputContract = `Um ficheiro Markdown em ${OUTPUT_PATHS[0]} com secções obrigatórias alinhadas ao catálogo MVP (problema, utilizadores, escopo, regras, riscos).`;

  let promptRefSection = "";
  try {
    const tpl = await loadPromptTemplate(import.meta.url);
    const filled = interpolateTemplate(tpl, {
      agent_id: "requirements-analyst",
      role: agentRole,
      mission: agentMission,
      resolved_context: resolvedContext,
      output_contract: outputContract,
    });
    promptRefSection = `

## Prompt template (reference — mock engine)

The following block records the **interpolated** system prompt template for traceability (future LLM engines will use this text directly):

\`\`\`
${filled.slice(0, 4000)}${filled.length > 4000 ? "\n…(truncated)" : ""}
\`\`\`
`;
  } catch {
    promptRefSection = "\n_(prompt-template.md not loaded — optional in dev)_\n";
  }

  const outPath = OUTPUT_PATHS[0];
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
${promptRefSection}
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
