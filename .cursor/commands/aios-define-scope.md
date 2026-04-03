---
description: Orquestrador — PRD, novo projeto com api-contracts + architecture + discovery, relatorio-final.md, backlog YAML; pronto para aprovação (não substitui o CLI)
---

Este comando guia **uma sessão de definição e aprovação** antes de programar. O **estado do workflow aios** (`.aios/state.json`, *gates*) só muda com **`pnpm exec aios`** na raiz do monorepo — aqui deixas **docs e backlog** alinhados para o utilizador **aprovar** ou ajustar; só depois se avança para código ou agentes CLI.

**Pacote mínimo para fecho:** **`docs/prd.md`**, **`docs/relatorio-final.md`** (ver Passo 5), **`docs/product-definition-notes.md`** (notas de trabalho; opcional mas recomendado), **acordo explícito sobre testes** com o utilizador (ver **Testes e casos de teste** abaixo), **`backlog/epics.yaml`**, **`backlog/stories.yaml`**, **`backlog/tasks.yaml`**. **Cria** épicos, stories e tasks que **cobrem explicitamente tudo o que foi solicitado** (pedido → YAML). Conteúdo **coerente** com o PRD (ver Passo 3). Sem isso, o trabalho **não** está «pronto para aprovação».

**Novo projeto (adicional obrigatório):** além do acima, **`docs/api-contracts.md`**, **`docs/architecture.md`** e **`docs/discovery.md`** com texto **alinhado ao âmbito** (não basta o scaffold vazio do blueprint). Os três entram na **checklist** de **`relatorio-final.md`** (Passo 5).

## Passo 0 — Primeira interacção (obrigatório)

Na **primeira resposta útil**, pergunta **explicitamente** e regista a escolha:

1. **Novo projeto** — produto ou pasta de trabalho nova em `projects/<projectId>/`.
2. **Nova funcionalidade** — alteração sobre um projeto **já existente** (âmbito novo).
3. **Correção** — bug, regressão ou ajuste de comportamento num projeto existente.

**Não** mistures estes três no discurso sem o utilizador ter escolhido; se o pedido for ambíguo, **para e pergunta**. Para **funcionalidade** e **correção**, o passo seguinte é sempre **qual é o `projectId`** (nome da pasta em `projects/`) — confirma com o utilizador e **verifica** se existe (`projects/<id>/.aios/config.yaml` ou listagem de `projects/`).

## Passo 1 — PRD no ficheiro **`prd.md`**

O PRD **não** fica só nas notas: **cria ou actualiza** **`projects/<projectId>/docs/prd.md`** — é o documento com **nome de PRD** do projecto (ficheiro canónico `prd.md` na pasta `docs/`).

Com o utilizador, fecha **problema, objectivo, âmbito, dentro/fora, critérios de sucesso** e escreve isso em **`prd.md`**. **Inclui pelo menos** as secções **`## Summary`** e **`## Goals`** (alinhado à *gate* `planning_complete` do workflow por defeito). Podes acrescentar outras secções úteis (requisitos, não-objectivos, métricas, etc.).

- Em **`product-definition-notes.md`**, podes manter um resumo executivo ou remeter explicitamente a **`prd.md`** como fonte do PRD; o **contrato** para aprovação e para o backlog é o conteúdo de **`prd.md`** + YAML.
- **Novo projeto:** o `prd.md` descreve o MVP; os épicos/stories/tasks no YAML derivam deste PRD.
- **Nova funcionalidade / correção:** **actualiza** `prd.md` com secção ou bloco claro sobre **o que muda** (ou um PRD “delta” no mesmo ficheiro); o backlog YAML reflecte **só** o trabalho novo, com **`epicId` / `storyId`** consistentes com o repositório.

### Testes e casos de teste — **acordo com o utilizador (obrigatório)**

