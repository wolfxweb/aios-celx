# Notas de definição de produto — assistencia-tickets

**Última actualização:** 2026-04-01 (testes com PHPUnit)  
**projectId:** `assistencia-tickets`  
**Produto:** Sistema web de gestão de chamados / tickets de assistência técnica.

Este ficheiro co-define visão, stack, âmbito e mapas de `docs/` e `backlog/` antes da formalização pelos agentes (`requirements-analyst`, `product-manager`, `software-architect`). Não substitui PRD/backlog YAML finais.

---

## Stack / tecnologia

| Decisão | Estado | Notas |
|--------|--------|--------|
| **Backend / aplicação** | **Decidido** | **Laravel** (PHP) — requisito de sistema explícito do utilizador. |
| **Base de dados** | **Decidido** | **SQLite** — requisito de sistema explícito (desenvolvimento e/ou produção conforme PRD/arquitectura; limitações de concorrência em produção a avaliar no `architecture.md`). |
| **Camada UI no Laravel** | **Decidido** | **Blade** (templates server-side) + **Alpine.js** (interacção no cliente). |
| **Versões** | **TBD** | PHP e Laravel alinhados ao LTS suportado na data de arranque (registar em `architecture.md`). |
| **API (REST/JSON)** | **Decidido** | Rotas `api/*` para Alpine/`fetch` e integrações futuras; **Sanctum** — pormenor SPA vs token em `architecture.md`. Contratos: `api-contracts.md`. |
| **Auth** | **TBD detalhe** | Web: sessão + gates; **API:** Sanctum. Portal (V2) — PRD. |
| **Upload de anexos / ficheiros** | **Decidido** | **Storage local** Laravel (`storage/app`, `public/storage`). |
| **Código no monorepo** | **Acordo** | App Laravel pode residir em `projects/assistencia-tickets/` com `composer.json` na raiz dessa pasta e entrada em `pnpm-workspace.yaml` **se** o repo passar a incluir esse path como pacote/workspace; alternativa: subpasta `projects/assistencia-tickets/app/` documentada no `architecture.md`. **A definir** na fase de arquitectura (sem implementação neste comando). |
| **Testes** | **Decidido** | **PHPUnit** — testes automáticos do projecto Laravel (`tests/`, `phpunit.xml`). Incluir **Feature** (HTTP, API, fluxos) e **Unit** onde fizer sentido; base de dados de teste alinhada ao Laravel (ex. SQLite em memória ou ficheiro dedicado). **Laravel Dusk** (browser) **TBD** / opcional para mais tarde — não substitui o requisito de **PHPUnit**. |

**Perguntas em aberto (stack):** política **SQLite** em produção na VPS (ficheiro único, backups, concorrência); versões PHP/Laravel; pormenor de autenticação API (Sanctum: modo SPA vs token para integrações).

---

## Identidade visual

### Direcção geral (acordada)

- Base **branca** e **cinza claro**; **azul** como cor principal.
- **Status** com cores distintas para leitura rápida em operação.
- Layout **limpo**, **moderno**, **corporativo** — estilo **SaaS B2B** / sistema profissional.

### Uso semântico recomendado

| Uso | Cor típica |
|-----|----------------|
| Acções principais | Azul (primary) |
| Chamados em andamento | Laranja (`Em atendimento`) |
| Concluídos / positivo | Verde (resolvido, encerrado, sucesso) |
| SLA / urgência | Vermelho (risco, vencido, erro) |
| Estrutura da UI | Cinzas claros (fundo, bordas, texto secundário) |

### Cores principais

| Token / papel | Hex |
|---------------|-----|
| Primary | `#2563EB` |
| Primary Dark | `#1E3A8A` |
| Primary Soft | `#DBEAFE` |

### Neutros

| Token / papel | Hex |
|---------------|-----|
| Background | `#F8FAFC` |
| Surface / Card | `#FFFFFF` |
| Border | `#E2E8F0` |
| Text | `#0F172A` |
| Text Secondary | `#475569` |
| Text Muted | `#94A3B8` |

### Status dos tickets (UI)

| Status | Hex |
|--------|-----|
| Novo | `#3B82F6` |
| Em atendimento | `#F59E0B` |
| Aguardando cliente | `#8B5CF6` |
| Aguardando peça | `#EAB308` |
| Resolvido | `#22C55E` |
| Encerrado | `#15803D` |
| Cancelado | `#64748B` |
| SLA em risco | `#EF4444` |
| SLA vencido | `#B91C1C` |

### Feedback do sistema

| Tipo | Hex |
|------|-----|
| Sucesso | `#16A34A` |
| Erro | `#DC2626` |
| Aviso | `#D97706` |
| Informação | `#0284C7` |

