# Notas de definição de produto — crm-comercial

## Stack / tecnologia

| Tópico | Decisão | Notas |
|--------|---------|--------|
| Tipo de produto | CRM web para times comerciais e gestão | Escopo funcional em `especificacao-funcional-crm-telas.md` |
| Frontend | **Vue 3 + Vuetify 3** | SPA; Vite; Vue Router; Pinia; tema claro/escuro via Vuetify; ver `architecture.md` |
| Backend | **FastAPI** (Python) | REST; OpenAPI nativo; SQLAlchemy + Alembic; ver `architecture.md` |
| Base de dados | **SQLite** | Ficheiro único por instância; WAL; backups por cópia do ficheiro; ver `architecture.md` |
| Autenticação | **JWT** (access + refresh) + e-mail/senha | Login emite Bearer; refresh; recuperação de senha; ver `api-contracts.md` |
| Integrações externas | TBD | Não obrigatórias na definição actual; telefonia, SSO, WhatsApp para roadmap |
| Monorepo | Documentação e backlog em `projects/crm-comercial/` | Código da aplicação pode residir em `projects/crm-comercial/` com entrada em `pnpm-workspace.yaml` quando existir |

## Identidade visual

| Elemento | Decisão |
|----------|---------|
| Temas | Claro e escuro com persistência por usuário |
| Menu | Lateral retrátil (expandido/retraído) com persistência |
| Componentes | Topbar com busca global, atalhos e menu do usuário — implementação com **Vuetify** (`v-app-bar`, `v-navigation-drawer`, etc.) |
| Paleta tipográfica | TBD (customização sobre tema Vuetify / Material) |
| Acessibilidade | Contraste AA nos estados de foco e botões primários (requisito de especificação) |

## Infra / hosting / deploy

| Tópico | Estado |
|--------|--------|
| Hosting | TBD |
| Domínio e HTTPS | TBD |
| CI/CD | TBD |
| Variáveis de ambiente | TBD |
| E-mail transacional (convites, reset) | TBD |

## Idioma(s) e conteúdo

| Tópico | Decisão |
|--------|---------|
| Locale da interface | **pt-BR** (português do Brasil) |
| i18n adicional | TBD |
| Estrutura de informação | **Home** pública (`/`) — página de vendas do produto; depois **Login**, **Dashboard**, Leads, Empresas, Contatos, Oportunidades (lista + Kanban), Tarefas, Atividades, Relatórios, Usuários, Configurações (pipelines, motivos de perda, tags, campos customizados, perfis) |

## Problema, usuários, valor, MVP, riscos, critérios de sucesso

- **Problema:** dispersão de cadastros e follow-ups sem visão única do pipeline e tarefas.
- **Utilizadores:** vendedores, atendimento, gestores, administradores.
- **Valor:** cadastro centralizado (leads, empresas, contatos, oportunidades), pipeline visível, atividades e tarefas rastreáveis, relatórios para gestão.
- **MVP:** autenticação; CRUD e listagens com filtros rápidos e avançados; campos customizados filtráveis; Kanban de oportunidades por pipeline; Kanban de leads por etapa de qualificação; tarefas e atividades; configurações de pipeline, motivos de perda, tags, campos customizados e perfis; relatórios base (catálogo em especificação).
- **Riscos:** complexidade de permissões; performance em listagens grandes; consistência de dados entre entidades.
- **Sucesso (indicativos):** adopção diária; oportunidades actualizadas; tarefas concluídas no prazo; redução de leads sem qualificação (KPIs a fechar com negócio).

## Correcções vs novas funcionalidades

- Esta sessão focou **definição verde** de produto; não há lista separada de bugs. Itens futuros de correção devem entrar no backlog com tipo explícito quando existirem.

## Mapa da pasta `docs/`

| Ficheiro / pasta | Função | Conteúdo acordado |
|------------------|--------|-------------------|
| `vision.md` | Visão de produto | **Preenchido:** problema, usuários, resultados, non-goals, princípios de UX. |
| `discovery.md` | Descoberta | Stub; entrevistas e hipóteses — agente `requirements-analyst` após liberação. |
| `prd.md` | PRD | **Preenchido:** objetivos, histórias, requisitos funcionais e não funcionais, critérios de aceite globais MVP. |
| `architecture.md` | Arquitetura | **Preenchido:** **Vue 3 + Vuetify 3**, **FastAPI + JWT**, **SQLite**, SQLAlchemy. |
| `api-contracts.md` | Contratos de API | **Preenchido:** convenções, erros, paginação, mapa de endpoints v1; esquemas JSON detalhados na implementação/OpenAPI. |
| `decision-log.md` | Registo de decisões | Stub; ADRs ao longo do projecto. |
| `especificacao-funcional-crm-telas.md` | Especificação funcional e de UI | **Preenchido:** **TELA 0 — Home** (vendas do produto) + telas 1–27 (CRM), secções 1–14 (documento principal para Design, FE, BE, QA). |
| `product-definition-notes.md` | Notas de co-definição e relatório | **Este ficheiro** — mapas, backlog alvo, aprovação. |
| `plano-testes-api.md` | Plano de testes da API | **Preenchido:** pytest, unitários vs integração, fixtures, matriz por endpoint, CI. |

