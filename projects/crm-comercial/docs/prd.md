# Requisitos de produto (PRD) — CRM AIOS-CELX

## Resumo

O **CRM AIOS-CELX** (`projectId` **crm-comercial**) é um CRM web em **português do Brasil** para centralizar **leads**, **empresas**, **contatos** e **oportunidades**, com **pipeline** configurável (listagem e Kanban), **tarefas**, **atividades**, **relatórios** e **administração** (usuários, perfis, pipelines, motivos de perda, tags e campos customizados). Inclui uma **Home pública** (`/`) como **página de vendas do produto** (marketing) antes do login. O detalhamento de interface, filtros, validações e critérios de aceite por tela está em [`especificacao-funcional-crm-telas.md`](./especificacao-funcional-crm-telas.md) (incluindo **TELA 0 — Home**); este PRD consolida objetivos, requisitos funcionais e não funcionais para priorização e entrega.

## Summary

(Product summary for workflow gates — same scope as **Resumo** above.) CRM web in pt-BR for leads, companies, contacts, opportunities, pipeline, tasks, activities, reports, admin; public marketing Home at `/`; full UI spec in `especificacao-funcional-crm-telas.md`.

## Objetivos do produto

1. Ser a **fonte única de verdade** do relacionamento comercial para o time e a gestão.
2. Permitir **qualificar e avançar** leads e oportunidades com regras claras (etapas, motivos de perda/ganho, permissões).
3. Garantir **rastreabilidade** de atividades e tarefas vinculadas a entidades.
4. Oferecer **visibilidade gerencial** por dashboards e relatórios com filtros e exportação quando aplicável.

## Goals

1. Single source of truth for commercial relationship data and pipeline.
2. Clear qualification and pipeline rules with RBAC.
3. Traceability of activities and tasks linked to CRM entities.
4. Manager visibility via dashboards and reports.

## Personas e histórias (alto nível)

| Persona | História |
|---------|----------|
| Visitante | Como visitante, quero ver na Home o que o CRM oferece e aceder facilmente a «Entrar» ou a um pedido de demonstração. |
| Vendedor | Como vendedor, quero ver minhas oportunidades em lista e Kanban para priorizar o que fechar. |
| Vendedor | Como vendedor, quero registrar ligações e reuniões como atividades ligadas ao cliente para não perder o histórico. |
| Gestor | Como gestor, quero filtrar o pipeline por equipe e período para acompanhar previsão e gargalos. |
| Admin | Como administrador, quero definir pipelines, etapas e permissões para refletir o processo real da empresa. |
| Atendimento | Como atendimento, quero cadastrar leads e contatos rapidamente e atribuir responsáveis. |

## Requisitos funcionais

### Home pública (marketing)

- **FR-PUB-01:** Rota `/` com página de **vendas do produto**: proposta de valor, funcionalidades resumidas, CTAs para **Entrar** (`/login`) e para contacto ou demonstração (conforme especificação).
- **FR-PUB-02:** A Home **não** exige autenticação e **não** mostra o shell autenticado do CRM (sidebar de módulos).
- **FR-PUB-03 (opcional):** Formulário de interesse com validação e envio (endpoint público ou e-mail) conforme [`especificacao-funcional-crm-telas.md`](./especificacao-funcional-crm-telas.md) — TELA 0.

### Autenticação e sessão

- **FR-AUTH-01:** Login com e-mail e senha; resposta com **JWT** (access); HTTPS em produção.
- **FR-AUTH-02:** Recuperação de senha por e-mail (fluxo que não revele se o e-mail existe).
- **FR-AUTH-03:** Preferências de interface por usuário: tema (claro/escuro), menu lateral retraído por padrão.

### Shell e navegação

- **FR-SHELL-01:** Layout com sidebar retrátil, topbar com busca global, atalhos e menu do usuário.
- **FR-SHELL-02:** Navegação entre módulos **após login**: Dashboard, Leads, Empresas, Contatos, Oportunidades, Tarefas, Atividades, Relatórios, Usuários (admin), Configurações. A **Home** pública fica fora deste shell.

### Leads

- **FR-LEAD-01:** CRUD de leads com campos definidos na especificação (incl. etapa de qualificação, score, tags, datas).
- **FR-LEAD-02:** Listagem com filtros rápidos e avançados sobre todos os campos filtráveis da entidade e campos customizados marcados como filtráveis.
- **FR-LEAD-03:** Visão **Kanban** por **etapa de qualificação** com arrastar e soltar e totais por coluna.
- **FR-LEAD-04:** Conversão de lead em oportunidade preservando vínculo de origem e histórico.

### Empresas e contatos

- **FR-EMP-01:** CRUD de empresas com validação de dados cadastrais (ex.: CNPJ conforme regra de negócio acordada).
- **FR-CON-01:** CRUD de contatos com vínculo opcional a empresa.
- **FR-REL-01:** Fichas de detalhe com listas relacionadas (ex.: contatos na empresa; oportunidades vinculadas).

### Oportunidades e pipeline

- **FR-OPP-01:** CRUD de oportunidades com pipeline, etapa, valores, probabilidade, previsão de fechamento e motivos de ganho/perda quando aplicável.
- **FR-OPP-02:** Listagem com filtros completos e alternância com **Kanban de oportunidades** por pipeline e etapa.
- **FR-OPP-03:** Regras ao mover etapa (campos obrigatórios em etapas finais ou por configuração).

