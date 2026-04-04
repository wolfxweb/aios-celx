# Especificação funcional e de interface — CRM AIOS-CELX

**Produto:** CRM AIOS-CELX · **`projectId`:** `crm-comercial`  
**Idioma da interface:** português do Brasil (pt-BR)  
**Documento:** especificação por tela para Design, Front-end, Back-end e QA.

**Premissas globais de interface:** tema claro e escuro com persistência por usuário; menu lateral retrátil (estados expandido e retraído) com persistência por usuário; topbar com busca global, atalhos e menu do usuário; layout web responsivo; listagens com filtros rápidos e filtros avançados; campos customizados por entidade — quando marcados como filtráveis, aparecem na área de filtros avançados; onde fizer sentido, alternância entre visão em tabela e visão Kanban.

**Assunções explícitas:** autenticação por e-mail e senha no MVP; não há integrações externas obrigatórias descritas neste documento (telefonia, WhatsApp, SSO) salvo menção; hospedagem e envio de e-mail transacional são TBD de infra.

**Perfis de referência:** Admin, Gestor, Vendedor, Atendimento, Leitura.

**Padrão comum — listagens:** filtros rápidos visíveis na barra superior da listagem; botão «Filtros avançados» abre drawer ou modal; chips de filtros ativos com remoção individual; «Limpar tudo»; ordenação por colunas indicadas; paginação com seletor de tamanho de página (10, 25, 50, 100); estados vazio, carregando, erro, sem permissão, sem resultados.

**Padrão — campos customizados:** exibidos nas colunas configuráveis, formulários e filtros avançados quando o tipo suportar filtro (texto, número, data, seleção, booleano, usuário, tags).

**Área pública vs. aplicativo:** a rota raiz **`/`** é a **Home** — página de **vendas e marketing** do produto CRM (visitantes). Não exige autenticação e não usa o shell do CRM (sidebar do produto). O **aplicativo CRM** autenticado começa após o **Login** (`/login` ou equivalente) e o **Dashboard** (`/dashboard`).

---

# TELA 0 — Home (página pública de vendas do produto)

## 1. Objetivo da tela

Apresentar o **produto CRM** a visitantes, comunicar proposta de valor, funcionalidades principais e incentivar **entrada na aplicação** (login) ou **contacto comercial** (demonstração ou lead de interesse), conforme estratégia de go-to-market.

## 2. Perfil de usuário que acessa

- **Visitante anónimo** (potencial cliente, curioso, parceiro).
- **Usuário já cliente** que acede ao domínio e usa «Entrar» para ir ao CRM.
- **Não** requer perfil Admin/Gestor/Vendedor na área pública — permissões aplicam-se apenas após login.

## 3. Layout da tela

- **Sem** menu lateral do CRM e **sem** topbar autenticada (busca global de registros não existe nesta página).
- **Barra superior fixa (header público):** logotipo ou nome do produto (link para topo da Home); links âncora ou rotas para secções («Funcionalidades», «Planos», «Contato» — conteúdo configurável); botão secundário **«Entrar»** (navega para `/login`); botão primário **«Começar»** ou **«Agendar demonstração»** (conforme copy — pode abrir modal, âncora para formulário ou link externo).
- **Opcional:** selector de tema **claro / escuro** no header (preferência guardada em `localStorage` para consistência com Login e app) — **Assunção:** recomendado para alinhar à identidade do produto.
- **Hero (dobra superior):** headline, subtítulo, ilustração ou screenshot do CRM (placeholder até Design); CTA duplo (Entrar + Demonstração).
- **Secções sugeridas (rolagem vertical):** problema que resolve; benefícios em bullets; grid de funcionalidades (Leads, Pipeline/Kanban, Tarefas, Relatórios, etc.) alinhado ao PRD; prova social (depoimentos ou logos — **TBD** conteúdo); FAQ opcional; rodapé com links legais (Política de privacidade, Termos — **TBD**), redes sociais, contacto.
- **Formulário de contacto ou demonstração** (secção final ou modal): nome, e-mail, empresa, mensagem opcional — **Assunção:** envio via endpoint público ou serviço de e-mail (ver dependências).
- **Estados visuais:** carregamento de imagens lazy; formulário com feedback de envio.

## 4. Campos da tela

Conteúdo principal é **marketing** (títulos, textos, imagens) — não são campos de entidade CRM.

| Elemento | Tipo | Obrigatório | Origem | Comportamento |
|----------|------|-------------|--------|---------------|
| Headline / copy | texto rico | Sim (para publicar) | marketing ou CMS futuro | editável por deploy ou config **TBD** |
| CTAs | botões | Sim | — | rotas internas ou URLs externas |
| Formulário «Fale conosco» / demo | ver tabela abaixo | Não (secção opcional no MVP) | — | — |

**Campos do formulário de interesse (se existir):**

| Nome | Tipo | Obrigatório | Exemplo | Validação |
|------|------|-------------|---------|-----------|
| Nome | texto | Sim | «Ana Costa» | não vazio |
| E-mail | email | Sim | ana@empresa.com.br | formato |
| Empresa | texto | Não | «Empresa X» | — |
| Telefone | telefone | Não | (11) 99999-9999 | máscara BR **Assunção** |
| Mensagem | textarea | Não | — | máx. 2000 caracteres |
| Consentimento LGPD | checkbox | Sim se lead for armazenado | marcado | obrigatório para envio |

## 5. Ações disponíveis

| Ação | Quem | Gatilho | Resultado | Auditoria |
|------|------|---------|-----------|-----------|
| Entrar | visitante | clique «Entrar» | navega para `/login` | opcional: evento analytics **Assunção** |
| Ir para demonstração / formulário | visitante | CTA | scroll, modal ou nova secção | — |
| Submeter formulário de interesse | visitante | clique «Enviar» | pedido `POST` à API ou serviço; mensagem de sucesso | registo server-side de lead de marketing **Assunção** |
| Alternar tema | visitante | toggle header | persiste preferência local | — |

## 6. Filtros

Não aplicável.

## 7. Validações

- Formulário: campos obrigatórios e formato de e-mail; anti-spam **Assunção** (honeypot ou reCAPTCHA **TBD**).
- URLs externas nos CTAs validadas no conteúdo (não injetar query perigosa).

## 8. Regras de negócio

- **RB-HOME-01:** A Home **não** expõe dados do CRM nem chama endpoints autenticados.
- **RB-HOME-02:** Submissão de formulário de interesse pode criar registo em tabela `marketing_leads` ou enviar e-mail — **definir** se entra no mesmo SQLite com flag ou só e-mail no MVP.
- **RB-HOME-03:** Usuário autenticado que acessa `/` pode ser redirecionado para `/dashboard` **opcionalmente** (configurável — evitar loop com logout).

## 9. Critérios de aceitação

- **Given** visitante anónimo, **when** abre `/`, **then** vê headline, CTAs e secções acordadas sem pedir login.
- **Given** clique em «Entrar», **when** navega, **then** abre a TELA 1 (Login) sem token JWT.
- **Given** formulário válido, **when** envia, **then** vê confirmação e dados não se perdem em caso de erro (retry).

## 10. Estados da tela

