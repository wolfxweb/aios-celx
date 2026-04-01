# aios-celx

Framework em Node.js + TypeScript para orquestrar o desenvolvimento de software com **agentes**, **workflows** em YAML, **backlog** estruturado e **automação** governada (fila, scheduler, autonomia). 
Este repositório é o monorepo do CLI (`aios`), pacotes internos, API HTTP opcional e dashboard opcional.

Quem usa **Cursor** ou outro assistente sobre o repo: **[AGENTS.md](./AGENTS.md)** e o guia [docs/plano-execucao/00-guia-cursor-aios](./docs/plano-execucao/00-guia-cursor-aios/README.md).

## Requisitos e instalação

- **Node.js** 20+ e **pnpm** 9 (versão indicada em `package.json`).
- Na **raiz do monorepo**:

```bash
pnpm install
pnpm build
pnpm lint
```

- **CLI:** `pnpm exec aios` ou, após `pnpm link` em `apps/cli`, o comando `aios` no PATH.
- **Pasta de projetos geridos:** por omissão **`<raiz do monorepo>/projects`** (a raiz deteta-se a partir do cwd, p.ex. via `pnpm-workspace.yaml`). Sobrescreva com **`AIOS_PROJECTS_ROOT`** (absoluto ou relativo ao processo) se precisar de outro sítio.
- **Raiz do monorepo em ferramentas externas:** opcional **`AIOS_CELX_ROOT`** ou **`AIOS_MONOREPO_ROOT`** quando o processo não corre de dentro da árvore do repo.

## Configuração

### Variáveis de ambiente (resumo)

| Variável | Uso |
|----------|-----|
| `AIOS_PROJECTS_ROOT` | Onde vivem os projetos geridos (`projects/<id>/`). |
| `AIOS_CELX_ROOT` / `AIOS_MONOREPO_ROOT` | Raiz do monorepo (memória global, registry, portfolio). |
| `AIOS_API_HOST`, `AIOS_API_PORT` | API local (omissão `127.0.0.1:3030`). |
| `VITE_API_BASE_URL` | Dashboard (Vite): URL base da API (omissão `http://127.0.0.1:3030`). |

### Por projeto: `projects/<id>/.aios/config.yaml`

Ficheiro central do projeto gerido:

- **`projectId`**, **`blueprint`**, **`workflow`** — id do workflow (ficheiro em `packages/workflow-engine/workflows/`, omissão `default-software-delivery`).
- **`engines`** — roteamento de motores de execução: obrigatório **`default`**; chaves adicionais são **ids de agente** → **id de engine** (ex.: `requirements-analyst: mock-engine`). Hoje o motor útil por defeito é **`mock-engine`**; outros ids (`claude-code`, `codex`, `cursor`) são *stubs* até integração real.
- **`git`** — integração Git só na pasta do projeto (`enabled`, `autoInit`, prefixos de branch/commit).
- **`autonomy`** — política do scheduler (ver abaixo); campos opcionais são fundidos com omissões seguras.
- **`name`**, **`status`**, **`priority`**, **`tags`** — metadados alinhados ao registry multi-projeto.

Estado em tempo de execução: **`projects/<id>/.aios/state.json`**. Backlog: **`backlog/epics.yaml`**, **`stories.yaml`**, **`tasks.yaml`**.

### Ecossistema (monorepo)

| Ficheiro / pasta | Função |
|------------------|--------|
| `.aios/projects-registry.yaml` | Registo de projetos (ids, paths, prioridades, tags). |
| `.aios/portfolio.yaml` | Portfolio (lista de projetos, prioridades, grupos). |
| `.aios/global-memory.json` | Memória partilhada entre projetos. |
| `projects/<id>/.aios/memory/project-memory.json` | Memória por projeto. |
| `projects/<id>/.aios/queue.json` | Fila de execução assíncrona. |
| `projects/<id>/.aios/logs/*.log` | Logs JSONL (execuções, fila, scheduler, autonomia, memória, etc.). |

## Recursos do sistema