### Tarefas e atividades

- **FR-TASK-01:** CRUD de tarefas com vínculo a lead, contato, empresa ou oportunidade; vencimento, prioridade, status e recorrência conforme escopo do MVP.
- **FR-ACT-01:** Registro de atividades com tipo, data/hora, resultado, canal e vínculos a entidades.

### Relatórios

- **FR-REP-01:** Catálogo de relatórios com parâmetros (período, equipe, pipeline, etc.) e visualização tabular ou gráfica simples.
- **FR-REP-02:** Exportação (CSV no mínimo; PDF se estiver no escopo acordado).

### Administração e configuração

- **FR-ADM-01:** Gestão de usuários (convite ou criação, perfil, status, preferências).
- **FR-CFG-01:** Pipelines e etapas (ordem, tipo de etapa: aberta/ganho/perdido, regras).
- **FR-CFG-02:** Motivos de perda reutilizáveis e vinculáveis a pipelines.
- **FR-CFG-03:** Tags por entidade aplicável.
- **FR-CFG-04:** Campos customizados por entidade com tipo, obrigatoriedade, visibilidade em listagem e **filtrável**.
- **FR-RBAC-01:** Perfis com permissões por módulo e ação (ver, criar, editar, excluir, exportar, mover pipeline, etc.).

### Campos customizados e filtros

- **FR-CUST-01:** Valores de campos customizados armazenados e exibidos em detalhe, listagem e exportação.
- **FR-FILT-01:** Todas as listagens principais suportam filtros rápidos, filtros avançados, chips, limpar item e limpar todos, ordenação e paginação conforme [`especificacao-funcional-crm-telas.md`](./especificacao-funcional-crm-telas.md).

## Requisitos não funcionais

### Segurança

- **NFR-SEC-01:** Autenticação **stateless com JWT** (FastAPI); access de curta duração; refresh com política segura; sem CSRF em APIs puramente Bearer (SPA envia header); se refresh via cookie, aplicar `SameSite`/`HttpOnly` conforme implementação.
- **NFR-SEC-02:** Autorização em **cada** endpoint e na UI (defesa em profundidade).
- **NFR-SEC-03:** Dados sensíveis (senhas, tokens) nunca em logs nem respostas em claro.
- **NFR-SEC-04:** Auditoria de ações críticas (login, alteração de permissões, exclusão, exportação em massa).

### Desempenho

- **NFR-PERF-01:** Listagens paginadas; tempo alvo de resposta a definir após stack (ex.: p95 &lt; 500 ms para listas com índices adequados em ambiente de referência).
- **NFR-PERF-02:** Kanban e agregações do dashboard não devem bloquear a UI (carregamento incremental ou skeletons).

### Confiabilidade e disponibilidade

- **NFR-REL-01:** Backups da base **SQLite** (cópia do ficheiro, WAL checkpoint se necessário) e estratégia de recuperação definidos na fase de infra; ver [`architecture.md`](./architecture.md).
- **NFR-REL-02:** Mensagens de erro amigáveis e idempotência em operações críticas onde aplicável.

### Usabilidade e acessibilidade

- **NFR-UX-01:** Contraste mínimo **AA** para texto e componentes interativos nos temas claro e escuro.
- **NFR-UX-02:** Estados obrigatórios: vazio, carregando, erro, sem permissão, sem resultados (conforme especificação por tela).

### Observabilidade

- **NFR-OBS-01:** Logs estruturados no backend; correlação de requisições (trace id) em produção.

### Testes automatizados (API)

- **NFR-TEST-01:** Backend com **pytest**; testes **unitários** (JWT, RBAC, validadores, regras com mocks) e testes de **integração** HTTP contra a app FastAPI com **SQLite** de teste (em memória ou ficheiro temporário).
- **NFR-TEST-02:** Cada endpoint exposto deve ter cobertura mínima acordada em [`plano-testes-api.md`](./plano-testes-api.md) (caso feliz + erros `401`/`403`/`404`/validação onde aplicável).
- **NFR-TEST-03:** CI executa testes e falha em regressão; cobertura reportada (`pytest-cov`).

## Dependências e premissas

- **Premissa:** **Frontend: Vue 3 + Vuetify 3**; **Backend: FastAPI** com **JWT**; **Base de dados: SQLite** (detalhes em [`architecture.md`](./architecture.md)). Contratos em [`api-contracts.md`](./api-contracts.md).
- **Dependência:** Contratos HTTP descritos em [`api-contracts.md`](./api-contracts.md) evoluem com a implementação. Plano de testes da API: [`plano-testes-api.md`](./plano-testes-api.md).

## Critérios de aceite globais do MVP

- Fluxos de login, pelo menos um pipeline completo, CRUD nas entidades principais, Kanban de oportunidades e de leads, tarefas e atividades vinculadas, configuração mínima de perfil e usuário, e relatório simples exportável.
- Especificação por tela respeitada salvo alteração formal registrada em `decision-log.md`.

## Histórico

_Atualizado: PRD restaurado após execução mock do `product-manager`; mantidos `## Summary` e `## Goals` para compatibilidade com gates do workflow aios._