**Padrão do fluxo:** **testes unitários** fazem parte da **estratégia por omissão** — o código entregue deve ser acompanhado de **testes unitários** alinhados às stories/tasks (cobertura mínima acordada por módulo ou por critério de aceite), salvo **opt-out explícito** do utilizador.

**Pergunta ao utilizador** antes de fechar o pacote, de forma explícita:

1. **Confirma o padrão:** aceita **testes unitários** para as alterações / módulos em âmbito? (Se **sim** ou silêncio com aceitação implícita após explicares o padrão, regista **«Testes unitários: sim (padrão)»** em **`## Estratégia de testes`**.)
2. **Opt-out:** se **não** quiser testes unitários (protótipo, spike, legado sem testes, etc.), o utilizador tem de **dizer explicitamente**; regista **«Testes unitários: N/A — acordado (motivo: …)»** no PRD.
3. **Outros testes a pedido do utilizador:** o utilizador **pode pedir** explicitamente outros tipos — por exemplo **integração**, **e2e**, **contrato (API)**, **carga/desempenho**, **segurança**, **acessibilidade**, **smoke de release**, **testes manuais exploratórios**, etc. **Regista** o que foi pedido em **`## Estratégia de testes`** e reflecte no **backlog** (tasks/stories) e em **`casos-de-teste.md`** quando fizer sentido.
4. **Sugestões tuas (assistente):** podes **recomendar** camadas ou casos adicionais que o utilizador **não** pediu (ex.: e2e mínimo num fluxo crítico, contrato numa API nova). Isso **não** entra no âmbito fechado sem acordo — vai para o **`relatorio-final.md`** (ver Passo 5, secção **Sugestões**).
5. **Só critérios de aceite** nas stories (sem `casos-de-teste.md`) vs **ficheiro de casos** — combina com o utilizador.

**Regista tudo** em **`docs/prd.md`**, secção **`## Estratégia de testes`**: padrão unitário, opt-out se houver, **pedidos explícitos** do utilizador (outros testes), e N/A onde aplicável. As **sugestões** do assistente **não** duplicam aqui como compromisso — ficam no relatório final até o utilizador adoptar.

- Com **testes unitários no padrão**, as **tasks** no YAML devem, quando fizer sentido, incluir trabalho de **testes unitários** (título ou `acceptanceCriteria` a referir cobertura mínima ou ficheiros-alvo), **sem** implementar código aqui — só plano no backlog.
- Se o utilizador **quiser casos de teste documentados** (manual / regressão / e2e descrito): **cria ou actualiza** **`docs/casos-de-teste.md`** — **ID**, **Story / âmbito**, **pré-condição**, **passos**, **resultado esperado** (tipo: unitário referenciado, integração, regressão, smoke, etc.). Alinha a **`casos-de-teste.md`** ao PRD e às stories; onde couber, referencia **cenários cobertos por testes unitários** vs manuais.
- Se **não** houver ficheiro de casos: deixa explícito no PRD / **`relatorio-final.md`** (N/A acordado). **Não** deixes em silêncio.

**Nunca** encerres como «pronto para aprovação» sem **`## Estratégia de testes`** no PRD (incluindo **padrão de testes unitários** ou **opt-out** explícito) e, quando aplicável, **`casos-de-teste.md`**.

## Passo 2 — Projecto e documentação em `projects/<projectId>/`

### Se for **novo projeto**

1. Acorda o **`projectId`** (minúsculas, números, hífens).
2. Se a pasta **não existir**: indica `pnpm exec aios project:create <projectId>` ([README.md](../../README.md)).
3. Depois de criado, **cria ou actualiza** docs alinhados ao blueprint: **`docs/prd.md`** (obrigatório neste fluxo), **`docs/api-contracts.md`** (convenções HTTP, endpoints e esquemas alinhados ao PRD), **`docs/architecture.md`** (contexto, componentes, modelo de dados lógico, segurança relevante, proposta de stack ou referência a ADRs), **`docs/discovery.md`** (hipóteses, restrições, riscos, questões abertas), `docs/product-definition-notes.md`, **`docs/casos-de-teste.md`** *se* o utilizador acordou casos documentados (ver secção **Testes e casos de teste**), e onde fizer sentido `vision.md` — `prd.md` leva o **texto principal do PRD**; `api-contracts`, `architecture` e `discovery` são **obrigatórios com conteúdo real** para **novo projeto** (não substituir por placeholders genéricos). Refinar depois com agentes CLI se preciso.

