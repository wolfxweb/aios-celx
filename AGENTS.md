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

- Os **agentes** do workflow (`requirements-analyst`, `engineer-task-runner`, etc.) são executados pelo **CLI** (`run`, `next`, `approve`), não são o modo Agent do Cursor.
- O motor por defeito é **`mock-engine`**; a engine **`cursor`** em `packages/engine-adapters` é **stub** até existir integração real.

## Plano de execução (desenvolvimento do framework)

- Ordem das etapas e checklists: **[docs/plano-execucao/README.md](./docs/plano-execucao/README.md)**.
- Fluxo Cursor + aios (onboarding): **[docs/plano-execucao/00-guia-cursor-aios/README.md](./docs/plano-execucao/00-guia-cursor-aios/README.md)**.

## Verificação rápida

- Na raiz: `pnpm install`, `pnpm build`, `pnpm lint` quando alteras código do monorepo.
- Para um projeto gerido: `pnpm exec aios status --project <projectId>`.
