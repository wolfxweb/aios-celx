# Orientação para agentes (Cursor e similares)

Este ficheiro resume como trabalhar **no monorepo aios-celx** sem desalinhar o framework.

## Raiz e CLI

- Abre o workspace na **raiz** do repositório (onde está `pnpm-workspace.yaml`).
- O CLI chama-se **`aios`**. Na raiz usa **`pnpm exec aios`** (ou `aios` no PATH após `pnpm link` em `apps/cli`).
- Comandos e variáveis de ambiente: **[README.md](./README.md)**.

## Projetos geridos (`projectId`)

- Cada produto/app gerido pelo aios vive em **`projects/<projectId>/`** (omissão: pasta `projects/` na raiz do monorepo; override: `AIOS_PROJECTS_ROOT`).
- Configuração: **`projects/<projectId>/.aios/config.yaml`**. Estado: **`.aios/state.json`**, backlog em **`backlog/*.yaml`**, docs em **`docs/`**.
- Nos pedidos, indica sempre o **`projectId`** e anexa ficheiros relevantes com `@caminho`.

## Agentes aios vs assistente do IDE

- Os **agentes** do workflow (`requirements-analyst`, `engineer`, etc.) são executados pelo **CLI** (`run`, `next`, `approve`, `run:task`, `run:qa`), não são o modo Agent do Cursor em si.
- No **Cursor**, comandos personalizados sob **`.cursor/commands/`** (`/aios-define-scope`, `/aios-next`, `/aios-status`, `/aios-run-agent`, `/aios-approve-gate`, `/aios-task-qa`) injetam um roteiro para o assistente **correr `pnpm exec aios …` no terminal** onde aplicável e interpretar o resultado. Após clonar o repo e abrir a **raiz** como workspace, escreve **`/`** no chat para os ver. Ver [docs/plano-execucao/00-guia-cursor-aios/README.md](./docs/plano-execucao/00-guia-cursor-aios/README.md) — secção «Comandos `/` do Cursor».
- O motor por defeito é **`mock-engine`**; a engine **`cursor`** em `packages/engine-adapters` é **stub** até existir integração real.

## Catálogo de agentes (MVP, roadmap, testes)

- **Versionado no Git:** **[docs/agentes/README.md](./docs/agentes/README.md)** — núcleo de 6 agentes, v2, v3, ligação ao [plano de implementação e testes MVP](./docs/agentes/plano-implementacao.md).
- **Definição por pasta (prompt + saída):** `packages/agent-runtime/src/agents/<id>/` — `definition.ts`, `prompt-template.md`, `output-schema.ts`, `run.ts` (ver `packages/agent-runtime/src/agents/README.md`). Inclui **v2 e v3** do catálogo (mocks); agentes *advisory* podem correr com `run --agent` sem coincidir com o passo activo do workflow (`canRunWithoutCurrentAgentMatch`).

## Plano de execução (desenvolvimento do framework)

- Ordem das etapas e checklists: `docs/plano-execucao/README.md` (pode existir só em cópias locais; não está no Git por omissão).
- Fluxo Cursor + aios: `docs/plano-execucao/00-guia-cursor-aios/` no mesmo caso.

## Verificação rápida

- Na raiz: `pnpm install`, `pnpm build`, `pnpm lint` quando alteras código do monorepo.
- Para um projeto gerido: `pnpm exec aios status --project <projectId>`.
