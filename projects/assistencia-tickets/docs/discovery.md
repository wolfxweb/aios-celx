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
- Não inventar requisitos sem evidência no vision ou inputs explícitos.
- Não definir arquitetura final (isso é software-architect).

LIMITES:
- Motor mock: saída é gerada por template no runtime; com engine LLM, este texto torna-se system prompt.

CONTEXTO (resumo):
vision excerpt (18 lines)
No memory slices in context for this run (normal for early projects).

FORMATO DE SAÍDA:
Um ficheiro Markdown em docs/discovery.md com secções obrigatórias alinhadas ao catálogo MVP (problema, utilizadores, escopo, regras, riscos).

TAREFA:
Executar a função com base no contexto e gravar o artefacto principal em docs/discovery.md.

```

_Mock pipeline — **requirements-analyst** — 2026-04-01T23:14:15.575Z_
