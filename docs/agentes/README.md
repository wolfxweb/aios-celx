# Catálogo de agentes — aios-celx

Visão de **papéis** desejados no framework (não confundir com pacotes `packages/*`). O **plano técnico** e **testes MVP** estão em [plano-implementacao.md](./plano-implementacao.md). Descrições completas (responsabilidades, I/O): [catalogo-detalhado.md](./catalogo-detalhado.md).

## Núcleo MVP (6 — obrigatório primeiro)

| ID | Papel | Missão |
|----|--------|--------|
| `requirements-analyst` | Ideia → descoberta | Tirar ambiguidade do projeto |
| `product-manager` | Discovery → backlog executável | Visão em trabalho priorizável |
| `software-architect` | Estrutura técnica e contratos | Evitar execução desorganizada |
| `delivery-manager` | Coordenação operacional | Fazer o projeto andar |
| `engineer` | Execução de tasks | Task → entrega técnica (+ relatório) — **`aios run:task`** |
| `qa-reviewer` | Validação pós-implementação | Impedir que trabalho frágil avance — **`aios run:qa`** |

Os dois últimos aparecem no registry para I/O e `listAgents`, mas a execução real é pelos comandos indicados (`run --agent engineer|qa-reviewer` devolve mensagem a apontar para esses comandos).

## Camada v2 (recomendada, após MVP sólido)

Implementados como **mocks** em `packages/agent-runtime/src/agents/<id>/` — `pnpm exec aios run --project <id> --agent <agente>` (não entram no workflow YAML por defeito).

| ID | Papel | Saída principal (mock) |
|----|--------|-------------------------|
| `technical-writer` | Documentação viva, changelog, README do projeto | `docs/living-documentation.md` |
| `refactor-guardian` | Dívida técnica, acoplamento, padrões | `docs/technical-health-report.md` |
| `integration-specialist` | Integrações externas | `docs/integration-landscape.md` |
| `db-designer` | Modelagem de dados | `docs/data-model-notes.md` |
| `security-reviewer` | Riscos básicos | `docs/security-review.md` |
| `ux-reviewer` | Jornada, clareza, fricção | `docs/ux-review.md` |

## Camada v3 (futura / sistema maduro)

| ID | Papel | Saída principal (mock) |
|----|--------|-------------------------|
| `sprint-planner` | Sprints, capacidade, previsão | `docs/sprint-plan.md` |
| `cost-optimizer` | Custo de modelos e infra | `docs/cost-optimization.md` |
| `observability-agent` | Logs, falhas, rastreabilidade | `docs/observability-brief.md` |
| `release-manager` | Releases, readiness | `docs/release-readiness.md` |
| `portfolio-strategist` | Entre projetos (nota: mock usa só artefactos do projeto) | `docs/portfolio-outlook.md` |

## Leitura relacionada

- [Plano de implementação e testes MVP](./plano-implementacao.md)
- `docs/plano-execucao/README.md` e `docs/etapas/README.md` — ordem dos blocos e prompts longos; **só na tua cópia** se mantiveres essas pastas localmente (não vão no Git por omissão, ao contrário de `docs/agentes/`).
