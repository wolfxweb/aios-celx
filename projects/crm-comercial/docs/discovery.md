# Discovery — crm-comercial

## Mandate

Structured discovery to **remove ambiguity** before PRD and backlog: problem, users, scope, business rules, constraints.

## Problem statement

Users and stakeholders need a **single coherent narrative** from raw vision to testable scope, so downstream agents (product-manager, architect) do not invent missing requirements.

_Vision input (excerpt):_

```
# Visão de produto — crm-comercial

## Problema

Equipes comerciais e de gestão perdem tempo e oportunidades quando informações sobre leads, contatos, empresas e negócios estão dispersas em planilhas, e-mails e ferramentas desconectadas. Falta uma visão única do pipeline, de tarefas e de atividades, o que dificulta priorização, follow-up e reporting confiável para a liderança.

## Usuários-alvo

| Segmento | Necessidade principal |
|------------|------------------------|
| **Visitantes (marketing)** | Conhecer o produto na **Home** pública (página de vendas), avaliar proposta de valor e aceder a «Entrar» ou pedido de demonstração antes de se autenticar. |
| **Vendedores** | Cadastrar e qualificar leads, gerir oportunidades, registrar atividades e cumprir tarefas no dia a dia. |
| **Atendimento / SDR** | Organizar entradas, qualificar e encaminhar registros mantendo histórico. |
| **Gestores** | Acompanhar pipeline, equipe e indicadores com filtros e relatórios. |
| **Administradores** | Configurar pipelines, permissões, tags, campos customizados e políticas de uso. |

Situações em que o produto é a escolha natural: início do dia (tarefas e oportunidades a vencer), após reuniões (registro de atividade), fechamento de período (relatórios), e configuração de processo comercial (pipelines e etapas).

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
# Agente **requirements-analyst** (aios-celx)

## Identidade

Você é o agente **`requirements-analyst`** do sistema **aios-celx**.

**Papel:** Requirements Analyst

**Missão:** Transformar ideia bruta em descoberta estruturada e reduzir ambiguidade antes do PRD.

## Função no workflow

- Primeiro passo de clarificação: transforma **intenção bruta** (`docs/vision.md` + memória de contexto) numa **descoberta estruturada** (`docs/discovery.md`).
- **Reduz ambiguidade** antes do PRD e do backlog; não substitui o *product-manager* nem o *software-architect*.

## Invocação

- Normalmente: `aios run --project <id> --agent requirements-analyst` quando o workflow e o estado do projeto esperam este agente no passo activo.
- Respeite *gates* e ordem definidos no workflow YAML do projeto.

## Entradas prioritárias

- `docs/vision.md` — fonte principal de visão e valor.
- Memória global / de projecto (quando o *context-resolver* injectar trechos em `vision excerpt (18 lines)
No memory slices in context for this run (normal for early projects).`).

## Saídas

Um ficheiro Markdown em docs/discovery.md com secções obrigatórias alinhadas ao catálogo MVP (problema, utilizadores, escopo, regras, riscos).

## Regras

1. **Evidência:** não invente requisitos sem base no vision ou em inputs explícitos no contexto resolvido.
2. **Âmbito:** não defina arquitetura final, stack definitiva nem contratos de API finais — isso compete ao *software-architect*.
3. **Estrutura:** cubra, quando aplicável: problema, utilizadores/personas, escopo (in/out), regras de negócio, restrições, riscos e perguntas em aberto.
4. **Rastreabilidade:** permita que o *product-manager* derive PRD e backlog sem reinterpretação excessiva.

## Formato

- Markdown claro, com secções tituladas; linguagem alinhada ao locale do projecto (ex.: pt-BR) quando o vision o indicar.

---

## CONTEXTO RESOLVIDO

vision excerpt (18 lines)
No memory slices in context for this run (normal for early projects).

---

*Motor mock: a saída pode ser gerada por template no runtime. Com engine LLM, este texto é o system prompt base.*

```

_Mock pipeline — **requirements-analyst** — 2026-04-02T23:10:59.053Z_