| Recurso | Descrição |
|---------|-----------|
| **Workflow** | Passos, agentes e *gates* definidos em YAML; comandos `next`, `run`, `approve` avançam o fluxo. |
| **Agentes** | Executados via **engine** resolvida por agente; contexto montado pelo **context-resolver** (ficheiros + memória filtrada). |
| **Backlog** | Epics, stories e tasks com estados; `run:task`, `run:qa`, `run:story` para fluxos de implementação e QA. |
| **Memória** | Global e por projeto; categorias por agente (`AGENT_MEMORY_CATEGORIES` em `@aios-celx/memory-system`). |
| **Registry / portfolio** | Listagem, filtros e visão agregada de vários projetos. |
| **Fila + scheduler** | Enfileirar trabalhos; `scheduler:run` processa a fila respeitando **autonomia** e aprovações. |
| **API + dashboard** | HTTP para integrações e UI de leitura/controlo (ver READMEs em `apps/api` e `apps/dashboard`). |

## Agentes (catálogo)

Registados em `@aios-celx/agent-runtime` e executáveis com `aios run --project <id> --agent <id>` (quando o estado do projeto espera esse agente), salvo onde está indicado outro comando. Com **`mock-engine`**, a maior parte dos agentes escreve relatórios e YAML de exemplo de forma determinística.

**Implementação e QA por task:** **engineer** e **qa-reviewer** têm *runners* dedicados — preferir `aios run:task` e `aios run:qa` com `--task`. Se o projeto usa o workflow **`full-catalog-delivery`** e o passo activo é o desses agentes, `aios run --agent engineer` ou `qa-reviewer` também invoca o mesmo *runner*, desde que exista **`currentTaskId`** no estado (`.aios/state.json`).

| ID | O que faz |
|----|-----------|
| `requirements-analyst` | **MVP** — Da visão bruta à descoberta estruturada (`docs/discovery.md`); reduz ambiguidade antes do PRD. |
| `product-manager` | **MVP** — Da descoberta ao backlog executável: PRD, épicos, stories, tasks e critérios de aceite. |
| `software-architect` | **MVP** — Arquitectura, módulos, *boundaries*, integrações, contratos de API, stack e padrões (`architecture` + `api-contracts`). |
| `delivery-manager` | **MVP** — Coordenação operacional: estado, passo do workflow, *gates*, fila, saúde do backlog, bloqueios e comandos sugeridos (`delivery-status` / `delivery-summary`). |
| `engineer` | **MVP** — Executa o trabalho técnico **por task**: relatório de implementação e actualização de estado da task (ver `run:task`). |
| `qa-reviewer` | **MVP** — Revisa a entrega da task face a critérios de aceite e arquitectura; relatórios QA e estado QA na task (ver `run:qa`). |
| `technical-writer` | **v2** — Documentação viva: sumário de decisões, *changelog* sugerido, alinhamento com README e *decision-log*. |
| `refactor-guardian` | **v2** — Sinaliza dívida técnica, acoplamento e desvio de padrões (relatório orientador). |
| `integration-specialist` | **v2** — Mapa de integrações externas, riscos e contratos (e.g. pagamentos, mensagens, *backend* externo). |
| `db-designer` | **v2** — Notas de modelo de dados, entidades e impacto de *schema* (sem migrações reais no *mock*). |
| `security-reviewer` | **v2** — *Checklist* de riscos: autenticação, segredos, exposição de dados, superfície de API. |
| `ux-reviewer` | **v2** — Jornada, clareza, fricção e consistência de experiência (relatório qualitativo). |
| `sprint-planner` | **v3** — Agrupa tasks por onda ou *sprint*, dependências e ordem sugerida. |
| `cost-optimizer` | **v3** — Rascunho de política de custo (LLM/infra), *fallback* económico e limites (*mock*, sem *billing* real). |
| `observability-agent` | **v3** — *Brief* de logs, correlação, falhas e rastreabilidade operacional. |
| `release-manager` | **v3** — Prontidão de *release*: critérios, notas e *snapshot* do backlog. |
| `portfolio-strategist` | **v3** — Visão entre projectos: priorização relativa e dependências (*mock*; *portfolio* real vem do monorepo). |

