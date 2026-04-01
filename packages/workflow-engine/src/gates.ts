import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { readYaml } from "@aios-celx/artifact-manager";
import type { GateCheck, GateResult } from "@aios-celx/shared";

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(path: string): Promise<string> {
  return readFile(path, "utf8");
}

function hasAll(text: string, needles: string[]): GateCheck[] {
  return needles.map((sub) => ({
    id: `contains:${sub}`,
    passed: text.includes(sub),
    detail: text.includes(sub) ? `Found "${sub}"` : `Missing "${sub}"`,
  }));
}

async function markdownDocGate(
  projectRoot: string,
  gateId: string,
  relPath: string,
  markers: string[],
): Promise<GateResult> {
  const path = join(projectRoot, relPath);
  if (!(await pathExists(path))) {
    return {
      gateId,
      passed: false,
      checks: [{ id: `file:${relPath}`, passed: false, detail: `${relPath} missing` }],
    };
  }
  const text = await readUtf8(path);
  const checks = hasAll(text, markers);
  return { gateId, passed: checks.every((c) => c.passed), checks };
}

type YamlListDoc = { epics?: unknown[]; stories?: unknown[]; tasks?: unknown[] };

export type GateEvaluationContext = {
  /** Required for `task_ready_for_qa` and `task_qa_approved` (current backlog task). */
  taskId?: string;
};

