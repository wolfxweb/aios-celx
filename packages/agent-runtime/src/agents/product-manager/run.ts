import { writeMarkdown, writeYaml } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import { interpolateTemplate, loadPromptTemplate } from "../../agent-kit/load-prompt.js";
import type { AgentExecutionContext } from "../../context.js";
import { OUTPUT_PATHS } from "./output-schema.js";
import { agentMission, agentRole } from "./definition.js";

const epicsDoc = {
  epics: [
    {
      id: "EPIC-1",
      title: "Fundamentação do produto",
      goal: "Estabelecer PRD, estrutura de backlog e primeira fatia de entrega.",
      status: "draft",
    },
  ],
};

const storiesDoc = {
  stories: [
    {
      id: "STORY-1",
      epicId: "EPIC-1",
      title: "Publicar PRD e backlog inicial",
      acceptance: [
        "PRD contém resumo, objetivos e requisitos traçáveis ao discovery",
        "Ficheiros backlog (epics, stories, tasks) existem e validam contra o schema",
      ],
      status: "draft",
    },
  ],
};

const tasksDoc = {
  tasks: [
    {
      id: "TASK-1",
      storyId: "STORY-1",
      title: "Completar PRD e YAML de backlog",
      description:
        "Garantir que backlog YAML valida e contém pelo menos uma task executável para o engenheiro (mock run:task).",
      type: "implementation",
      status: "todo",
      files: ["backlog/tasks.yaml", "docs/prd.md"],
      acceptanceCriteria: [
        "tasks.yaml faz parse com o schema de task",
        "Existe pelo menos uma task com id e storyId",
      ],
      notes: "Usada pelo fluxo engineer (Bloco 4.2) em modo mock.",
    },
  ],
};

export async function runProductManager(ctx: AgentExecutionContext): Promise<AgentResult> {
  const discovery = ctx.files["docs/discovery.md"] ?? "";

  let promptAppendix = "";
  try {
    const tpl = await loadPromptTemplate(import.meta.url);
    const filled = interpolateTemplate(tpl, {
      agent_id: "product-manager",
      role: agentRole,
      mission: agentMission,
      resolved_context: discovery.slice(0, 3000) + (discovery.length > 3000 ? "\n…" : ""),
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

  const prdBody = `# Product Requirements — ${ctx.projectId}

## Summary

PRD mock gerado a partir do discovery: descreve o que será construído, para quem, e como saberemos que v1 teve sucesso.

_Sinal do discovery (excerpt):_

\`\`\`
${discovery.split("\n").slice(0, 12).join("\n")}
\`\`\`

## Goals

1. Entregar uma **fatia vertical fina** que prove o workflow de valor principal.
2. Manter **rastreabilidade** épico → story → task → critérios de aceite.

## Personas / users (high level)

- **Utilizador principal:** perfil alinhado ao discovery (detalhar nomes e dores).
- **Operador / admin:** se aplicável ao produto.

## User stories (high level)

- Como membro da equipa, quero uma **fonte única de verdade** do scope para manter execução alinhada.
- Como stakeholder, quero **critérios de aceite** verificáveis por story.

## Functional requirements

| ID | Requirement |
|----|---------------|
| FR-001 | Artefactos geridos pelo CLI persistem sob \`docs/\` e \`backlog/\`. |
| FR-002 | Cada story possui pelo menos um critério de aceite mensurável. |

## Non-functional requirements

- **Performance:** operações CLI interactivas rápidas em disco local.
- **Security:** sem segredos em artefactos mock.

## Roadmap inicial (candidate)

| Fase | Focus |
|------|--------|
| Now | Fundação: PRD + backlog + alinhamento com discovery |
| Next | Primeira entrega técnica (tasks \`in_progress\` → \`done\`) |
| Later | Integrações e hardening conforme architect |
${promptAppendix}
_Mock — **product-manager** — ${new Date().toISOString()}_
`;

  const artifacts: string[] = [];
  const prdPath = "docs/prd.md";
  await writeMarkdown(join(ctx.projectRoot, prdPath), prdBody);
  artifacts.push(prdPath);

  for (const [rel, data] of [
    ["backlog/epics.yaml", epicsDoc],
    ["backlog/stories.yaml", storiesDoc],
    ["backlog/tasks.yaml", tasksDoc],
  ] as const) {
    await writeYaml(join(ctx.projectRoot, rel), data);
    artifacts.push(rel);
  }

  return {
    agentId: "product-manager",
    success: true,
    message: "Updated PRD and backlog YAML files.",
    artifactsWritten: artifacts,
  };
}