### Tipografia e acessibilidade

| Tema | Estado |
|------|--------|
| Famílias de fonte (display / corpo) | **TBD** — implementar em CSS/Tailwind conforme `architecture.md` / PRD. |
| Contraste WCAG | Validar combinações texto/fundo e badges de status na implementação (especialmente **Text Muted** e amarelos em fundos claros). |

---

## Infra / hosting / deploy

| Tema | Estado |
|------|--------|
| Hosting | **Decidido — VPS** | Servidor virtual próprio (implantação típica: Nginx + PHP-FPM ou stack all-in-one documentada em `architecture.md`). |
| Domínio, HTTPS | **TBD** | Certificado Let’s Encrypt ou equivalente na VPS — detalhar no deploy. |
| CI/CD | **TBD** |
| Variáveis de ambiente em produção | **TBD** |
| CDN | **TBD** / opcional |

---

## Idioma(s) e conteúdo

| Tema | Estado |
|------|--------|
| **Idioma da UI e conteúdo operacional (MVP)** | **pt-BR** (inferido pelo contexto CPF/CNPJ e redacção; **confirmar** com utilizador). |
| **i18n multi-idioma** | **Fora do MVP** salvo decisão contrária — se no futuro houver vários locales: registar **locale por omissão**, comportamento de `/` e segmentos de URL em minúsculas (`/pt-br/`, `/en/`) vs códigos BCP 47 nos ficheiros (`pt-BR`). |
| **SEO** | Relevante sobretudo para **portal do cliente** (V2); **TBD** para páginas públicas. |
| **Mapa de áreas / menu (referência)** | Dashboard, Tickets (abrir/listar), Clientes, Contatos, Equipamentos, Contratos, Agenda técnica, Horas, SLA, Relatórios, Usuários, Configurações — conforme especificação; MVP reduz subconjunto (ver secção MVP). |

### Ecrãs / fluxos principais (resumo)

- Autenticação e perfis (Admin, Atendente, Técnico, Gestor, Cliente no portal V2).
- CRUD e pesquisa: clientes, contatos, equipamentos, contratos.
- Ciclo de vida do ticket: abertura → triagem → atribuição → interações → horas → SLA → encerramento técnico → aceite/avaliação (portal).
- Painéis e relatórios operacionais e gerenciais.

---

## Problema, utilizadores, valor, MVP, riscos, critérios de sucesso

### Problema

Desorganização no suporte técnico, falta de rastreabilidade, SLA e produtividade difíceis de medir, histórico fragmentado por cliente/equipamento/contrato.

### Utilizadores

- **Internos:** Administrador, Atendente/Suporte N1, Técnico, Gestor/Supervisor.
- **Externos:** Cliente (portal V2).

### Valor entregue

Centralizar chamados, controlar SLA e horas, historizar interações, apoiar decisões com indicadores e permissões por perfil; base para integrações futuras (API, WhatsApp, IA).

### MVP (versão 1) — alinhado à especificação fornecida

Incluir como núcleo operacional:

- Login e usuários com perfis base.
- **API REST/JSON** (Laravel) consumida pela UI Blade+Alpine e base para evolução; **anexos** em **storage** local.
- Clientes, contatos, equipamentos.
- Tickets (abertura, classificação/triagem, atribuição, status).
- Interações / histórico (interno vs cliente quando aplicável).
- SLA básico (regras configuráveis em grau mínimo viável).
- Apontamento de horas.
- Encerramento com campos obrigatórios acordados (solução, causa raiz, responsável, horas mínimas conforme regra).
- Dashboard básico.
- **Cobertura de testes:** implementação com **PHPUnit** (Feature + Unit conforme PRD e critérios de aceite).

**Explicitamente em expansão (versão 2+):** portal do cliente; contratos avançados com consumo automático complexo; agenda técnica rica; peças/insumos; integrações WhatsApp/e-mail/API; IA/triagem; automações.

### Riscos

- **SQLite em produção** com muitos escritos concurrentes — mitigação: volume esperado e estrategy de lock (documentar na arquitectura).
- **Âmbito** dos 20+ módulos vs MVP — risco de *scope creep*; manter backlog priorizado pelo `product-manager`.
- **SLA pausável** e regras de status — complexidade de modelo; validar cedo com casos de teste.

### Critérios de sucesso (mensuráveis — a refinar no PRD)

- Ticket com protocolo único e histórico auditável.
- Tempo de primeira resposta e resolução registados; indicadores de SLA cumprido vs violado.
- Apontamento de horas por ticket/técnico/período exportável ou consultável.
- Perfis respeitam visibilidade (ex.: técnico vê atribuídos, quando configurado).