## Mapa da pasta `backlog/`

| Ficheiro | Função | Estado alvo após formalização |
|----------|--------|-------------------------------|
| `epics.yaml` | Épicos | Épicos por módulo (autenticação, shell UI, leads, empresas, contatos, oportunidades, kanban, tarefas, atividades, relatórios, admin, configurações). |
| `stories.yaml` | Histórias | Stories com `epicId`, critérios de aceite alinhados à especificação por tela. |
| `tasks.yaml` | Tarefas | Tasks com `storyId` para implementação e QA. |

**Lacuna actual:** ficheiros YAML são scaffolds do blueprint até o `product-manager` (ou usuário) formalizar após aprovação.

## Backlog alvo (rascunho)

| Epic sugerido | Stories (resumo) |
|---------------|-------------------|
| Home pública | Rota `/`; página de vendas; CTAs para login; formulário opcional. |
| Autenticação e sessão | Login; recuperação de senha; sessão e RBAC base. |
| Shell e navegação | Sidebar retrátil; topbar; tema; busca global. |
| Leads | Listagem + filtros + Kanban qualificação; detalhe; criar/editar; conversão. |
| Empresas | Listagem; detalhe; criar/editar. |
| Contatos | Listagem; detalhe; criar/editar. |
| Oportunidades | Listagem; detalhe; criar/editar; Kanban pipeline. |
| Tarefas e atividades | Listagens; criar/editar; vínculos a entidades. |
| Relatórios | Catálogo; parâmetros; export. |
| Admin | Utilizadores; perfis. |
| Configurações | Pipelines; motivos perda; tags; campos customizados. |

## Relatório para aprovação

### Resumo executivo

Defini-se um **CRM web em pt-BR** para centralizar leads, empresas, contatos e oportunidades, com pipeline (tabela e Kanban), tarefas, atividades, relatórios e administração. A especificação **tela a tela** (Home pública + 27 telas do CRM) está em `especificacao-funcional-crm-telas.md`, incluindo filtros, validações, regras de negócio, critérios de aceite, estados, tema claro/escuro, responsividade e notas de QA.

### Estado da definição

**Completa** no que respeita ao **âmbito funcional e de interface** acordado nesta sessão (módulos e telas enumeradas pelo usuário).

**Lacunas / TBD explícitos:** hospedagem e CI/CD; integrações opcionais; catálogo final de relatórios e agendamento de envio; políticas exactas de duplicidade (bloqueante vs aviso); detalhe de convite de usuário vs senha inicial; calendário de tarefas se for fase posterior.

### Checklist de cobertura

- [x] Mapa da pasta `docs/` percorrido e documentado acima.
- [x] Mapa da pasta `backlog/` percorrido; estado alvo descrito; YAML ainda por formalizar.
- [x] `especificacao-funcional-crm-telas.md` com a Home pública (TELA 0) e as 27 telas do CRM na ordem pedida.
- [x] Filtros: listagens com rápidos + avançados e campos customizados filtráveis quando aplicável.
- [x] Tema claro/escuro e menu lateral retrátil considerados por tela onde relevante.

### Aviso sobre lacunas

Aprovar com itens **TBD** de stack ou infra **não** substitui decisões técnicas nem garante entrada «ideal» para implementação sem fechar esses pontos; constitui **aceitação de risco** documentada.

### Linha de decisão

- **(A)** Definição funcional/UI aprovada para seguir formalização em PRD/backlog e fluxo aios quando o usuário libertar.
- **(B)** Incompleta em aspectos técnicos/infra — reconheço as lacunas e aceito avançar com consciência.
- **(C)** Não aprovo até fechar: _[a preencher pelo usuário]_.

**Registo:** Aguardando declaração explícita do usuário (A), (B) ou (C).

## Abertos e próximos passos

1. Utilizador escolher linha de decisão (A/B/C) e, se necessário, fechar TBD críticos.
2. Formalizar backlog YAML e `discovery.md` via workflow aios (`requirements-analyst`, `product-manager`, …) após **liberação** e comandos CLI pelo usuário; `vision.md`, `prd.md`, `architecture.md` e `api-contracts.md` já têm versão inicial no repositório.
3. Não editar código de aplicação nesta fase de definição de produto além da documentação em `docs/`.