- **Carregando:** skeleton do hero e secções ou spinner discreto na primeira pintura.
- **Erro:** falha ao carregar recurso estático (imagem) com fallback; erro de envio de formulário com mensagem clara.
- **Sucesso de envio:** toast ou banner «Recebemos sua mensagem».
- **Sem permissão:** não aplicável (página pública).

## 11. Comportamento no tema claro e escuro

- Fundos e texto com contraste AA; hero e cards distinguíveis; botões primários e secundários coerentes com o Design System (Vuetify aplicado à camada pública ou tema paralelo **Assunção**).

## 12. Responsividade

- Uma coluna em mobile; menu hamburger para links do header; CTAs em largura total em ecrãs pequenos; imagens fluidas.

## 13. Observações para QA

- SEO básico: `title`, `meta description`, headings hierárquicos **Assunção**; Lighthouse acessibilidade; teste de teclado e foco; links «Entrar» e rodapé correctos.

## 14. Dependências da tela

- Vue Router com rota pública `/`.
- Copy e assets de marketing (imagens, textos legais).
- Opcional: `POST /api/v1/public/contact` ou integração e-mail (FastAPI) para o formulário — documentar em [`api-contracts.md`](./api-contracts.md) quando existir.

---

# TELA 1 — Login

## 1. Objetivo da tela

Autenticar usuários no CRM, criando sessão segura e redirecionando para a área autenticada com carregamento de tema, preferências de menu e permissões.

## 2. Perfil de usuário que acessa

- Todos os perfis, antes da sessão.
- Visitante sem credenciais.

## 3. Layout da tela

- Fundo de página em cor de superfície compatível com tema (claro ou escuro) conforme preferência do dispositivo ou seletor na própria tela de login (Assunção: preferência local até autenticar).
- Cartão centralizado (largura máxima ~400–440px) com logotipo, título «Entrar», formulário vertical.
- Campos com label visível; botão primário em largura total; link «Esqueci minha senha» abaixo dos campos ou no rodapé do cartão.
- Sem sidebar, sem topbar do aplicativo autenticado.
- Modal ou rota dedicada para recuperação de senha com o mesmo sistema visual.
- Link opcional **«Voltar ao site»** ou logotipo clicável para a **Home** pública (`/`).

## 4. Campos da tela

| Nome | Tipo | Obrigatório | Exemplo | Origem | Comportamento | Validação | Visibilidade |
|------|------|-------------|---------|--------|---------------|-----------|--------------|
| E-mail | email | Sim | comercial@empresa.com.br | usuário | foco inicial; trim ao perder foco | formato de e-mail | todos |
| Senha | password | Sim | (mascarado) | usuário | ícone para mostrar ou ocultar | política mínima da organização (Assunção: mínimo 8 caracteres se não houver configuração) | todos |
| Lembrar-me | checkbox booleano | Não | desmarcado | usuário | prolonga sessão conforme política de refresh | — | todos |

## 5. Ações disponíveis

| Ação | Quem | Gatilho | Resultado | Mensagens | Auditoria |
|------|------|---------|-----------|-----------|-----------|
| Entrar | todos | clique ou Enter | sessão criada; redirect para `/dashboard` ou rota anterior | erro: «E-mail ou senha inválidos» (genérico) | tentativa de login registrada (sucesso ou falha) |
| Esqueci minha senha | todos | clique no link | abre fluxo de e-mail de recuperação | «Se existir uma conta, enviaremos instruções por e-mail» | pedido de reset registrado |

## 6. Filtros

Não aplicável.

## 7. Validações

- E-mail obrigatório e formato válido.
- Senha obrigatória.
- Conta inativa: mensagem «Sua conta está inativa. Entre em contato com o administrador.»
- Bloqueio por tentativas: mensagem «Muitas tentativas. Tente novamente em X minutos.» quando política aplicável.

## 8. Regras de negócio

- **RB-L01:** Mensagens de erro de login não revelam se o e-mail existe.
- **RB-L02:** Utilizador com status diferente de ativo não obtém sessão.
- **RB-L03:** «Lembrar-me» altera apenas duração da sessão renovável, não as permissões.

## 9. Critérios de aceitação

- **Given** credenciais válidas de usuário ativo, **when** submete o formulário, **then** é redirecionado ao Dashboard e a sessão está ativa.
- **Given** senha errada, **when** submete, **then** não autentica e vê mensagem genérica.
- **Given** rede indisponível, **when** submete, **then** vê estado de erro de rede sem perder dados dos campos.

## 10. Estados da tela

- **Vazio:** formulário pronto para entrada.
- **Carregando:** botão com spinner e campos desabilitados.
- **Erro:** credenciais ou rede.
- **Sem permissão:** não aplicável antes da autenticação.

## 11. Comportamento no tema claro e escuro

- Cartão com sombra ou borda adequada em ambos os temas; inputs com fundo distinto; foco com anel visível; contraste AA no botão primário.

## 12. Responsividade

- Cartão com margens laterais em telas pequenas; teclado virtual não esconde o botão Entrar.

## 13. Observações para QA

- Tentativas múltiplas e bloqueio; cookie seguro em HTTPS; escape de HTML em mensagens; recuperação não enumera contas.

## 14. Dependências da tela

- API de autenticação; política de senha; serviço de e-mail para recuperação.

---

# TELA 2 — Dashboard

## 1. Objetivo da tela

Oferecer visão sintética do pipeline, tarefas e atividades relevantes ao usuário ou à sua equipe, permitindo saltos rápidos para entidades e ações frequentes.

## 2. Perfil de usuário que acessa

- Admin, Gestor, Vendedor, Atendimento: visão conforme permissão (dados próprios vs equipe vs organização).
- Leitura: widgets apenas de leitura.

## 3. Layout da tela

- **Shell:** sidebar retrátil, topbar com busca global, atalhos (ex.: novo lead, nova oportunidade, nova tarefa), menu do usuário.
- **Breadcrumbs:** `Início` ou `Dashboard`.
- **Área principal:** grelha responsiva de cartões (widgets).
- **Widgets sugeridos (configuráveis por Admin — Assunção):** valor do pipeline por etapa; oportunidades a fechar no período; tarefas atrasadas; últimas atividades; leads novos; gráfico simples de conversão ou funil.
- **Rodapé:** opcional com atalhos ou vazio.
- **Modais:** filtros de período global do dashboard (se aplicável) em modal ou painel.

## 4. Campos da tela

Os widgets exibem **dados derivados**, não formulário de edição. Cada número ou lista tem:

| Elemento | Tipo | Origem | Comportamento |
|----------|------|--------|---------------|
| Período | seleção (hoje, semana, mês, personalizado) | preferência do usuário na sessão | filtra todos os widgets |
| Cartão valor pipeline | moeda agregada | somatório de oportunidades abertas no âmbito de permissão | clique navega para Oportunidades com filtro |
| Lista tarefas | lista de títulos com vencimento | tarefas do responsável ou equipe | clique abre detalhe da tarefa |
| Lista atividades | tipo, título, data | últimas N atividades | clique abre detalhe ou entidade relacionada |

## 5. Ações disponíveis

| Ação | Quem | Gatilho | Resultado |
|------|------|---------|-----------|
| Alterar período | permissão de ver dashboard | selector | recalcula widgets |
| Ir para entidade | quem vê o cartão | clique em linha ou número | navegação com filtros pré-preenchidos |
| Personalizar widgets | Admin (Assunção) | configuração | guarda layout — TBD se não estiver no MVP |

