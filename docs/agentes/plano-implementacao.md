# Plano de implementação — núcleo de agentes e roadmap

Este documento alinha o **catálogo de agentes** (MVP, v2, v3) ao **estado atual do repositório** e define **fases** e **testes MVP obrigatórios**. Objetivo: com os **6 agentes do MVP** bem cobertos (comportamento + contratos + verificação), o fluxo aios-celx cobre descoberta → backlog → arquitetura → coordenação → implementação → QA.

## Estado atual no código (referência)

| Agente | Onde vive hoje | Comando / notas |
|--------|----------------|-----------------|
| `requirements-analyst` | `packages/agent-runtime/src/agents/requirements-analyst/` (`definition`, `prompt-template.md`, `output-schema.ts`, `run.ts`) | `aios run --agent requirements-analyst` |
| `product-manager` | `agents/product-manager/` | idem |
| `software-architect` | `agents/software-architect/` | idem |
| `delivery-manager` | `agents/delivery-manager/` | idem |
| `engineer` | `agents/engineer/` (contrato) + `engineer-task-runner.ts` (execução) | `aios run:task --project <id> --task <TASK>` |
| `qa-reviewer` | `agents/qa-reviewer/` (contrato) + `qa-task-runner.ts` | `aios run:qa --project <id> --task <TASK>`; `run --agent` → hint no CLI |

Convensão futura desejada (por agente): pasta com `definition`, template de prompt e schema de saída onde fizer sentido — ver discussão de produto; **este plano** não obriga refator imediata, mas recomenda **um agente piloto** (p.ex. `requirements-analyst`) quando existir engine LLM real.

---

## Fase 0 — Congelar o contrato MVP (documentação + registry)

**Objetivo:** uma única fonte de verdade para ids, entradas, saídas e missão dos 6 agentes MVP (este catálogo + `registry.ts` alinhados).

**Entregas:**

- Manter [README.md](./README.md) como índice humano.
- Garantir que `packages/agent-runtime/src/registry.ts` lista **todos** os MVP com `reads` / `writes` coerentes com a tabela abaixo (ajustar descrições se necessário).
- Documentar no README raiz ou em `docs/agentes` que `engineer` e `qa-reviewer` são **runners** dedicados, não apenas `aios run --agent`.

**Critério de saída:** revisão feita; ids estáveis; sem duplicação contraditória entre docs e `AgentDefinition`.

**No código (Fase 0 + início da 1):** `registry.ts` importa `definition.ts` de cada pasta em `src/agents/<id>/`; cada agente tem `prompt-template.md`, `output-schema.ts` e `run.ts` (ver `src/agents/README.md`). `engineer` e `qa-reviewer` têm handlers que **orientam** para `run:task` / `run:qa` se alguém usar `run --agent` por engano. `delivery-manager` agrega backlog + fila + `getNextStep`.

### Contrato resumido MVP (I/O)

| Agente | Entradas principais | Saídas principais |
|--------|---------------------|-------------------|
| `requirements-analyst` | `docs/vision.md`, memória projeto (v5+), contexto fundador (manual/prompt) | `docs/discovery.md` |
| `product-manager` | `docs/discovery.md` | `docs/prd.md`, `backlog/epics.yaml`, `stories.yaml`, `tasks.yaml` |
| `software-architect` | `discovery.md`, `prd.md`, `backlog/stories.yaml` | `docs/architecture.md`, `docs/api-contracts.md` |
| `delivery-manager` | workflow, `state`, fila, backlog (leitura agregada) | decisão operacional, fila (enqueue onde aplicável), `docs/delivery-status.md` |
| `engineer` | task, story, arquitetura, contratos, memória técnica | `docs/execution/<task>-implementation.md`, `backlog/tasks.yaml` (status), estado projeto |
| `qa-reviewer` | task, story, relatório execução, arquitetura, contratos | `qa/reports/*`, atualização QA / tasks em `tasks.yaml` |

---

## Fase 1 — MVP comportamental com `mock-engine` (já largamente existente)

**Objetivo:** os 6 agentes cumprem o **happy path** em projeto de smoke (ficheiros gerados/atualizados, gates coerentes).

**Trabalho técnico típico:**

- Refinar templates mock (Markdown/YAML) para refletirem responsabilidades do catálogo (entrevista, escopo, critérios de aceite, bloqueios, relatório QA).
- `delivery-manager`: garantir leitura de estado + fila + backlog nos relatórios; recomendações de “próximo passo” alinhadas ao workflow.
- Alinhar `context-resolver` (quando usado) aos paths e memória por agente.