---

## Correcções vs novas funcionalidades

**N/A** — projeto tratado como **greenfield**; não há separação bug/feature nesta fase.

---

## Regras de negócio consolidadas (referência)

- Numeração única automática de tickets; histórico obrigatório para movimentações relevantes; fluxo de status configurável; **SLA pausável** em estados definidos; visibilidade por perfil; encerramento só com campos obrigatórios (solução, causa raiz, apontamento mínimo, técnico responsável); reabertura dentro de regra configurável.

---

## Abertos e próximos passos

1. Confirmar **projectId** `assistencia-tickets` ou renomear projeto antes de referências externas.
2. Fechar **política SQLite** na VPS (path da BD, backups, permissões) e versões PHP/Laravel.
3. Definir **tipografia** (famílias) e pormenores de **domínio/HTTPS/CI** no primeiro deploy.
4. Confirmar **locale** único **pt-BR** para UI.
5. Liberar fluxo aios: `requirements-analyst` → `product-manager` → `software-architect` (comandos `pnpm exec aios …` **só com confirmação humana** de gates/aprovações).

---

## Mapa da pasta `docs/`

| Ficheiro | Função | Conteúdo acordado / destino |
|----------|--------|----------------------------|
| `vision.md` | Visão de produto (stub blueprint) | Resumo da visão: plataforma de tickets de assistência técnica com SLA, horas, cadastros e indicadores; **preenchimento formal** pelo workflow após liberação. Pode receber resumo da secção "Problema/valor" destas notas se o utilizador pedir cópia explícita. |
| `discovery.md` | Descoberta estruturada | Saída esperada do **`requirements-analyst`**: problemas, utilizadores, restrições, dúvidas. Entrada: estas notas + conversas. |
| `prd.md` | PRD | Saída do **`product-manager`**: requisitos funcionais/NFR, perfis, módulos, MVP vs roadmap. |
| `architecture.md` | Arquitectura | Saída do **`software-architect`**: Laravel, SQLite, módulos, limites, padrões, deploy. |
| `api-contracts.md` | Contratos de API | **Destino:** documentar recursos REST/JSON acordados (versão, autenticação Sanctum, recursos por domínio: tickets, anexos, etc.) — **API** é requisito de stack; preenchimento pelo **`software-architect`** após PRD. |
| `decision-log.md` | Registo de decisões | ADRs ao longo do projecto; decisão **Laravel + SQLite** deve ser registada aqui quando formalizada. |
| `product-definition-notes.md` | **Este ficheiro** | Definição co-criada, mapas de `docs/` e `backlog/`, relatório para aprovação. |

**Subpastas:** nenhuma obrigatória além do blueprint; `docs/execution/` **N/A** até ser criada por decisão de documentação.

---

## Mapa da pasta `backlog/`

| Ficheiro | Função | Estado alvo após co-definição |
|----------|--------|-------------------------------|
| `epics.yaml` | Épicos | Deve conter épicos alinhados aos **macro-módulos** (ex.: Fundações & auth; Cadastros; Tickets & ciclo de vida; Interações & anexos; SLA; Horas; Dashboard & relatórios; Configurações) e às fases MVP vs V2. **Estado actual:** apenas scaffold `EPIC-1` — **lacuna** até `product-manager`. |
| `stories.yaml` | User stories com `epicId` | Stories com critérios de aceite testáveis por módulo MVP (e placeholders V2). **Estado actual:** scaffold `STORY-1`. |
| `tasks.yaml` | Tasks com `storyId` | Tasks de implementação para engineer; **Estado actual:** tasks de smoke do blueprint — substituir por backlog real na formalização. |

**Nota:** não editar os YAML neste comando; o **acordo** sobre o que devem conter está no **Backlog alvo** abaixo.

---

## Backlog alvo (rascunho — coerente com MVP e V2)

### Épicos candidatos (rascunho)

1. **EPIC-FND** — Autenticação, perfis, usuários, auditoria base, configurações globais mínimas; **base API** (rotas `api/*`, Sanctum, CORS se necessário).  
2. **EPIC-CAD** — Clientes, contatos, equipamentos (e contratos **se** entrarem no MVP; senão mover para V2).  
3. **EPIC-TKT** — Abertura, triagem, classificação, atribuição, estados, números únicos.  
4. **EPIC-INT** — Interações, timeline, anexos, comentários interno vs público.  
5. **EPIC-SLA** — Regras SLA, pausas, alertas básicos, indicadores de cumprimento.  
6. **EPIC-HOR** — Apontamento de horas, totais por ticket, relatórios básicos.  
7. **EPIC-ENC** — Encerramento técnico, validações obrigatórias, reabertura.  
8. **EPIC-DASH** — Dashboard e relatórios mínimos do MVP.  
9. **EPIC-V2-PORTAL** — Portal do cliente (fora do MVP).  
10. **EPIC-V2-CONTR** — Contratos avançados, consumo de horas, alertas (fora do MVP se não priorizado).  
11. **EPIC-V2-AGENDA** — Agenda técnica.  
12. **EPIC-V2-PECAS** — Peças/insumos.  
13. **EPIC-V2-INT** — Integrações externas e IA (roadmap).