## 6. Filtros

- **Filtro global de período:** data início e data fim ou presets; aplica a todos os widgets que usam data.
- **Filtro de âmbito (Gestor/Admin):** equipe ou usuário — **filtro rápido** na barra do dashboard quando permitido.
- **Filtros avançados:** não obrigatório no MVP além do período e âmbito; **Assunção:** qualquer filtro extra entra em painel secundário.

## 7. Validações

- Intervalo de datas: início ≤ fim.
- Utilizador sem permissão para ver dados de equipe não vê selector de equipe.

## 8. Regras de negócio

- **RB-D01:** Agregações respeitam RBAC e isolamento por equipe quando configurado.
- **RB-D02:** Widgets vazios mostram CTA «Criar primeira oportunidade» ou equivalente com permissão.

## 9. Critérios de aceitação

- **Given** vendedor com oportunidades, **when** abre o Dashboard, **when** vê pelo menos o valor agregado e lista de tarefas pendentes.
- **Given** período sem dados, **when** selecciona o período, **then** widgets mostram estado vazio explicativo.

## 10. Estados da tela

- **Vazio:** mensagens por widget com ilustração leve e CTA.
- **Carregando:** skeletons nos cartões.
- **Erro:** mensagem por widget ou global com retry.
- **Sem permissão:** página com mensagem «Sem permissão para ver o dashboard» ou redirecionamento conforme política.

## 11. Comportamento no tema claro e escuro

- Cartões com fundo elevado; gráficos com paleta adaptada; eixos e legendas legíveis em ambos os temas.

## 12. Responsividade

- Grelha de 1 coluna em mobile; cartões empilhados; período em linha única ou em sheet inferior.

## 13. Observações para QA

- Permissões por perfil; cache e atualização após mudança de período; timezone nas datas (Assunção: timezone do usuário).

## 14. Dependências da tela

- APIs de agregação de oportunidades, tarefas e atividades; permissões.

---

# TELA 3 — Leads — Listagem

## 1. Objetivo da tela

Listar leads com pesquisa, filtragem, ordenação e ações em massa para trabalho comercial quotidiano.

## 2. Perfil de usuário que acessa

- Vendedor, Atendimento, Gestor, Admin: listar conforme âmbito.
- Leitura: sem ações de escrita.

## 3. Layout da tela

- Breadcrumbs: `Leads`.
- Barra de ações: botão primário «Novo lead»; alternância **Tabela | Kanban** (por padrão: Tabela). **Kanban:** colunas = **etapas de qualificação** cadastradas (domínio configurável em Configurações ou lista fixa — Assunção: lista administrável); cartões com nome, empresa, responsável, próxima interação, temperatura; arrastar e largar altera a **etapa de qualificação** do lead; totais por coluna (contagem e, opcionalmente, soma de score médio — Assunção: contagem por padrão); exportar (CSV) se permitido.
- **Filtros rápidos (visíveis por padrão):** busca por texto (nome, e-mail, telefone); status; responsável; intervalo de «próxima interação».
- **Filtros avançados (drawer):** todos os campos da entidade Lead listados abaixo que forem filtráveis, mais campos customizados filtráveis.
- Tabela com colunas configuráveis (Assunção: usuário escolhe colunas visíveis).
- Paginação inferior; selector de linhas por página.
- Estados: skeleton na primeira carga; linha com menu de ações «⋯».

## 4. Campos da tela (colunas padrão sugeridas)

| Coluna | Tipo exibido | Origem |
|--------|--------------|--------|
| Nome | texto | lead.nome |
| Empresa | texto | lead.empresa |
| E-mail | texto | lead.email |
| Telefone | texto | lead.telefone |
| Status | badge | lead.status |
| Etapa de qualificação | texto | lead.etapa de qualificação |
| Responsável | avatar + nome | lead.responsável |
| Temperatura | badge | lead.temperatura |
| Próxima interação | data | lead.próxima interação |
| Atualizado em | data/hora | lead.atualizado em |

Campos customizados aparecem como colunas opcionais.

## 5. Ações disponíveis

| Ação | Quem | Gatilho | Resultado | Auditoria |
|------|------|---------|-----------|-----------|
| Novo lead | com permissão criar | botão | navega para Lead — Criar | — |
| Abrir detalhe | ver | clique na linha ou nome | Lead — Detalhe | — |
| Editar | editar | menu linha | Lead — Editar | registro de edição |
| Excluir | eliminar | menu linha; confirmação modal | remoção lógica ou física conforme política | registro |
| Converter em oportunidade | permissão específica | menu linha | abre fluxo de conversão (modal) | registro |
| Exportar | exportar | botão barra | arquivo com filtros atuais | registro de exportação |
| Acções em massa | conforme permissão | seleção múltipla | alterar responsável, status, tags | registro por item |

## 6. Filtros

**Visíveis por padrão (barra rápida):**

| Filtro | Tipo | Origem valores |
|--------|------|----------------|
| Busca global da listagem | texto livre | múltiplos campos texto |
| Status | multi-seleção | valores cadastrados do domínio status |
| Responsável | usuário | lista de usuários ativos do âmbito |
| Próxima interação | intervalo de datas | calendário |

**Avançados (drawer):** nome (texto); empresa; e-mail; telefone; telefone secundário; cargo; origem; canal; campanha; segmento; porte da empresa; cidade; estado; país; etapa de qualificação; equipe; interesse ou produto; temperatura; intervalo de score; tags; intervalo data primeiro contato; intervalo último contato; intervalo criado em; intervalo atualizado em; campos customizados filtráveis por tipo.

**Ordenação:** nome, próxima interação, atualizado em, score, valor não existe em lead — não listar.

**Chips:** um chip por filtro activo; remover individualmente; «Limpar tudo».

## 7. Validações

- Intervalos de data coherentes.
- Exportação: limite de linhas (Assunção: aviso se exceder).

## 8. Regras de negócio

- **RB-LE-L01:** Utilizador só vê leads do seu âmbito salvo permissão de ver todos.
- **RB-LE-L02:** Exclusão pode ser bloqueada se lead convertido — depende de política (Assunção: não apagar fisicamente se existir oportunidade vinculada).
- **RB-LE-L03 (Kanban):** Ao arrastar para outra coluna, atualiza apenas a **etapa de qualificação**; validações de obrigatoriedade ao entrar numa etapa seguem configuração do domínio (Assunção: sem bloqueio por padrão).
- **RB-LE-L04 (Kanban):** Totais por coluna reflectem filtros activos (mesma regra da tabela).

## 9. Critérios de aceitação

- **Given** filtros aplicados, **when** lista carrega, **then** só aparecem leads que cumprem todos os critérios combinados (AND entre tipos salvo OR interno em multi-seleção do mesmo campo).

## 10. Estados da tela

- **Vazio global:** CTA criar lead.
- **Sem resultados com filtros:** mensagem e botão limpar filtros.
- **Carregando:** skeleton.
- **Erro:** retry.
- **Sem permissão:** empty state de permissão.

## 11. Comportamento no tema claro e escuro

- Linhas zebradas subtis; hover em linha; badges com cores semânticas ajustadas ao tema.

## 12. Responsividade

