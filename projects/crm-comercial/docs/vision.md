# Visão de produto — crm-comercial

## Problema

Equipes comerciais e de gestão perdem tempo e oportunidades quando informações sobre leads, contatos, empresas e negócios estão dispersas em planilhas, e-mails e ferramentas desconectadas. Falta uma visão única do pipeline, de tarefas e de atividades, o que dificulta priorização, follow-up e reporting confiável para a liderança.

## Usuários-alvo

| Segmento | Necessidade principal |
|------------|------------------------|
| **Visitantes (marketing)** | Conhecer o produto na **Home** pública (página de vendas), avaliar proposta de valor e aceder a «Entrar» ou pedido de demonstração antes de se autenticar. |
| **Vendedores** | Cadastrar e qualificar leads, gerir oportunidades, registrar atividades e cumprir tarefas no dia a dia. |
| **Atendimento / SDR** | Organizar entradas, qualificar e encaminhar registros mantendo histórico. |
| **Gestores** | Acompanhar pipeline, equipe e indicadores com filtros e relatórios. |
| **Administradores** | Configurar pipelines, permissões, tags, campos customizados e políticas de uso. |

Situações em que o produto é a escolha natural: início do dia (tarefas e oportunidades a vencer), após reuniões (registro de atividade), fechamento de período (relatórios), e configuração de processo comercial (pipelines e etapas).

## Resultados esperados

- **Operacionais:** redução de leads e oportunidades sem próxima ação definida; aumento de registros de atividade por oportunidade.
- **Gestão:** visibilidade do valor em pipeline e da previsão de fechamento por período e equipe.
- **Qualidade de dados:** cadastros centralizados com vínculos explícitos (empresa, contato, oportunidade) e histórico auditável.
- **Adoção:** uso diário da aplicação web como fonte de verdade do funil (medido por login, registros criados e atualizados).

Métricas finas (percentuais, metas numéricas) devem ser acordadas com o negócio após o MVP.

## Fora de escopo nas primeiras iterações (non-goals)

- Integrações nativas obrigatórias com ERP, telefonia, WhatsApp Business ou SSO corporativo (podem entrar no roadmap).
- Aplicativo móvel nativo (o MVP é **web responsivo**).
- Motor de automação de marketing completo (e-mail em massa, jornadas complexas).
- Faturação, emissão de NF ou pós-venda operacional.
- Multi-tenant avançado com white-label por cliente final (avaliar apenas se o modelo de negócio exigir).

## Princípios de experiência

- **Home pública** (`/`): página de **vendas do produto** (marketing), sem shell do CRM; convida a login ou contacto comercial.
- Interface em **pt-BR**; **tema claro e escuro** com preferência por usuário (incluindo área pública, quando aplicável).
- **Menu lateral retrátil** e **topbar** com busca e atalhos para reduzir cliques em fluxos frequentes.
- **Listagens** com filtros rápidos e avançados; **Kanban** onde o processo for visual (leads por qualificação, oportunidades por pipeline).
- **Campos customizados** configuráveis e, quando marcados como filtráveis, disponíveis nos filtros avançados.

## Stack técnica (referência)

Cliente **Vue 3 + Vuetify 3**; API **FastAPI** com **JWT**; persistência **SQLite**; detalhes em [`architecture.md`](./architecture.md).

## Documentos relacionados

- Requisitos detalhados: [`prd.md`](./prd.md).
- Especificação tela a tela: [`especificacao-funcional-crm-telas.md`](./especificacao-funcional-crm-telas.md).

_Atualizado: alinhado ao pacote de documentação do projeto `crm-comercial`._