### Stories / tasks (orientação)

- Cada story: ligação `epicId`, perfil(is) envolvido(s), **critérios de aceite** mensuráveis (ex.: "ticket não encerra sem causa raiz quando regra activa").  
- Tasks: implementação incremental (migrations SQLite, models, policies, UI, **testes PHPUnit** por feature/critério de aceite).

*(Detalhamento idêntico aos YAML fica para o `product-manager`.)*

---

## Relatório para aprovação

### Resumo executivo

Sistema **web** de **tickets de assistência técnica** para operação com **rastreabilidade**, **SLA**, **horas**, cadastros (cliente, contato, equipamento, contrato), **perfis** (Admin, Atendente, Técnico, Gestor; **Cliente** no portal V2) e **indicadores**. **Stack:** **Laravel** + **SQLite**; UI **Blade + Alpine.js**; **API REST/JSON** necessária (Alpine/`fetch` + integrações futuras); **anexos em storage local**; **deploy alvo: VPS**; **testes automáticos com PHPUnit**. **Identidade:** paleta azul + neutros claros, status operacionais codificados por cor, estilo **SaaS B2B**. MVP focado em núcleo operacional; portal avançado, contratos complexos, agenda, peças e integrações externas em fases posteriores.

### Estado da definição

**Incompleta** — decisões e documentação formal ainda pendentes em vários pontos.

**Lacunas numeradas:**

1. **Versões de PHP/Laravel** e política **SQLite** na VPS (path, backup, concorrência) — **TBD**.  
2. **Tipografia** (famílias) e validação **WCAG** sobre a paleta — **TBD** na implementação.  
3. **Infra (pormenores):** domínio, HTTPS, CI/CD — **TBD** (hosting **VPS** já decidido).  
4. **Confirmação explícita** de locale **pt-BR** como único no MVP — assumido; falta confirmação explícita do utilizador.  
5. **Contratos** no MVP ou só V2 — **TBD** (especificação lista contratos; MVP recomendado no doc original não inclui "contratos avançados" na lista curta — alinhar no PRD).  
6. **`api-contracts.md`** — lista de endpoints e auth **TBD** até PRD/arquitectura (API **decidida** como necessária).  
7. **Backlog YAML** ainda em **scaffold** — lacuna até `product-manager`.  
8. **Estrutura de pasta do código Laravel** no monorepo — **TBD** na arquitectura.  
9. **Pormenor auth API** (Sanctum SPA vs token para integrações) — **TBD** no PRD/arquitectura.

### Checklist de cobertura

| Item | Coberto? |
|------|----------|
| Mapa da pasta `docs/` | Sim — tabela acima para todos os ficheiros presentes. |
| Mapa da pasta `backlog/` | Sim — `epics.yaml`, `stories.yaml`, `tasks.yaml` + estado alvo. |
| Stack (Laravel + SQLite + Blade + Alpine + API + storage local + PHPUnit) | Sim — registado. |
| Identidade visual | **Paleta e direcção** decididas; **tipografia** **TBD**. |
| Infra | **VPS** decidido; domínio/HTTPS/CI/CD **TBD**. |
| i18n | Locale único **pt-BR** proposto; multi-idioma fora do MVP salvo decisão contrária. |
| Backlog alvo (rascunho) | Sim — épicos candidatos e nota sobre stories/tasks. |
| Relatório para aprovação | Sim — esta secção. |

### Aviso sobre lacunas

**Aprovar ou dar por encerrada** esta sessão **com itens TBD** **não equivale** a definição completa nem libera o fluxo aios como se todos os requisitos estivessem fechados. No máximo representa **aceitação consciente de risco** e **dívida documentada** até `discovery`/`prd`/`architecture` fecharem os pontos em falta.

### Linha de decisão (preencher na conversa)

- **(A)** Definição completa e aprovada para formalização — *não aplicável enquanto o estado acima for **Incompleta** sem nova sessão que feche TBD.*  
- **(B)** Definição incompleta — reconheço as lacunas (lista acima) e aceito avançar só com essa consciência.  
- **(C)** Ainda não aprovo — falta fechar: ___  

---

*Fim das notas de definição de produto.*