- Tabela com scroll horizontal ou cartões empilhados em mobile (Assunção: modo cartão alternativo).

## 13. Observações para QA

- Persistência de filtros na sessão; export com filtros; permissões em massa.

## 14. Dependências da tela

- API de listagem de leads; domínios de status e etapas; permissões.

---

# TELA 4 — Lead — Detalhe

## 1. Objetivo da tela

Apresentar ficha completa do lead, histórico de interações, tarefas e atividades vinculadas, e permitir ações contextuais (editar, converter, criar tarefa ou atividade).

## 2. Perfil de usuário que acessa

- Vendedor, Atendimento, Gestor, Admin com permissão de ver o lead.
- Leitura: sem edição.

## 3. Layout da tela

- Breadcrumbs: `Leads > [Nome do lead]`.
- **Cabeçalho do registro:** nome do lead como título; badges de status, temperatura e etapa de qualificação; botões «Editar», «Converter», «Mais ações» (excluir, duplicar se existir).
- **Coluna principal:** secções em cartões — Dados gerais; Contacto; Localização; Qualificação comercial; Datas; Observações; Tags.
- **Coluna lateral ou abas:** Tarefas relacionadas; Atividades; Histórico de alterações (auditoria).
- **Drawer:** criação rápida de tarefa ou atividade sem sair da página.

## 4. Campos da tela (visualização)

Todos os campos da entidade Lead em modo leitura, incluindo campos customizados com rótulo e valor formatado (datas localizadas pt-BR, telefones com máscara de exibição).

| Campo | Tipo exibido | Comportamento |
|-------|--------------|---------------|
| id | texto | copiável |
| nome | texto | — |
| empresa | texto com link se existir empresa cadastrada (Assunção: match por nome ou vínculo futuro) | — |
| email | link mailto | — |
| telefones | texto | clique para copiar ou discar (Assunção: `tel:`) |
| score | número | — |
| observações | rich text ou texto multilinha | — |
| criado em / atualizado em | data/hora | timezone usuário |

## 5. Ações disponíveis

| Ação | Quem | Resultado | Auditoria |
|------|------|-----------|-----------|
| Editar | editar | Lead — Editar | sim |
| Converter em oportunidade | permissão | modal com mapeamento de campos | sim |
| Nova tarefa | criar tarefa | drawer com lead pré-preenchido | sim |
| Registrar atividade | criar atividade | drawer | sim |
| Excluir | eliminar | confirmação | sim |

## 6. Filtros

Não aplicável na ficha; listas internas (tarefas, atividades) com filtros locais: status, período.

## 7. Validações

- Conversão: campos obrigatórios da oportunidade antes de confirmar (título, pipeline, etapa).

## 8. Regras de negócio

- **RB-LD-01:** Ao converter, mantém referência ao lead de origem na oportunidade criada.
- **RB-LD-02:** Responsável pode ser restringido a alteração por Gestor ou Admin conforme permissão.

## 9. Critérios de aceitação

- **Given** lead existente, **when** abre detalhe, **then** todos os campos visíveis conforme perfil e campos customizados activos.

## 10. Estados da tela

- **Carregando:** skeleton da ficha.
- **Erro:** não encontrado ou rede.
- **Sem permissão:** mensagem e botão voltar.

## 11. Comportamento no tema claro e escuro

- Cartões com separação visual clara; badges legíveis.

## 12. Responsividade

- Secções empilhadas; sidebar de tarefas vira aba inferior ou acordeão.

## 13. Observações para QA

- Links externos; permissão de conversão; auditoria de alterações.

## 14. Dependências da tela

- APIs de detalhe, tarefas e atividades por lead; permissões.

---

# TELA 5 — Lead — Criar / Editar

## 1. Objetivo da tela

Criar novo lead ou alterar lead existente com validação e consistência de dados.

## 2. Perfil de usuário que acessa

- Quem tem permissão `criar` ou `editar` em Leads.

## 3. Layout da tela

- Breadcrumbs: `Leads > Novo` ou `Leads > [Nome] > Editar`.
- Formulário em secções: **Identificação** (nome, empresa, cargo); **Contacto** (e-mails, telefones); **Origem** (origem, canal, campanha); **Qualificação** (segmento, porte, etapa, temperatura, score); **Geografia** (país, estado, cidade); **Atribuição** (responsável, equipe); **Datas**; **Observações e tags**.
- Campos customizados agrupados no final ou em seção «Campos adicionais».
- Rodapé fixo: «Cancelar», «Guardar rascunho» (Assunção: opcional), «Guardar».

## 4. Campos da tela

| Campo | Tipo | Obrigatório | Exemplo | Origem | Validação |
|-------|------|-------------|---------|--------|-----------|
| nome | texto | Sim | «Maria Silva» | usuário | não vazio; máx. 200 caracteres |
| empresa | texto | Não | «Acme Ltda» | usuário | — |
| email | email | Não | maria@acme.com.br | usuário | formato |
| telefone | telefone | Não | (11) 98765-4321 | usuário | máscara BR (Assunção) |
| telefone secundário | telefone | Não | — | usuário | igual |
| cargo | texto | Não | «Directora comercial» | usuário | — |
| origem | seleção única | Não | «Indicação» | cadastro | — |
| canal | seleção única | Não | «LinkedIn» | cadastro | — |
| campanha | texto ou seleção | Não | «Q1-2026» | cadastro | — |
| segmento | seleção | Não | «Tecnologia» | cadastro | — |
| porte da empresa | seleção | Não | «Médio» | cadastro | — |
| cidade, estado, país | texto / seleção | Não | — | cadastro / IBGE Assunção | — |
| status | seleção | Sim (defeito no criar) | «Novo» | cadastro | — |
| etapa de qualificação | seleção | Não | «Contacto inicial» | cadastro | — |
| responsável | usuário | Não | usuário atual | lista usuários | — |
| equipe | seleção | Não | — | cadastro | — |
| interesse ou produto | texto ou multi | Não | — | usuário | — |
| temperatura | seleção | Não | «Morna» | cadastro | — |
| score | número | Não | 42 | usuário | intervalo 0–100 Assunção |
| tags | multi tags | Não | — | cadastro tags | — |
| observações | textarea | Não | — | usuário | máx. 5000 |
| data primeiro contato | data | Não | — | usuário | — |
| data último contato | data | Não | — | usuário | — |
| próxima interação | data/hora | Não | — | usuário | não no passado distante Assunção |

Campos customizados conforme definição em Configurações — Campos customizados.

## 5. Ações disponíveis

- Guardar: persiste e redireciona ao detalhe ou lista conforme preferência.
- Cancelar: confirma se houver alterações não guardadas.

## 6. Filtros

Não aplicável.

## 7. Validações

- Duplicidade de e-mail ou telefone: aviso não bloqueante ou bloqueante conforme política (Assunção: aviso com opção «Continuar mesmo assim»).
- Responsável obrigatório se política da organização exigir (configurável — TBD).

## 8. Regras de negócio

- **RB-LF-01:** Ao criar, `criado em` e `atualizado em` definidos pelo servidor.
- **RB-LF-02:** Alteração de responsável pode exigir motivo (Assunção: opcional).

## 9. Critérios de aceitação

- **Given** formulário válido, **when** guarda, **then** lead aparece na listagem com dados correctos.