### Se for **nova funcionalidade** ou **correção**

1. Garante **`projectId`** existente.
2. **Actualiza** **`docs/prd.md`** (alterações pedidas) **e** `docs/product-definition-notes.md` (**Âmbito**, **Actual vs desejado**, **Critérios de aceite**, **Riscos**) quando útil. **Actualiza** também **`docs/api-contracts.md`**, **`docs/architecture.md`** e **`docs/discovery.md`** quando o âmbito afectar API, decisões técnicas ou hipóteses/riscos.
3. **Não** implementes código de aplicação; após aprovação: `pnpm exec aios next`, `run --agent …`, `run:task`, etc.

## Passo 3 — Backlog completo (YAML) — **obrigatório para «pronto para aprovação»**

**Regra de ouro:** **tens de criar** (ou acrescentar, em feature/correção) **épicos, stories e tasks** que **materializem o que o utilizador pediu** — cada requisito ou item de âmbito acordado deve aparecer na cadeia **epic → story → task** (ou ficar justificado em **`relatorio-final.md`** se for explicitamente fora de âmbito). **Não** uses apenas placeholders genéricos nem omitas partes do pedido sem o utilizador aceitar.

Antes de pedires aprovação final, **preenche ou actualiza** os três ficheiros (estrutura esperada pelo monorepo: `epics` / `stories` / `tasks` como chaves de raiz):

| Ficheiro | Conteúdo esperado |
|----------|-------------------|
| **`backlog/epics.yaml`** | Lista `epics`: `id`, `title`, `goal` opcional, `status` opcional — cobrindo o **MVP ou âmbito** acordado (novo projeto) ou os épicos **afectados/tocados** (feature/correção). |
| **`backlog/stories.yaml`** | Lista `stories`: `id`, `epicId` quando aplicável, `title`, `acceptance` (critérios testáveis), `status` — **alinhadas a `docs/prd.md`**. |
| **`backlog/tasks.yaml`** | Lista `tasks`: `id`, `storyId`, `title`, `status` (ex. `todo`), `acceptanceCriteria` opcional — **decomposição executável** do trabalho; para **correção**, tasks focadas no bug/fix. |

Regras:

- **Cobertura do pedido:** reverifica o pedido original e **`docs/prd.md`**; confirma que **não falta** nenhum epic/story/task para cobrir o solicitado (ou lista em **`relatorio-final.md`** o que ficou de fora **com aceitação** do utilizador). Se existir **`casos-de-teste.md`**, as **stories** devem ter critérios de aceite **rastreáveis** aos casos (ou IDs referenciados nas notas).
- **Coerência:** cada `storyId` em `tasks.yaml` existe em `stories.yaml`; cada `epicId` em stories existe em `epics.yaml` (quando usares épicos).
- **Novo projeto:** backlog **MVP** completo — não deixes apenas «Scaffold» se o utilizador fechou âmbito; se algo ficar TBD, lista-o em **`relatorio-final.md`** como lacuna e marca definição **Incompleta**.
- **Feature/correção:** **integra** com backlog existente (lê os YAML actuais); adiciona ou altera linhas sem apagar trabalho alheio sem acordo.
- Formato **YAML válido**; segue o contrato em `@aios-celx/shared` (`EpicSchema`, `StorySchema`, `TaskSchema`).

