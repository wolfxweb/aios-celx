# CRM AIOS-CELX — Web (Vue 3 + Vuetify)

Interface do produto **CRM AIOS-CELX** no monorepo (`projectId` **`crm-comercial`**): Vite, Vue 3, Vuetify 4, Pinia, Vue Router. Locale da UI: `pt-BR` (Vuetify `pt`).

## Requisitos

- Node.js 20+ (recomendado)
- npm (ou pnpm/yarn)

## Instalação

```bash
cd web
npm install
```

## Navegação autenticada

Com sessão iniciada: **gaveta lateral** com ligações a painel, leads, oportunidades, tarefas, atividades, empresas, contatos, relatórios e, **se o utilizador for administrador** (`is_admin`), **Administração** (gestão de utilizadores). Em ecrãs estreitos a gaveta é temporária e abre com o ícone de menu na barra; em ecrã mais largo pode ficar fixa ou em modo **rail** (recolhido — ícone de menu na barra). Os cartões de métricas no painel (`/app`) são clicáveis e levam à listagem correspondente.

## Desenvolvimento

1. Arranque a API (outro terminal), por exemplo em `../api`:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Inicie o Vite:

   ```bash
   npm run dev
   ```

O `vite.config.ts` faz **proxy** de `/api` para `http://127.0.0.1:8000`, por isso pode deixar `VITE_API_BASE_URL` vazio e usar URLs relativas (`/api/v1/...`).

**Tema:** por defeito **claro**. Com sessão, altera-se no **menu lateral** (secção «Aparência») ou no **Perfil**; sincroniza com `PATCH /api/v1/me`. Na **Home** sem sessão, o ícone de tema na barra continua disponível; `localStorage` (`crm_theme_preference`) mantém a escolha.

**Busca global:** com sessão, `GET /api/v1/search?q=…` em debounce. Em ecrãs `md+`, campo na barra; em ecrãs mais estreitos, ícone de lupa abre ecrã inteiro com o mesmo fluxo. Ao escolher um resultado, navega para a listagem com `?highlight=<id>` (destaque se o registo estiver na primeira página).

## Conta de demonstração

Alinhada com o seed da API: `admin@example.com` / `admin123`.

## SaaS e painel de administrador

O produto segue uma visão **SaaS** (vários utilizadores na mesma instância, acesso por subscrição/login). No **MVP**, cada instalação tem uma **base SQLite**; os dados CRM (leads, oportunidades, etc.) ficam **isolados por utilizador** (`owner_user_id`). Multi-**organização** / multi-**tenant** na mesma base (várias empresas cliente no mesmo servidor) é evolução futura, não modelada neste MVP.

**Administrador da instância** (na API: `is_admin` no utilizador; no front: `user.is_admin`) é quem pode gerir **contas de utilizador** desta instalação (listar, criar, alterar perfil admin). É o papel mais próximo de «super admin» neste desenho: não existe um segundo nível separado (`is_super_admin`); basta a flag **admin**.

**Como aceder ao painel de administração**

1. Fazer **login** com uma conta que tenha `is_admin: true` (no ambiente de demo: **`admin@example.com`** / **`admin123`**).
2. No menu lateral, abrir **«Administração»** (ou, na barra superior em ecrã largo, o atalho equivalente, se visível).
3. Ou ir diretamente a **`/app/users`** (ex.: `http://localhost:5173/app/users` em desenvolvimento).

Quem **não** é admin **não** vê o item no menu; ao aceder manualmente a `/app/users`, o router **redireciona para `/app`**.

A API expõe estas rotas só para admin: `GET/POST /api/v1/users`, `GET/PATCH/DELETE /api/v1/users/{id}` (ver `api/README.md`).

## Rotas

- `/` — página inicial (CTA para entrar + formulário de contacto público `POST /api/v1/public/contact`)
- `/login` — formulário de login (redireciona para `redirect` na query ou `/app`)
- `/app` — painel autenticado (requer JWT)
- `/app/leads` — listagem de leads (`GET /api/v1/leads`)
- `/app/opportunities` — listagem de oportunidades (`GET /api/v1/opportunities`)
- `/app/tasks` — listagem de tarefas (`GET /api/v1/tasks`)
- `/app/activities` — listagem de atividades (`GET /api/v1/activities`)
- `/app/companies` — listagem de empresas (`GET /api/v1/companies`)
- `/app/contacts` — listagem de contatos (`GET /api/v1/contacts`)
- `/app/tags` — gestão de tags (`GET/POST/PATCH /api/v1/tags`). Nas listagens de **Leads**, **Empresas**, **Contatos** e **Oportunidades**, o ícone na coluna «Tags» abre o diálogo para associar/remover tags (`GET /api/v1/tags/by-entity/{tipo}/{id}`, `POST/DELETE …/tags/{tagId}/link`).
- `/app/reports` — catálogo e execução de relatórios (`GET/POST /api/v1/reports/...`); resultado exportável em CSV
- `/app/users` — **painel de administração**: listagem/gestão de utilizadores; **só para `user.is_admin`** (caso contrário redireciona para `/app`)
- `/app/profile` — editar nome, telefone e preferência de menu lateral (`PATCH /api/v1/me`)

## Build

```bash
npm run build
npm run preview
```

Para produção com API noutro domínio, defina `VITE_API_BASE_URL` (ver `.env.example`) e garanta CORS na API.
