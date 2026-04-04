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

| ID | Requirement |
|----|---------------|
| FR-001 | Artefactos geridos pelo CLI persistem sob `docs/` e `backlog/`. |
| FR-002 | Cada story possui pelo menos um critério de aceite mensurável. |

## Non-functional requirements

- **Performance:** operações CLI interactivas rápidas em disco local.
- **Security:** sem segredos em artefactos mock.

## Roadmap inicial (candidate)

| Fase | Focus |
|------|--------|
| Now | Fundação: PRD + backlog + alinhamento com discovery |
| Next | Primeira entrega técnica (tasks `in_progress` → `done`) |
| Later | Integrações e hardening conforme architect |


## Prompt template (reference — mock engine)

```
Você é o agente product-manager do sistema aios-celx.

PAPEL:
Product Manager

MISSÃO:
Transformar discovery em backlog executável (PRD, épicos, stories, tasks).

REGRAS:
- Gerar PRD e YAML de backlog coerentes com o discovery.
- Definir critérios de aceite verificáveis por story.
- Priorizar e manter rastreabilidade épico → story → task.

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

_Context / memory:_ No memory slices in context for this run (normal for early projects).

## Hypotheses

- H1: Early discovery reduces thrash in epics and acceptance criteria.
- H2: Listing constraints before architecture prevents “surprise integrations”.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vision drift | Medium | Re-sync `docs/vision.md` before planning gate |
| Missing stakeholders | High | Record owners in `docs/decision-log.md` |
| Assumed scope | High | Mark assumptions; validate before `product-manager` |

## Open questions

1. What is the measurable outcome for v1 (metric + timeframe)?
2. Which integrations are mandatory vs optional?
3. Who approves scope changes after discovery is “frozen”?


## Prompt template (reference — mock engine)

The following block records the **interpolated** system prompt template for traceability (future LLM engines will use this text directly):

```
Você é o agente requirements-analyst do sistema aios-celx.

PAPEL:
Requirements Analyst

MISSÃO:
Transformar ideia bruta em descoberta estruturada e reduzir ambiguidade antes do PRD.

REGRAS:
- Produzir `docs/discovery.md` alinhado ao vision e à memória de contexto quando existir.
- Não inventar requisitos sem evidência no vision
…

SAÍDAS:
docs/prd.md, backlog/epics.yaml, backlog/stories.yaml, backlog/tasks.yaml

```

_Mock — **product-manager** — 2026-04-01T23:14:33.508Z_
