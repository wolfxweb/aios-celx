---
description: Monorepo aios-celx — CLI, projectId, projects/ e separação agentes aios vs Antigravity
alwaysApply: true
---

# aios-celx Rules (Antigravity) 🚀

## CLI & Monorepo
- Corre **`pnpm exec aios`** a partir da **raiz** do monorepo (onde está `pnpm-workspace.yaml`).
- Não inventes caminhos; o CLI é a fonte de verdade para o estado.

## Project Context
- Cada projecto gerido vive em **`projects/<projectId>/`**.
- Sempre que falarmos de um projecto, utiliza ou pergunta pelo **`projectId`** explícito: `--project <id>`.

## Agent Orchestration
- Os **agentes do workflow** (ex. `requirements-analyst`) são executados pelo **CLI** (`aios run --agent`), não sou eu (Antigravity).
- Eu actuo como **orquestrador**, usando os **Workflows** em `.agents/workflows/` para disparar os agentes da CLI correctos.
- Engine padrão: **`mock-engine`**.

## Documentação
- Consulta sempre o **AGENTS.md** na raiz para uma orientação rápida sobre as pastas de cada projecto.
- Utiliza `@project/docs/` para referência a PRDs, arquitectura e descoberta.

## Verificação
- Garante que antes de aprovar um gate, os ficheiros YAML em `backlog/` estão coerentes com o PRD.
- Ao usar `aios-define-scope`, confirma se o utilizador quer um Novo Projecto, Nova Funcionalidade ou Correcção.