Workflow em cadeia com a maior parte destes papéis: ficheiro **`full-catalog-delivery`** em `packages/workflow-engine/workflows/` (activar com `workflow: full-catalog-delivery` em `.aios/config.yaml`). O fluxo mínimo por defeito é só descoberta → planeamento → arquitectura (**`default-software-delivery`**).

## Uso (CLI)

Criação e visão geral: em **`project:create`**, omitir **`--blueprint`** usa o blueprint por omissão do sistema (hoje **`saas-webapp`**, definido em `@aios-celx/blueprints`).

```bash
pnpm exec aios project:create meu-projeto
# ou: pnpm exec aios project:create meu-projeto --blueprint saas-webapp
pnpm exec aios project:list
pnpm exec aios project:show --project meu-projeto
pnpm exec aios status --project meu-projeto
```

Workflow e agentes:

```bash
pnpm exec aios next --project meu-projeto
pnpm exec aios next --project meu-projeto --sync
pnpm exec aios run --project meu-projeto --agent requirements-analyst
pnpm exec aios approve --project meu-projeto --gate discovery_complete
```

Backlog e execução:

```bash
pnpm exec aios run:task --project meu-projeto --task TASK-1
pnpm exec aios run:qa --project meu-projeto --task TASK-1
pnpm exec aios run:story --project meu-projeto --story STORY-1 --with-qa
```

Memória, fila e scheduler:

```bash
pnpm exec aios memory:project:list --project meu-projeto
pnpm exec aios queue:list --project meu-projeto
pnpm exec aios scheduler:run --project meu-projeto
pnpm exec aios autonomy:show --project meu-projeto
```

Git (opcional, só dentro de `projects/<id>/`):

```bash
pnpm exec aios git:status --project meu-projeto
```

API e dashboard (após `pnpm build`):

```bash
pnpm --filter @aios-celx/api start
pnpm --filter @aios-celx/dashboard dev
```

Detalhes de rotas e env: **[apps/api/README.md](apps/api/README.md)** · **[apps/dashboard/README.md](apps/dashboard/README.md)**.

## Personalizar agentes e automação

### Motores (`engines`)

Em **`projects/<id>/.aios/config.yaml`**, a secção **`engines`** define qual **engine** executa cada agente. O mínimo é:

```yaml
engines:
  default: mock-engine
```

Pode fixar agentes concretos (quando o motor existir e estiver disponível):

```yaml
engines:
  default: mock-engine
  product-manager: mock-engine
```

Novos motores devem implementar o contrato **`BaseEngine`** em `@aios-celx/engine-adapters` e registar-se como pacote; até lá, **`mock-engine`** simula a execução.

### Workflow

O campo **`workflow`** aponta para um ficheiro em **`packages/workflow-engine/workflows/`** (por omissão **`default-software-delivery`**). Alterar o workflow muda passos, agentes e *gates*; mantenha o estado do projeto coerente com o novo fluxo (ou crie projeto novo).

### Contexto e memória por agente

O **`context-resolver`** junta ficheiros de documentação, backlog e **memória** filtrada por regras por agente. Para influenciar o que cada agente “vê”, use entradas de memória com **categorias** adequadas e consulte **`AGENT_CONTEXT_RULES`** / **`AGENT_MEMORY_CATEGORIES`** em `@aios-celx/context-resolver` e `@aios-celx/memory-system`.

### Autonomia (scheduler)

A secção **`autonomy`** em `config.yaml` controla se o scheduler pode correr tarefas automaticamente (`autoRunTask`, `autoRunQA`, `autoRunStory`), limites (`maxAutoSteps`), paragens (`haltOn*`) e categorias que exigem aprovação (`requireApprovalFor`). Comandos: `autonomy:show`, `autonomy:check`, `autonomy:toggle`.

### Paralelismo na fila (opcional)

Com **`scheduler:run --max-concurrent 2`** (ou o mesmo campo no `POST` da API), dois itens só correm em paralelo se tiverem **stories** distintas e **`metadata.touchPaths`** declarados sem sobreposição; caso contrário o plano fica sequencial. Ver **[packages/scheduler/README.md](packages/scheduler/README.md)**.