**Critério de saída:** todos os **testes MVP** da secção seguinte passam manualmente (e, quando existirem, testes automatizados equivalentes).

---

## Fase 2 — Primeira engine LLM (opcional mas estratégica)

**Objetivo:** um agente piloto (recomendado: `requirements-analyst`) com `definition` + `prompt-template` + validação leve de saída; engine real atrás de `engine-adapters`.

**Dependências:** placeholders (`cursor`, `anthropic`, etc.) substituídos ou estendidos; segredos via env; política de autonomia respeitada.

**Critério de saída:** mesmo contrato de I/O da Fase 1, com saída gerada por LLM e validada onde aplicável.

---

## Fase 3 — Camada v2 (agentes 7–12)

**Objetivo:** introduzir ids novos no registry + workflow (passos opcionais ou paralelos), começando por **`technical-writer`** e **`security-reviewer`** se prioridade for documentação e risco.

**Critério de saída:** cada agente v2 tem `AgentDefinition`, handler ou runner, e documentação de entradas/saídas; integração com gates só quando o produto exigir.

---

## Fase 4 — Camada v3 (agentes 13–17)

**Objetivo:** capacidades transversais (portfolio, custo, observabilidade, release). Forte ligação a **multi-projeto**, **scheduler**, **API/dashboard** já previstos no plano 5–6.

**Critério de saída:** definido por milestone de produto (não bloqueia MVP).

---

## Testes MVP obrigatórios (checklist)

Executar na **raiz do monorepo**, com `projectId` de um projeto válido (ex.: projeto criado com `project:create`). Substituir `<project>` e `<TASK>` pelos valores reais.

### 1 — `requirements-analyst`

- [ ] Existe `projects/<project>/docs/vision.md` (mínimo).
- [ ] `pnpm exec aios run --project <project> --agent requirements-analyst` (com estado/workflow a apontar para este agente quando exigido).
- [ ] Gera ou actualiza `projects/<project>/docs/discovery.md` com estrutura reconhecível (problema, escopo, restrições, riscos ou equivalente).
- [ ] `pnpm exec aios next --project <project>` reflecte passo/gate coerente após o run (se aplicável).

### 2 — `product-manager`

- [ ] Entrada: `docs/discovery.md` presente.
- [ ] `pnpm exec aios run --project <project> --agent product-manager`.
- [ ] Existência e conteúdo mínimo de `docs/prd.md` e `backlog/epics.yaml`, `stories.yaml`, `tasks.yaml`.

### 3 — `software-architect`

- [ ] Entradas: discovery, prd, `backlog/stories.yaml`.
- [ ] `pnpm exec aios run --project <project> --agent software-architect`.
- [ ] `docs/architecture.md` e `docs/api-contracts.md` actualizados.

### 4 — `delivery-manager`

- [ ] `pnpm exec aios run --project <project> --agent delivery-manager` (quando for o agente activo esperado pelo estado).
- [ ] `docs/delivery-status.md` (e resumo, se aplicável) reflectem estado, engines e bloqueios conhecidos.
- [ ] `pnpm exec aios next --project <project>` mostra próximo passo / gate de forma consistente com o relatório.

### 5 — `engineer`

- [ ] Existe task pendente em `backlog/tasks.yaml` com id `<TASK>`.
- [ ] `pnpm exec aios run:task --project <project> --task <TASK>`.
- [ ] Task passa a `done` (ou fluxo documentado se excepção).
- [ ] Existe relatório em `docs/execution/<TASK>-implementation.md` (ou padrão de nome documentado).

### 6 — `qa-reviewer`

- [ ] Task com relatório de implementação disponível (após engineer ou equivalente).
- [ ] `pnpm exec aios run:qa --project <project> --task <TASK>`.
- [ ] Artefactos em `qa/reports/` para essa task; actualização de estado QA / tasks conforme implementação actual.

### Regressão mínima

- [ ] `pnpm build` na raiz após alterações em agent-runtime / workflow.
- [ ] `pnpm lint` na raiz (se o CI exigir).

---

## Ordem sugerida de implementação técnica (resumo)

1. Fase 0 — contrato e registry alinhados ao catálogo MVP.  
2. Fase 1 — mock’s e delivery-manager completos para “projeto andar”; testes MVP verdes.  
3. Fase 2 — piloto LLM num agente.  
4. Fases 3–4 — v2 e v3 por prioridade de produto.

Este ficheiro deve ser revisto quando novos agentes forem adicionados ao workflow YAML ou quando `default-software-delivery` ganhar passos extra.