## 10. Estados da tela

- Carregando em edição; erro de carregamento; erro de validação inline por campo.

## 11. Comportamento no tema claro e escuro

- Bordas de erro e foco visíveis; placeholders com contraste adequado.

## 12. Responsividade

- Uma coluna em mobile; secções em acordeão.

## 13. Observações para QA

- Máscaras; perda de dados ao sair; campos condicionais.

## 14. Dependências da tela

- APIs create/update; domínios; tags.

---

# TELA 6 — Empresas — Listagem

## 1. Objetivo da tela

Listar empresas com filtros, ordenação e ações para gestão de contas.

## 2. Perfil de usuário que acessa

- Vendedor, Atendimento, Gestor, Admin; Leitura só leitura.

## 3. Layout da tela

- Breadcrumbs: `Empresas`.
- Barra: «Nova empresa»; toggle **Tabela** (Kanban **não** aplicável a empresas — apenas tabela).
- **Filtros rápidos:** busca texto (razão social, fantasia, CNPJ); status; responsável comercial; segmento.
- **Filtros avançados:** todos os campos filtráveis da entidade Empresa e customizados.
- Tabela com colunas padrão; paginação.

## 4. Campos (colunas sugeridas)

| Coluna | Origem |
|--------|--------|
| Razão social | razão social |
| Nome fantasia | nome fantasia |
| CNPJ | CNPJ formatado |
| Segmento | segmento |
| Porte | porte |
| Cidade / Estado | cidade, estado |
| Status | status |
| Responsável comercial | responsável |
| Atualizado em | atualizado em |

## 5. Ações disponíveis

- Novo, abrir detalhe, editar, excluir (com regras), exportar, massa: alterar responsável, status, tags.

## 6. Filtros

**Rápidos:** busca; status; responsável comercial; segmento.

**Avançados:** razão social; nome fantasia; CNPJ (texto ou máscara); subsegmento; porte; número de funcionários (faixa); faturamento estimado (faixa moeda); site; telefone; email corporativo; país; estado; cidade; endereço; CEP; origem; equipe; tags; intervalos criado em / atualizado em; campos customizados filtráveis.

**Ordenação:** razão social, atualizado em, faturamento estimado, cidade.

**Chips e limpeza:** padrão global.

## 7. Validações

- Export: limite de linhas.

## 8. Regras de negócio

- **RB-EM-L01:** CNPJ único na organização (Assunção: aviso ao duplicar).

## 9. Critérios de aceitação

- Filtros combinados com AND; multi-seleção OR dentro do mesmo campo quando aplicável.

## 10. Estados da tela

- Padrão de listagem.

## 11. Comportamento no tema claro e escuro

- Tabela com linhas alternadas subtis; badges de status; cabeçalhos fixos opcionais ao fazer scroll; ícones de acção com estado de foco visível.

## 12. Responsividade

- Em viewports estreitas: scroll horizontal da tabela com indicação de conteúdo cortado ou cartões empilhados (modo alternativo); filtros rápidos em carrossel ou menu «Filtros».

## 13. Observações para QA

- CNPJ com e sem formatação na busca; máscara; exportação com filtros activos; permissões de linha.

## 14. Dependências da tela

- API empresas; permissões; domínios de status e segmento.

---

# TELA 7 — Empresa — Detalhe

## 1. Objetivo da tela

Ficha da empresa com contatos vinculados, oportunidades e tarefas.

## 2. Perfil

- Quem pode ver empresas.

## 3. Layout

- Breadcrumbs `Empresas > [Razão social]`.
- Cabeçalho com título, status, CNPJ; ações Editar, Nova oportunidade, Novo contato.
- Cartões: Dados fiscais e comerciais; Endereço; Observações; Tags.
- Secções relacionadas: Contactos (tabela embutida); Oportunidades; Tarefas; Atividades.

## 4. Campos

Todos os campos Empresa em leitura; tabelas relacionadas com colunas resumidas.

## 5. Ações

Editar; excluir; criar contato; criar oportunidade; criar tarefa; registrar atividade.

## 6. Filtros

Listas embutidas: filtros locais por status e texto.

## 7. Validações

- Exclusão bloqueada se existirem oportunidades abertas (Assunção: ou apenas aviso).

## 8. Regras de negócio

- **RB-ED-01:** Responsável comercial visível em toda a hierarquia de contatos por padrão (Assunção).

## 9. Critérios de aceitação

- Navegação para contato e oportunidade mantém contexto de volta.

## 10. Estados da tela

- Carregamento com skeleton; registro não encontrado; erro de rede; sem permissão com mensagem clara.

## 11. Comportamento no tema claro e escuro

- Secções em cartões com elevación consistente; links e botões com contraste adequado; tabelas embutidas com cabeçalho distinguível.

## 12. Responsividade

- Coluna lateral passa a abas horizontais ou acordeão; tabelas relacionadas com scroll horizontal.

## 13. Observações para QA

- Contagem de relacionamentos correcta; links para entidades sem permissão tratados; ordenação nas sub-tabelas.

## 14. Dependências da tela

- APIs de empresa, contatos, oportunidades, tarefas e atividades filtradas por empresa; permissões.

---

# TELA 8 — Empresa — Criar / Editar

## 1. Objetivo

Criar ou editar empresa.

## 2. Perfil

- Permissão criar/editar empresas.

## 3. Layout

Secções: Identificação fiscal; Comercial; Endereço; Atribuição; Observações; Campos adicionais.

## 4. Campos

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| razão social | texto | Sim | máx. 255 |
| nome fantasia | texto | Não | — |
| CNPJ | texto com máscara | Não | dígitos verificadores BR (Assunção: validação completa) |
| segmento, subsegmento | seleção | Não | — |
| porte | seleção | Não | — |
| número de funcionários | número inteiro | Não | ≥ 0 |
| faturamento estimado | moeda | Não | ≥ 0 |
| site | URL | Não | formato URL |
| telefone | telefone | Não | máscara |
| email corporativo | email | Não | formato |
| país, estado, cidade, endereço, CEP | misto | Não | CEP máscara BR |
| status | seleção | Sim | — |
| origem | seleção | Não | — |
| responsável comercial | usuário | Não | — |
| equipe | seleção | Não | — |
| tags | multi | Não | — |
| observações | textarea | Não | — |

## 5–10. Acções, filtros, validações, RN, critérios, estados

- Guardar/Cancelar; CNPJ único; estados de formulário padrão.

## 11–12. Tema e responsividade

- Padrão.

## 13. QA

- CNPJ inválido; site sem protocolo (auto-prefixar https Assunção).

## 14. Dependências

- API; domínios.

---

# TELA 9 — Contatos — Listagem

## 1. Objetivo

Listar contatos com filtros e ligação a empresas.

## 2. Perfil

- Equipa comercial e atendimento.

## 3. Layout

- Breadcrumbs `Contatos`.
- «Novo contato»; **tabela** (Kanban não aplicável).
- **Filtros rápidos:** busca; status; responsável; empresa vinculada (autocomplete).
- **Avançados:** todos os campos filtráveis do Contacto e customizados.

## 4. Colunas sugeridas

Nome completo; Empresa; Cargo; E-mail principal; Telefone; Status; Responsável; Atualizado em.

## 5. Acções

Novo; detalhe; editar; excluir; exportar; massa: responsável, tags.