**Não** encerres a sessão como «pronto para aprovação» sem estes três ficheiros actualizados para o âmbito acordado, salvo se o utilizador **declarar** que aceita fechar só com notas (regista isso em **`relatorio-final.md`** como opção de risco).

## Passo 4 — Co-criação (stack, i18n, mapas)

Completa quando aplicável: stack, identidade visual, infra, **mapa da pasta `docs/`** (incluindo **`relatorio-final.md`**, **`api-contracts.md`**, **`architecture.md`**, **`discovery.md`**, **`casos-de-teste.md`** se existir) e referência cruzada **`prd.md` ↔ api-contracts ↔ architecture ↔ discovery ↔ casos de teste ↔ notas ↔ backlog YAML**. O **backlog** já está no Passo 3; aqui garantes **consistência** entre PRD, critérios de aceite, casos (se houver) e YAML.

## Passo 5 — Relatório final (`relatorio-final.md`)

O **relatório de fecho da sessão** **não** usa o nome «Relatório para aprovação» nem fica escondido só dentro de notas: **cria ou actualiza** o ficheiro dedicado **`projects/<projectId>/docs/relatorio-final.md`**.

Neste ficheiro inclui, no mínimo:

- **Título sugerido:** `# Relatório final` (ou equivalente claro).
- Resumo executivo e tipo de trabalho + `projectId`.
- **Checklist explícita:** **`docs/prd.md`** (com `## Summary`, `## Goals` e **`## Estratégia de testes`** — **testes unitários padrão** ou **opt-out** explícito) ✓ / para **novo projeto**, **`docs/api-contracts.md`**, **`docs/architecture.md`** e **`docs/discovery.md`** ✓ / **`docs/casos-de-teste.md`** ✓ *ou* **N/A** ✓ / **épicos, stories e tasks** (com tasks de **teste unitário** quando o padrão se aplica) ✓ / `epics.yaml` ✓ / `stories.yaml` ✓ / `tasks.yaml` ✓ / notas e docs alinhados ✓ (ou marcar o que falta).
- **Secção «Sugestões de testes (opcional)»:** lista **recomendações tuas** de testes **não** pedidos pelo utilizador (integração, e2e, contrato, carga, a11y, etc.) com **uma linha de raciocínio** cada uma. Deixa claro que são **sugestões** — **não** fazem parte do pacote aprovado até o utilizador as integrar no PRD/backlog ou as recusar. Se não houver nada a sugerir, escreve *«Nenhuma sugestão adicional.»*
- Estado **Completa** ou **Incompleta** e lacunas numeradas.
- **Decisão:** pergunta explícita se o utilizador **aprova** o pacote (docs + backlog) para implementação / CLI, ou **pede ajustes** (o que mudar). O utilizador pode ainda **pedir** que uma sugestão passe a fazer parte do âmbito (actualizas PRD/YAML e regeneras o relatório).

O utilizador pode **aprovar**, **ajustar** (actualizas `prd.md`, `api-contracts.md`, `architecture.md`, `discovery.md` quando aplicável, YAML, `casos-de-teste.md` se existir, `relatorio-final.md` e voltas a pedir decisão) ou **adiar**. Só depois de aprovação explícita recomendas **programar** ou `pnpm exec aios run --agent …`. **`gateApproval`** em `config.yaml` (`auto` vs `manual`) afecta *gates* do workflow, não substitui esta aprovação de âmbito.

## Limites

- **Sem código** de aplicação (`src/`, implementação de testes automatizados em `tests/`, etc.) — **documentação** (`prd.md`, para **novo projeto** também **`api-contracts.md`**, **`architecture.md`**, **`discovery.md`**, **`casos-de-teste.md`** quando existir, backlog YAML) **sim**.
- Estado em **`.aios/state.json`** só com comandos **`pnpm exec aios`** confirmados.
- Referência de comandos: **[README.md](../../README.md)**, **AGENTS.md**.
