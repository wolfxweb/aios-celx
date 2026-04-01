import { readYaml, writeMarkdown } from "@aios-celx/artifact-manager";
import { loadStories, loadTasks } from "@aios-celx/backlog-manager";
import { describeExecutionConfig } from "@aios-celx/engine-adapters";
import { loadProjectQueue } from "@aios-celx/execution-queue";
import type { AgentResult } from "@aios-celx/shared";
import { ProjectConfigSchema, normalizeProjectConfig } from "@aios-celx/shared";
import { evaluateGate, getActiveStep, getNextStep } from "@aios-celx/workflow-engine";
import { dirname, join } from "node:path";
import type { AgentExecutionContext } from "../context.js";

function countByStatus(items: { status?: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of items) {
    const s = x.status ?? "(unset)";
    out[s] = (out[s] ?? 0) + 1;
  }
  return out;
}

export async function runDeliveryManager(ctx: AgentExecutionContext): Promise<AgentResult> {
  const projectsRoot = dirname(ctx.projectRoot);
  const active = getActiveStep(ctx.workflow, ctx.state);
  const nextStep = getNextStep(ctx.workflow, ctx.state);
  const configPath = join(ctx.projectRoot, ".aios", "config.yaml");
  const raw = await readYaml<unknown>(configPath);
  const projectConfig = normalizeProjectConfig(ProjectConfigSchema.parse(raw));

  const gatePreview = active
    ? await evaluateGate(ctx.projectRoot, active.gate, {
        taskId: ctx.state.currentTaskId ?? undefined,
      })
    : { gateId: "(none)", passed: true, checks: [] };

  const engineForNext = active
    ? describeExecutionConfig(projectConfig, active.agent)
    : describeExecutionConfig(projectConfig, ctx.state.currentAgent);

  let taskStats = "";
  let storyStats = "";
  let queueSection = "";
  try {
    const [tasksDoc, storiesDoc, queue] = await Promise.all([
      loadTasks(ctx.projectRoot),
      loadStories(ctx.projectRoot),
      loadProjectQueue(projectsRoot, ctx.projectId),
    ]);
    const tc = countByStatus(tasksDoc.tasks);
    taskStats = Object.entries(tc)
      .map(([k, v]) => `${k}: **${v}**`)
      .join(" · ");
    const sc = countByStatus(storiesDoc.stories);
    storyStats = Object.entries(sc)
      .map(([k, v]) => `${k}: **${v}**`)
      .join(" · ");

    const preview = queue.items.slice(0, 12);
    queueSection =
      preview.length === 0
        ? "_No queue items (or empty `queue.json`)._"
        : preview
            .map(
              (i) =>
                `- \`${i.id.slice(0, 8)}…\` · **${i.type}** · ${i.status}${i.payload && typeof i.payload.taskId === "string" ? ` · task \`${i.payload.taskId}\`` : ""}`,
            )
            .join("\n");
  } catch {
    taskStats = "_(unavailable)_";
    storyStats = "_(unavailable)_";
    queueSection = "_(queue/backlog unreadable — check project paths)_";
  }

  const statusPath = "docs/delivery-status.md";
  const summaryPath = "docs/delivery-summary.md";

  const statusBody = `# Delivery status — ${ctx.projectId}

## Operational snapshot

| Field | Value |
|-------|--------|
| Stage | ${ctx.state.stage} |
| Current agent (state) | ${ctx.state.currentAgent} |
| Current task (state) | ${ctx.state.currentTaskId ?? "(none)"} |
| Next gate | ${ctx.state.nextGate || "(none)"} |
| Blocked (flag) | ${ctx.state.blocked ? "yes" : "no"} |
| Requires human approval | ${ctx.state.requiresHumanApproval ? "yes" : "no"} |
| Completed gates | ${ctx.state.completedGates.join(", ") || "(none)"} |

## Backlog health

- **Tasks** (${taskStats || "n/a"})
- **Stories** (${storyStats || "n/a"})

## Execution queue (preview)

${queueSection}

_Use \`aios queue:list --project ${ctx.projectId}\` for the full list._

## Memory (Bloco 5.1)

Filtered slices passed to this agent (\`delivery-manager\`): **${ctx.memory.global.length}** global entries, **${ctx.memory.project.length}** project entries.

## Workflow focus

${
  active
    ? `- Active step: **${active.id}** (${active.stage})
- Responsible agent: **${active.agent}**
- Gate to satisfy: **${active.gate}**
- Gate checks (preview): **${gatePreview.passed ? "PASS" : "FAIL"}**`
    : "- No active step — all workflow gates may be approved or workflow is complete."
}

## Next workflow step (preview)

${
  nextStep
    ? `- **${nextStep.id}** — agent **${nextStep.agent}**, gate **${nextStep.gate}** (${nextStep.stage})`
    : "- _(no further step in workflow definition for this state)_"
}

## Engine routing (from \`.aios/config.yaml\`)

- Resolved engine for the active agent: **${engineForNext.engineId}**${engineForNext.usedFallback ? " _(fallback to \`default\`)_" : ""}

## Inputs / outputs (from workflow step)

${
  active
    ? `- Inputs: ${(active.inputs ?? []).map((p) => `\`${p}\``).join(", ") || "(none listed)"}
- Outputs: ${(active.outputs ?? []).map((p) => `\`${p}\``).join(", ") || "(none listed)"}`
    : "- (n/a)"
}

## Blockers

${
  ctx.state.blocked
    ? "- State is marked **blocked** — unblock before relying on automation."
    : gatePreview.passed || !active
      ? "- No artifact gate failure detected for the active step (or no active gate)."
      : "- Gate checks failing — run the responsible agent, then re-check with \`aios next\`."
}

## Recommended next commands

${
  active
    ? gatePreview.passed
      ? `- \`aios approve --project ${ctx.projectId} --gate ${active.gate}\` (if you accept the gate)\n- Or refine artifacts and re-run \`aios next --project ${ctx.projectId}\` before approving.`
      : `- \`aios run --project ${ctx.projectId} --agent ${active.agent}\` (engine: **${engineForNext.engineId}**)`
    : `- \`aios status --project ${ctx.projectId}\`\n- Pick work from \`backlog/tasks.yaml\`; run engineer with \`aios run:task\`, QA with \`aios run:qa\`.` + `\n- \`aios queue:list --project ${ctx.projectId}\` / \`aios scheduler:run\` if using the queue.`
}

_Generated by **delivery-manager** at ${new Date().toISOString()}._
`;

  await writeMarkdown(join(ctx.projectRoot, statusPath), statusBody);

  const shortBody = `# Delivery summary — ${ctx.projectId}

| | |
|--|--|
| Active step | ${active ? `**${active.id}** (${active.agent})` : "(none)"} |
| Next step | ${nextStep ? `**${nextStep.id}**` : "(none)"} |
| Blocked | ${ctx.state.blocked ? "yes" : "no"} |

See **${statusPath}** for engines, gates, queue preview, and backlog counts.

_Last update: ${new Date().toISOString()}._
`;
  await writeMarkdown(join(ctx.projectRoot, summaryPath), shortBody);

  return {
    agentId: "delivery-manager",
    success: true,
    message: `Wrote ${statusPath} and ${summaryPath}`,
    artifactsWritten: [statusPath, summaryPath],
  };
}