## 6. Filtros

**Rápidos:** busca; status; responsável; empresa.

**Avançados:** primeiro nome; sobrenome; cargo; departamento; emails; telefones; WhatsApp; LinkedIn; cidade; estado; país; intervalo data nascimento; origem; equipe; preferência de contato; melhor horário; tags; intervalos datas; customizados.

**Ordenação:** nome, empresa, atualizado em.

## 7–14. Validações, RN, critérios, estados, tema, responsividade, QA, dependências

- **RB-CO-L01:** E-mail principal único por organização (Assunção).
- Restante alinhado ao padrão de Leads.

---

# TELA 10 — Contato — Detalhe

## 1. Objetivo

Ficha do contato com empresa, oportunidades, tarefas e atividades.

## 2. Perfil

- Ver contatos.

## 3. Layout

- Breadcrumbs `Contatos > [Nome]`.
- Cabeçalho: nome, cargo, empresa (link); ações Editar, «Criar oportunidade», tarefa, atividade.
- Cartões: Dados pessoais; Contacto; Preferências; Observações; Tags.
- Relacionados: Oportunidades; Tarefas; Atividades.

## 4. Campos

Todos os campos Contacto em leitura.

## 5. Acções

Editar; excluir; criar oportunidade; tarefa; atividade; enviar e-mail (Assunção: abre `mailto:`).

## 6–14.

- Filtros nas listas embutidas; RN de vínculo empresa obrigatório para certas ações (TBD política); dependências API.

---

# TELA 11 — Contato — Criar / Editar

## 1. Objetivo

Criar ou editar contato.

## 2. Perfil

- Criar/editar contatos.

## 3. Layout

Secções: Nome; Empresa; Departamento e cargo; Contactos; Localização; Preferências; Observações; Campos adicionais.

## 4. Campos

| Campo | Obrigatório | Validação |
|-------|-------------|-----------|
| nome completo OU primeiro+sobrenome | Sim (pelo menos um esquema) | — |
| empresa vinculada | Não | seleção de empresa existente |
| cargo, departamento | Não | — |
| emails, telefones | Não | formato |
| WhatsApp, LinkedIn | Não | formato URL para LinkedIn |
| cidade, estado, país | Não | — |
| data nascimento | Não | não futura |
| status | Sim no criar | — |
| origem, responsável, equipe | Não | — |
| tags, preferência de contato, melhor horário | Não | — |
| observações | Não | — |

## 5–14.

- Guardar/Cancelar; duplicidade e-mail; padrão formulário.

---

# TELA 12 — Oportunidades — Listagem

## 1. Objetivo

Listar oportunidades com pipeline, valores e datas.

## 2. Perfil

- Comercial e gestão.

## 3. Layout

- Breadcrumbs `Oportunidades`.
- «Nova oportunidade»; toggle **Tabela | Kanban** — Kanban navega para TELA 15 ou vista embutida (mesma regra Kanban).
- **Filtros rápidos:** busca; pipeline; etapa (multi); status; responsável; intervalo previsão fecho.
- **Avançados:** todos os campos Oportunidade filtráveis.

## 4. Colunas sugeridas

Título; Empresa; Valor estimado; Etapa; Pipeline; Probabilidade; Previsão fecho; Responsável; Status; Atualizado em.

## 5. Acções

Nova; detalhe; editar; duplicar; excluir; mudar etapa (modal rápido); exportar; massa: responsável, etapa, tags.

## 6. Filtros

**Rápidos:** busca; pipeline; etapa; status; responsável; previsão fecho.

**Avançados:** título; empresa; contato principal; lead origem; equipe; produto/serviço; categoria; origem; valor estimado (faixa); valor fechado (faixa); probabilidade (faixa); intervalo datas abertura/fecho; motivos ganho/perda; concorrente; prioridade; temperatura; tags; próximo passo; data próxima ação; último contato; customizados.

**Ordenação:** previsão fecho, valor estimado, atualizado em, probabilidade.

## 7–14.

- **RB-OP-L01:** Valores em moeda da organização (Assunção: BRL).
- Padrão listagem.

---

# TELA 13 — Oportunidade — Detalhe

## 1. Objetivo

Ficha completa da oportunidade com pipeline, histórico e próximos passos.

## 2. Perfil

- Quem acede ao registro.

## 3. Layout

- Breadcrumbs `Oportunidades > [Título]`.
- Cabeçalho: título; valor estimado; probabilidade; badges status e etapa; ações Editar, Ganhar, Perder, Nova tarefa, Atividade.
- Cartões: Resumo comercial; Datas e valores; Descrição e próximo passo; Tags.
- Linha temporal de atividades e alterações de etapa.

## 4. Campos

Todos os campos Oportunidade em leitura; links para empresa, contato, lead origem.

## 5. Acções

Editar; marcar como ganha; marcar como perdida; mover etapa; criar tarefa; registar atividade; duplicar.

## 6. Filtros

Listas embutidas com filtros locais.

## 7. Validações

- Ganhar: valor fechado e data fecho obrigatórios.
- Perder: motivo perda obrigatório.

## 8. Regras de negócio

- **RB-OD-01:** Mudança para etapa fechada ganha ou perdida exige campos conforme configuração.
- **RB-OD-02:** Motivo de ganho e concorrente podem ser obrigatórios por pipeline (configuração).

## 9–14.

- Estados de ficha; tema; QA de transições de pipeline.

---

# TELA 14 — Oportunidade — Criar / Editar

## 1. Objetivo

Criar ou editar oportunidade.

## 2. Perfil

- Permissão em oportunidades.

## 3. Layout

Secções: Identificação; Entidades relacionadas; Pipeline; Valores e probabilidades; Datas; Detalhes comerciais; Observações; Campos adicionais.

## 4. Campos

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| título | Sim | — |
| empresa | Sim | seleção |
| contato principal | Não | filtrado por empresa |
| lead origem | Não | — |
| pipeline | Sim | — |
| etapa atual | Sim | válida no pipeline |
| status | Sim | coerente com etapa |
| responsável, equipe | Não | — |
| produto/serviço, categoria, origem | Não | — |
| valor estimado | Não | moeda ≥ 0 |
| valor fechado | Condicional | em fecho |
| probabilidade | Não | 0–100 |
| previsão fecho | Não | data |
| datas abertura/fecho | Condicional | — |
| motivos perda/ganho | Condicional | ao fechar |
| concorrente | Não | — |
| prioridade, temperatura | Não | — |
| descrição, próximo passo | Não | — |
| data próxima ação, último contato | Não | — |

## 5–14.

- Dependências entre empresa e contato; validação de etapa no pipeline; restante padrão.

---

# TELA 15 — Kanban de Oportunidades

## 1. Objetivo

Visualizar oportunidades por etapa do pipeline com arrastar e largar e totais por coluna.

## 2. Perfil

- Utilizadores com permissão de ver e mover oportunidades.

## 3. Layout

