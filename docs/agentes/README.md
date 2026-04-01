# Catálogo de agentes — aios-celx

Visão de **papéis** desejados no framework (não confundir com pacotes `packages/*`). O **plano técnico** e **testes MVP** estão em [plano-implementacao.md](./plano-implementacao.md). Descrições completas (responsabilidades, I/O): [catalogo-detalhado.md](./catalogo-detalhado.md).

## Núcleo MVP (6 — obrigatório primeiro)

| ID | Papel | Missão |
|----|--------|--------|
| `requirements-analyst` | Ideia → descoberta | Tirar ambiguidade do projeto |
| `product-manager` | Discovery → backlog executável | Visão em trabalho priorizável |
| `software-architect` | Estrutura técnica e contratos | Evitar execução desorganizada |
| `delivery-manager` | Coordenação operacional | Fazer o projeto andar |
| `engineer` | Execução de tasks | Task → entrega técnica (+ relatório) |
| `qa-reviewer` | Validação pós-implementação | Impedir que trabalho frágil avance |

## Camada v2 (recomendada, após MVP sólido)

| ID | Papel |
|----|--------|
| `technical-writer` | Documentação viva, changelog, README do projeto |
| `refactor-guardian` | Dívida técnica, acoplamento, padrões |
| `integration-specialist` | Integrações externas (APIs, Stripe, WhatsApp, n8n, etc.) |
| `db-designer` | Modelagem de dados e impacto de schema |
| `security-reviewer` | Riscos básicos (auth, segredos, exposição) |
| `ux-reviewer` | Jornada, clareza, fricção |

## Camada v3 (futura / sistema maduro)

| ID | Papel |
|----|--------|
| `sprint-planner` | Sprints, capacidade, previsão |
| `cost-optimizer` | Custo de modelos e infra (LLM routing) |
| `observability-agent` | Logs, falhas, rastreabilidade |
| `release-manager` | Releases, release notes, prontidão de deploy |
| `portfolio-strategist` | Entre projetos, priorização, alocação |

## Leitura relacionada

- [Plano de implementação e testes MVP](./plano-implementacao.md)
- `docs/plano-execucao/README.md` e `docs/etapas/README.md` — ordem dos blocos e prompts longos; **só na tua cópia** se mantiveres essas pastas localmente (não vão no Git por omissão, ao contrário de `docs/agentes/`).
