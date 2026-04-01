# Catálogo detalhado — papéis, responsabilidades, I/O

Referência de produto. Índice curto: [README.md](./README.md). Plano técnico e testes: [plano-implementacao.md](./plano-implementacao.md).

**Implementação no código:** todos os IDs MVP + v2 + v3 estão registados em `packages/agent-runtime` com mocks (`run.ts` + `prompt-template.md`), salvo **engineer** / **qa-reviewer**, cujo trabalho real é feito por `runEngineerTask` / `runQaTask` (CLI: `aios run:task` / `aios run:qa`). Com `workflow: full-catalog-delivery`, estes dois aparecem como **passos globais** no fim do fluxo (gates `task_ready_for_qa` e `task_qa_approved`, usando `state.currentTaskId`). Nesse modo também podes usar `aios run --agent engineer` ou `aios run --agent qa-reviewer` quando o estado aponta para esse passo e `currentTaskId` está definido. O workflow por defeito (`default-software-delivery`) mantém só discovery → planning → architecture. Para mais do que uma task no mesmo projeto, após aprovar o gate de QA remove `task_ready_for_qa` e `task_qa_approved` de `completedGates` no estado (ou gere estado coerente) para voltar ao passo do engineer. Os agentes *advisory* podem correr avulso com `aios run --agent <id>` sem coincidir com `currentAgent`.

---

## MVP obrigatório (núcleo inicial)

### 1. `requirements-analyst`

**Papel:** transformar ideia bruta em descoberta estruturada.

**Responsabilidades:**

- Entrevistar / estruturar a necessidade  
- Entender problema  
- Mapear objetivo, utilizador, escopo inicial  
- Mapear regras de negócio e restrições  

**Entradas:** `docs/vision.md`, memória do projeto, contexto do fundador (fornecido pelo operador ou futuras integrações).

**Saídas:** `docs/discovery.md`

**Missão:** tirar ambiguidade do projeto.

---

### 2. `product-manager`

**Papel:** transformar discovery em backlog de produto.

**Responsabilidades:**

- Gerar PRD  
- Definir épicos, stories, tasks  
- Priorizar backlog  
- Definir critérios de aceite  
- Estruturar roadmap inicial  

**Entradas:** `docs/discovery.md`

**Saídas:** `docs/prd.md`, `backlog/epics.yaml`, `backlog/stories.yaml`, `backlog/tasks.yaml`

**Missão:** transformar visão em trabalho executável.

---

### 3. `software-architect`

**Papel:** definir a estrutura técnica do sistema.

**Responsabilidades:**

- Definir arquitetura, módulos, boundaries  
- Definir integrações e contratos de API  
- Definir stack e padrões técnicos  

**Entradas:** `docs/discovery.md`, `docs/prd.md`, `backlog/stories.yaml`

**Saídas:** `docs/architecture.md`, `docs/api-contracts.md`

**Missão:** evitar que a execução vire código desorganizado.

---

### 4. `delivery-manager`

**Papel:** coordenar o avanço operacional do projeto.

**Responsabilidades:**

- Analisar estado atual  
- Descobrir próximo passo, bloqueios, dependências  
- Recomendar próxima ação  
- Alimentar fila e manter cadência  

**Entradas:** workflow, `state`, fila, backlog  

**Saídas:** decisão operacional, fila (onde aplicável), `docs/delivery-status.md`

**Missão:** fazer o projeto andar.

---

### 5. `engineer`

**Papel:** executar tasks técnicas.

**Responsabilidades:**

- Pegar task, entender contexto  
- Propor / executar mudança técnica (futuro: código real com engine adequada)  
- Registar impacto, atualizar status  
- Produzir relatório técnico  

**Entradas:** task, story, arquitetura, contratos, memória técnica  

**Saídas:** relatório de execução, atualização de status; futuro: código  

**Missão:** transformar task em entrega técnica.

---

### 6. `qa-reviewer`

**Papel:** validar se a task foi bem executada.

**Responsabilidades:**

- Rever task, critérios de aceite, aderência à arquitetura e consistência  
- Apontar falhas; aprovar / pedir mudanças / bloquear  

**Entradas:** task, story, relatório de execução, arquitetura, contratos  

**Saídas:** `qa/reports/TASK-ID-qa-report.md` (padrão actual do runtime), estado QA nas tasks  

**Missão:** impedir que trabalho frágil avance no sistema.

---

## Camada v2 (recomendada)

### 7. `technical-writer`

Manter documentação viva: docs após mudanças, changelog, README do projeto, decisões (ligação a `decision-log.md`). **Missão:** evitar documentação morta.

### 8. `refactor-guardian`

Vigiar dívida técnica: acoplamento, duplicação, quebra de padrão; recomendar refactors. **Missão:** proteger qualidade estrutural.

### 9. `integration-specialist`

Integrações externas: mapear APIs, validar contratos, estruturar integrações (Stripe, Mercado Livre, WhatsApp, n8n, Supabase, etc.). **Missão:** reduzir caos em integrações.

### 10. `db-designer`

Modelagem, relacionamentos, constraints, impacto de mudanças de schema. **Missão:** evitar base de dados mal pensada.

### 11. `security-reviewer`

Auth, autorização, segredos, exposição de dados, endpoints sensíveis. **Missão:** evitar falhas previsíveis.

### 12. `ux-reviewer`

Jornada, clareza, fricção, consistência de experiência. **Missão:** evitar produto funcional mas difícil de usar.

---

## Camada v3 (futura)

### 13. `sprint-planner`

Agrupar tasks, capacidade, previsão de avanço.

### 14. `cost-optimizer`

Custo de modelos e infra; escolha de modelo, fallback económico (relevante com OpenAI / Anthropic / OpenRouter).

### 15. `observability-agent`

Logs, eventos, falhas, padrões de erro, confiabilidade.

### 16. `release-manager`

Releases, release notes, prontidão de deploy.

### 17. `portfolio-strategist`

Acima de um projeto: prioridades entre projetos, dependências entre produtos, alocação — útil em cenário multi-projeto.