export async function evaluateGate(
  projectRoot: string,
  gateId: string,
  context?: GateEvaluationContext,
): Promise<GateResult> {
  switch (gateId) {
    case "discovery_complete": {
      const path = join(projectRoot, "docs", "discovery.md");
      if (!(await pathExists(path))) {
        return {
          gateId,
          passed: false,
          checks: [{ id: "file:discovery.md", passed: false, detail: "docs/discovery.md missing" }],
        };
      }
      const text = await readUtf8(path);
      const checks = hasAll(text, ["## Problem", "## Hypotheses", "## Constraints"]);
      return {
        gateId,
        passed: checks.every((c) => c.passed),
        checks,
      };
    }

    case "planning_complete": {
      const checks: GateCheck[] = [];
      const prd = join(projectRoot, "docs", "prd.md");
      if (!(await pathExists(prd))) {
        checks.push({ id: "file:prd.md", passed: false, detail: "docs/prd.md missing" });
      } else {
        const prdText = await readUtf8(prd);
        checks.push(
          ...hasAll(prdText, ["## Summary", "## Goals"]),
        );
      }

      for (const rel of ["backlog/epics.yaml", "backlog/stories.yaml", "backlog/tasks.yaml"] as const) {
        const p = join(projectRoot, rel);
        if (!(await pathExists(p))) {
          checks.push({ id: `file:${rel}`, passed: false, detail: `${rel} missing` });
          continue;
        }
        try {
          const doc = await readYaml<YamlListDoc>(p);
          const key = rel.includes("epics") ? "epics" : rel.includes("stories") ? "stories" : "tasks";
          const list = doc[key];
          const ok = Array.isArray(list) && list.length > 0;
          checks.push({
            id: `non-empty:${rel}`,
            passed: ok,
            detail: ok ? `${rel} has items` : `${rel} must be a non-empty array`,
          });
        } catch (e) {
          checks.push({
            id: `parse:${rel}`,
            passed: false,
            detail: e instanceof Error ? e.message : "YAML parse failed",
          });
        }
      }

      return { gateId, passed: checks.every((c) => c.passed), checks };
    }

    case "architecture_complete": {
      const checks: GateCheck[] = [];
      const arch = join(projectRoot, "docs", "architecture.md");
      const api = join(projectRoot, "docs", "api-contracts.md");
      if (!(await pathExists(arch))) {
        checks.push({ id: "file:architecture.md", passed: false, detail: "docs/architecture.md missing" });
      } else {
        checks.push(...hasAll(await readUtf8(arch), ["## Context", "## Components"]));
      }
      if (!(await pathExists(api))) {
        checks.push({ id: "file:api-contracts.md", passed: false, detail: "docs/api-contracts.md missing" });
      } else {
        checks.push(...hasAll(await readUtf8(api), ["## Conventions", "## Endpoints"]));
      }
      return { gateId, passed: checks.every((c) => c.passed), checks };
    }

    case "task_ready_for_qa": {
      const taskId = context?.taskId;
      if (!taskId || taskId.length === 0) {
        return {
          gateId,
          passed: false,
          checks: [
            {
              id: "context:taskId",
              passed: false,
              detail: "Set currentTaskId in state or pass taskId when evaluating task_ready_for_qa",
            },
          ],
        };
      }
      const safe = taskId.replace(/[^a-zA-Z0-9._-]/g, "-");
      const p = join(projectRoot, "docs", "execution", `${safe}-implementation.md`);
      const ok = await pathExists(p);
      return {
        gateId,
        passed: ok,
        checks: [
          {
            id: "implementation-report",
            passed: ok,
            detail: ok ? `Found docs/execution/${safe}-implementation.md` : "Implementation report missing (run engineer)",
          },
        ],
      };
    }

    case "task_qa_approved": {
      const taskId = context?.taskId;
      if (!taskId || taskId.length === 0) {
        return {
          gateId,
          passed: false,
          checks: [
            {
              id: "context:taskId",
              passed: false,
              detail: "Set currentTaskId in state or pass taskId when evaluating task_qa_approved",
            },
          ],
        };
      }
      const safe = taskId.replace(/[^a-zA-Z0-9._-]/g, "-");
      const p = join(projectRoot, "qa", "reports", `${safe}-qa-report.md`);
      if (!(await pathExists(p))) {
        return {
          gateId,
          passed: false,
          checks: [{ id: "qa-report-file", passed: false, detail: "QA markdown report missing (run QA)" }],
        };
      }
      const text = await readUtf8(p);
      const approved =
        /\*\*Final status\*\*:\s*`approved`/i.test(text) || /\| `approved` \|/i.test(text);
      return {
        gateId,
        passed: approved,
        checks: [
          {
            id: "qa-approved",
            passed: approved,
            detail: approved ? "QA final status is approved" : "QA not approved or report incomplete",
          },
        ],
      };
    }

    case "technical_writer_complete":
      return markdownDocGate(projectRoot, gateId, "docs/living-documentation.md", [
        "## Executive summary",
        "## Doc coverage",
      ]);

    case "refactor_guardian_complete":
      return markdownDocGate(projectRoot, gateId, "docs/technical-health-report.md", [
        "## Focus",
        "## Heuristic findings",
      ]);

    case "integration_landscape_complete":
      return markdownDocGate(projectRoot, gateId, "docs/integration-landscape.md", [
        "## External systems",
        "## Contract touchpoints",
      ]);

    case "data_model_notes_complete":
      return markdownDocGate(projectRoot, gateId, "docs/data-model-notes.md", [
        "## Candidate entities",
        "## Relationships",
      ]);

    case "security_review_complete":
      return markdownDocGate(projectRoot, gateId, "docs/security-review.md", ["## Checklist", "## Findings"]);

    case "ux_review_complete":
      return markdownDocGate(projectRoot, gateId, "docs/ux-review.md", [
        "## Journey hypotheses",
        "## Friction radar",
      ]);

    case "sprint_plan_complete":
      return markdownDocGate(projectRoot, gateId, "docs/sprint-plan.md", [
        "## Proposed waves",
        "## Dependency rules",
      ]);

    case "cost_optimization_complete":
      return markdownDocGate(projectRoot, gateId, "docs/cost-optimization.md", [
        "## Policy draft",
        "## Guardrails",
      ]);

    case "observability_brief_complete":
      return markdownDocGate(projectRoot, gateId, "docs/observability-brief.md", [
        "## Recommended signals",
        "## Failure patterns",
      ]);

    case "release_readiness_complete":
      return markdownDocGate(projectRoot, gateId, "docs/release-readiness.md", ["## Gates", "## Release notes"]);

    case "portfolio_outlook_complete":
      return markdownDocGate(projectRoot, gateId, "docs/portfolio-outlook.md", [
        "## Relative priority",
        "## Cross-project prompts",
      ]);

    default:
      return {
        gateId,
        passed: false,
        checks: [{ id: "unknown", passed: false, detail: `Unknown gate: ${gateId}` }],
      };
  }
}
