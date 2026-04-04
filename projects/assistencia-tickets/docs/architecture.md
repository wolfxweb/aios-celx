# Architecture — assistencia-tickets

> **Scope:** descreve a arquitetura do **produto gerido** neste projeto (`assistencia-tickets`), não a do monorepo aios-celx salvo quando esse _é_ o produto.

## Context & boundaries

- **Problem space:** derivado de discovery + PRD (excertos abaixo).
- **System boundary:** o que pertence a este produto vs integrações externas (listar quando conhecidas).
- **Trust boundaries:** dados sensíveis, auticação, exposição de APIs.

**Discovery (excerpt)**

```
# Discovery — assistencia-tickets

## Mandate

Structured discovery to **remove ambiguity** before PRD and backlog: problem, users, scope, business rules, constraints.

## Problem statement

Users and stakeholders need a **single coherent narrative** from raw vision to testable scope, so downstream agents (product-manager, architect) do not invent missing requirements.

```

**PRD (excerpt)**

```
# Product Requirements — assistencia-tickets

## Summary

PRD mock gerado a partir do discovery: descreve o que será construído, para quem, e como saberemos que v1 teve sucesso.

_Sinal do discovery (excerpt):_

```
# Discovery — assistencia-tickets
```

## Components (logical)

| Módulo / componente | Responsabilidade | Notas |
|--------------------|------------------|--------|
| **Client / UI** | Interação do utilizador | Web, mobile ou CLI conforme produto |
| **Application / API** | Casos de uso, orquestração | Serviço principal |
| **Dados** | Persistência, consistência | Bases, caches, filas |
| **Integrações** | Sistemas externos | Preencher com APIs reais quando existirem |

## Modules & boundaries

- Definir **fronteiras** entre módulos (DDD leve ou camadas).
- Evitar acoplamento circular; documentar dependências permitidas.

## Technical stack (candidate)

| Camada | Escolha (draft) |
|--------|------------------|
| Runtime | TBD (ex.: Node, Bun, JVM) |
| API | TBD (ex.: HTTP REST, RPC) |
| Data | TBD (ex.: Postgres, SQLite) |
| Observability | Logs estruturados, traços (TBD) |

## Data & storage (high level)

- Entidades principais alinhadas ao PRD (não modelo ERD completo no mock).
- Estratégia de migrações / versão de schema: TBD.

## Patterns & conventions

- Estilo de commits, branches (se Git activo no projecto).
- Erros, idempotência, paginação em APIs públicas.


## Prompt template (reference — mock engine)

```
Você é o agente software-architect do sistema aios-celx.

PAPEL:
Software Architect

MISSÃO:
Definir estrutura técnica, módulos, boundaries e contratos de API do produto gerido.

REGRAS:
- Arquitetura descreve o **produto** em `projects/<id>/`, não o monorepo aios salvo se esse for o produto.
- Alinhar componentes e APIs ao PRD e às stories.

CONTEXTO:
# Discovery — assistencia-tickets

## Mandate

Structured discovery to **remove ambiguity** before PRD and backlog: problem, users, scope, business rules, constraints.

## Problem statement

Users and stakeholders need a **single coherent narrative** from raw vision to testable scope, so downstream agents (product-manager, architect) do not invent missing requirements.

_Vision input (excerpt):_

```
# Vision — assistencia-tickets

## Problem

Define the core user problem this product solves.

## Target users

Who benefits, and in what situations do they reach for this product?

## Outcomes

What measurable or qualitative outcomes define success?

## Non-goals

What we explicitly will not solve in the first iterations.

```

## Goals & users

| | (draft — refine with stakeholders) |
|--|--------------------------------------|
| **Primary goal** | Deliver measurable value described in vision; define v1 success metric. |
| **Primary users** | TBD from vision / interviews (list personas when known). |
| **Non-goals (v1)** | Explicitly list what is out of scope to prevent scope creep. |

## Scope (initial)

### In scope (candidate)

- Core workflow or slice implied by vision.
- Deliver
---
# Product Requirements — assistencia-tickets

## Summary

PRD mock gerado a partir do discovery: descreve o que será construído, para quem, e como saberemos que v1 teve sucesso.

_Sinal do discovery (excerpt):_

```
# Discovery — assistencia-tickets

## Mandate

Structured discovery to **remove ambiguity** before PRD and backlog: problem, users, scope, business rules, constraints.

## Problem statement

Users and stakeholders need a **single coherent narrative** from raw vision to testable scope, so downstream agents (product-manager, architect) do not invent missing requirements.

_Vision input (excerpt):_

```

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

| ID | Requ
---
stories:
  - id: STORY-1
    epicId: EPIC-1
    title: Publicar PRD e backlog inicial
    acceptance:
      - PRD contém resumo, objetivos e requisitos traçáveis ao discovery
      - Ficheiros backlog (epics, stories, tasks) existem e validam contra o
        schema
    status: draft



SAÍDAS:
docs/architecture.md, docs/api-contracts.md

```

_Mock — **software-architect** — 2026-04-01T23:14:45.431Z_