- Breadcrumbs `Oportunidades > Kanban`.
- Selector de **pipeline** (obrigatório se existir mais de um).
- **Filtros rápidos:** mesmos que listagem — responsável; equipe; status; intervalo previsão; busca por título.
- **Filtros avançados:** drawer idêntico à listagem de oportunidades.
- **Área Kanban:** colunas horizontais scrolláveis = **etapas do pipeline seleccionado**, ordem configurada em Configurações — Pipelines.
- Cada coluna: cabeçalho com nome da etapa, **contagem** de cartões, **soma do valor estimado** (configurável mostrar ou ocultar — **visível por padrão** para gestão).
- **Cartão:** título; empresa; valor estimado; probabilidade; previsão fecho; responsável (avatar); indicador de prioridade ou temperatura; ícone de alerta se tarefa atrasada (Assunção).

## 4. Campos no cartão

Campos exibidos conforme configuração de cartão (Assunção: mínimo título, valor, responsável, previsão).

## 5. Acções

| Ação | Quem | Gatilho | Resultado |
|------|------|---------|-----------|
| Arrastar cartão | mover | drag and drop | atualiza etapa; valida regras de entrada/saída |
| Abrir detalhe | ver | clique no cartão | TELA 13 |
| Editar rápido | editar | menu no cartão | modal com campos chave |
| Nova oportunidade | criar | botão | TELA 14 com pipeline pré-preenchido |

## 6. Filtros

Iguais à TELA 12; chips; limpar; **persistência** na sessão.

## 7. Validações

- Arrastar: se etapa destino não permitir entrada por regra, mostrar toast de erro e reverter animação.
- Oportunidade «ganha» ou «perdida» pode estar bloqueada para movimento (só colunas de arquivo — Assunção).

## 8. Regras de negócio

- **RB-KB-01:** Ao soltar no destino, regista-se alteração de etapa com usuário e data.
- **RB-KB-02:** Totais por coluna recalculam após movimento ou filtro.
- **RB-KB-03:** Etapas finais podem exigir campos obrigatórios antes de entrar (modal de confirmação).

## 9. Critérios de aceitação

- **Given** cartão movido para etapa válida, **when** API confirma, **then** cartão aparece na nova coluna e totais atualizam.

## 10. Estados

- Loading skeleton das colunas; erro ao carregar pipeline; vazio: mensagem por coluna; sem permissão: overlay.

## 11. Tema claro e escuro

- Colunas com fundo ligeiramente distinto; cartões com sombra adequada; drag com ghost visível em ambos os temas.

## 12. Responsividade

- Em mobile: vista lista ou colunas empilhadas verticalmente (Assunção: alternar para tabela abaixo de breakpoint).

## 13. QA

- DnD com teclado (acessibilidade — alternativa modal de mover etapa); concorrência (dois usuários); filtros com Kanban.

## 14. Dependências

- API de pipeline e etapas; configuração de pipelines; permissões mover.

---

# TELA 16 — Tarefas — Listagem

## 1. Objetivo

Listar tarefas com vencimento, prioridade e vínculos a entidades.

## 2. Perfil

- Todos os perfis operacionais.

## 3. Layout

- Breadcrumbs `Tarefas`.
- «Nova tarefa»; **Tabela**; opcional vista **calendário** (Assunção: fase 2 — não obrigatório neste documento).
- **Filtros rápidos:** status; responsável; vencimento (hoje, atrasadas, semana); prioridade.
- **Avançados:** todos os campos Tarefa filtráveis.

## 4. Colunas

Título; Tipo; Entidade relacionada (resumo); Responsável; Prioridade; Status; Vencimento; Tags.

## 5. Acções

Nova; concluir; editar; excluir; reabrir; exportar; massa: concluir, alterar responsável, vencimento.

## 6. Filtros

**Rápidos:** status; responsável; vencimento; prioridade.

**Avançados:** título; descrição; tipo; lead, contato, empresa, oportunidade relacionados; criador; intervalo vencimento; hora; lembrete; recorrência; tags; concluído em; customizados.

**Ordenação:** vencimento, prioridade, atualizado em.

## 7–14.

- **RB-TA-L01:** Tarefa concluída não aparece em «pendentes» salvo filtro.

---

# TELA 17 — Tarefa — Criar / Editar

## 1. Objetivo

Criar ou editar tarefa.

## 2. Perfil

- Criar/editar tarefas.

## 3. Layout

Secções: Identificação; Vinculação a entidade; Prazo e lembrete; Recorrência; Tags.

## 4. Campos

| Campo | Obrigatório | Validação |
|-------|-------------|-----------|
| título | Sim | — |
| descrição | Não | — |
| tipo | Não | seleção |
| entidade relacionada | Não | escolher tipo e depois registro |
| lead, contato, empresa, oportunidade | Condicional | conforme entidade escolhida |
| responsável | Sim | — |
| prioridade | Não | — |
| status | Sim | — |
| data vencimento | Não | — |
| hora | Não | — |
| lembrete | Não | relativo ou absoluto |
| recorrência | Não | regras semanalmente, etc. |
| tags | Não | — |

## 5–14.

- Recorrência cria série (Assunção: backend); validação vencimento no passado com aviso.

---

# TELA 18 — Atividades — Listagem

## 1. Objetivo

Registo histórico de interações com filtros por tipo e entidade.

## 2. Perfil

- Equipa comercial.

## 3. Layout

- Breadcrumbs `Atividades`.
- «Registrar atividade»; **tabela** (Kanban não aplicável).
- **Filtros rápidos:** tipo; período (data da atividade); responsável; entidade (lead, contato, empresa, oportunidade).
- **Avançados:** todos os campos Atividade.

## 4. Colunas

Tipo; Título; Entidade relacionada; Responsável; Data e hora; Canal; Resultado; Autor.

## 5. Acções

Novo; ver detalhe; editar (se permitido); excluir; exportar.

## 6. Filtros

**Rápidos:** tipo; intervalo data; responsável.

**Avançados:** título; descrição; lead, contato, empresa, oportunidade; autor; resultado; duração (faixa); canal; tags; criado em.

**Ordenação:** data hora descendente por padrão.

## 7–14.

- **RB-AT-L01:** Edição de atividade antiga pode ser restrita no tempo (Assunção: configurável).

---

# TELA 19 — Atividade — Criar / Editar

## 1. Objetivo

Registar ou corrigir atividade.

## 2. Perfil

- Criar/editar conforme política.

## 3. Layout

Secções: Tipo e resultado; Vinculação; Quando e canal; Descrição; Tags.

## 4. Campos

| Campo | Obrigatório |
|-------|-------------|
| tipo | Sim |
| título | Sim |
| descrição | Não |
| entidade e lead/contato/empresa/oportunidade | Pelo menos uma vinculação |
| responsável | Sim |
| data e hora | Sim |
| resultado | Não |
| duração | Não |
| canal | Não |
| tags | Não |

**Nota:** autor do registro preenchido pelo sistema com usuário atual.

## 5–14.

- Validação data futura permitida para agendamento (Assunção: tipo «reunião agendada»).

---

# TELA 20 — Relatórios

## 1. Objetivo

Área de relatórios gerenciais e operacionais com export.

## 2. Perfil

- Gestor e Admin; Vendedor com relatórios próprios se permitido.

## 3. Layout

- Breadcrumbs `Relatórios`.
- Lista de **relatórios disponíveis** em cartões ou tabela: Pipeline por etapa; Conversão lead → oportunidade; Tarefas por responsável; Atividades por período; Oportunidades ganhas/perdidas por motivo; Previsão de receita (Assunção: catálogo configurável).
- Ao seleccionar relatório: painel de **parâmetros** (período, equipe, usuário, pipeline); botão «Gerar»; preview em tabela ou gráfico; «Exportar CSV/PDF» (Assunção: PDF fase 2).

## 4. Campos

Parâmetros dinâmicos por relatório; sempre período e âmbito quando aplicável.

## 5. Acções

Gerar; exportar; agendar envio por e-mail (Assunção: TBD).

## 6. Filtros

Cada relatório define filtros próprios; seguem padrão rápido + avançado quando aplicável.

## 7–14.

- Permissão por tipo de relatório; cache de resultados; tema em gráficos (cores distintas claro/escuro).

---

# TELA 21 — Usuários — Listagem

## 1. Objetivo

Gerir contas de usuários do CRM.

## 2. Perfil

- Admin; Gestor se permitido pela política (Assunção: só Admin no MVP).

## 3. Layout

- Breadcrumbs `Usuários`.
- «Novo usuário»; **tabela**.
- **Filtros rápidos:** busca nome/email; status; perfil de acesso; equipe.
- **Avançados:** telefone; cargo; tema preferido; intervalo último acesso; criado em.

## 4. Colunas

Nome; E-mail; Perfil; Equipe; Status; Último acesso; Tema preferido.

## 5. Acções

Convidar ou criar; editar; desactivar; redefinir senha (envio e-mail); impersonação (Assunção: só Admin e auditada).

## 6. Filtros

**Rápidos:** busca; status; perfil; equipe.

**Avançados:** restantes campos filtráveis User.

## 7–14.

- **RB-US-L01:** Não é possível desactivar a própria conta sem transferência Admin (Assunção).

---

# TELA 22 — Usuário — Criar / Editar

## 1. Objetivo

Criar ou editar usuário e preferências de interface.

## 2. Perfil

- Admin (e usuário a editar próprio perfil limitado — Assunção).

## 3. Layout

Secções: Dados pessoais; Função e acesso; Preferências de interface.

## 4. Campos

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| nome, sobrenome | Sim | — |
| email | Sim | único; não editável após criar (Assunção) |
| telefone, cargo | Não | — |
| equipe | Não | — |
| perfil de acesso | Sim | seleção |
| status | Sim | activo/inactivo |
| tema preferido | Não | claro / escuro / sistema |
| menu retraído por padrão | Não | booleano |

**Criar:** senha inicial ou convite por e-mail (Assunção: fluxo de convite).

## 5–14.

- Utilizador não pode elevar privilégios acima do permitido; validação de perfil.

---

# TELA 23 — Configurações — Pipelines e Etapas

## 1. Objetivo

Configurar pipelines de vendas e etapas com ordem e regras de movimento.

## 2. Perfil

- Admin; Gestor se autorizado.

## 3. Layout

- Breadcrumbs `Configurações > Pipelines e etapas`.
- Lista de pipelines; ao seleccionar: editor de etapas (lista ordenável com drag and drop).
- Por etapa: nome; ordem; probabilidade sugerida; tipo (aberta, ganho, perdida); requisitos de campos ao entrar ou sair.

## 4. Campos

Nome do pipeline; descrição; moeda; etapas com nome, cor, ordem, flags.

## 5. Acções

Criar pipeline; duplicar; arquivar; reordenar etapas; adicionar etapa; editar etapa; eliminar etapa sem oportunidades ou com migração.

## 6. Filtros

Lista de pipelines: busca por nome.

## 7. Validações

- Pelo menos uma etapa tipo aberta; exactamente uma etapa ganha e uma perdida por pipeline (Assunção: modelo de negócio).

## 8. Regras de negócio

- **RB-CF-P01:** Eliminar etapa com oportunidades exige seleccionar etapa destino.

## 9–14.

- Impacto em Kanban e listagens; QA de reordenação.

---

# TELA 24 — Configurações — Motivos de Perda

## 1. Objetivo

Cadastrar motivos de perda para análise e obrigatoriedade ao fechar perdido.

## 2. Perfil

- Admin.

## 3. Layout

- Tabela simples: nome; ordem; activo; pipelines aplicáveis.
- Modal criar/editar.

## 4. Campos

Nome (obrigatório); descrição; pipelines onde aparece; ordem.

## 5. Acções

CRUD; desactivar sem apagar histórico.

## 6. Filtros

Busca; activo/inactivo; pipeline.

## 7–14.

- Motivos inactivos não aparecem em novos fechos; histórico mantém referência.

---

# TELA 25 — Configurações — Tags

## 1. Objetivo

Gerir tags reutilizáveis por entidades.

## 2. Perfil

- Admin.

## 3. Layout

- Lista ou nuvem com cor; criar tag; editar; fundir tags; arquivar.

## 4. Campos

Nome; cor; entidades aplicáveis (lead, empresa, contato, oportunidade, tarefa, atividade).

## 5. Acções

CRUD; fundir duplicados.

## 6. Filtros

Entidade; texto; cor.

## 7–14.

- Nome único por âmbito (Assunção: global por organização).

---

# TELA 26 — Configurações — Campos customizados

## 1. Objetivo

Definir campos adicionais por entidade com tipo e regras de filtro.

## 2. Perfil

- Admin.

## 3. Layout

- Selector de entidade; lista de campos customizados; «Novo campo».
- Formulário: nome interno; label; tipo (texto, número, decimal, data, booleano, seleção, multi-seleção, usuário, moeda, URL); obrigatório; visível em listagem; **filtrável**; opções para seleções.

## 4. Campos

Conforme formulário de definição.

## 5. Acções

Criar; editar; desactivar; reordenar.

## 6. Filtros

Lista de campos por entidade.

## 7. Validações

- Nome interno único por entidade; não alterar tipo com dados existentes sem migração (Assunção: bloqueio ou aviso).

## 8. Regras de negócio

- **RB-CF-CU-01:** Se filtrável, tipo deve ser suportado pelo motor de filtros avançados.

## 9–14.

- Campos desactivados não aparecem em novos formulários; dados históricos preservados.

---

# TELA 27 — Configurações — Perfis e Permissões

## 1. Objetivo

Definir perfis de acesso e permissões por módulo e acção.

## 2. Perfil

- Admin.

## 3. Layout

- Lista de perfis; ao editar: matriz ou lista agrupada por módulo (Leads, Empresas, Contatos, Oportunidades, Tarefas, Atividades, Relatórios, Usuários, Configurações) com permissões: nenhuma, ver, criar, editar, eliminar, exportar, mover pipeline, administrar.

## 4. Campos

Nome do perfil; descrição; permissões granulares.

## 5. Acções

Criar perfil; duplicar; eliminar se sem usuários; atribuir usuários.

## 6. Filtros

Busca por nome de perfil.

## 7. Validações

- Não remover último Admin; não eliminar perfil em uso sem migração.

## 8. Regras de negócio

- **RB-CF-PR-01:** Permissões aplicam-se em API e UI; negação por padrão.

## 9–14.

- Testes de cada perfil com usuário de teste; tema claro/escuro na matriz (legibilidade).

---

_Documento gerado para o projecto `crm-comercial`. Todas as telas 1 a 27 incluem as secções 1 a 14; telas de configuração finalizam secções 7–14 de forma compacta onde o padrão é idêntico ao restante sistema._
