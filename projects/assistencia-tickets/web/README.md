# Assistência Tickets — Laravel

**Contexto:** o foco do monorepo [aios-celx](../../../README.md) é o **framework** (Node.js + TypeScript, CLI `aios`, workflows, agentes). Esta pasta é o **exemplo runnable** — aplicação **Laravel 11** + **SQLite** + **Blade** + **Alpine.js** + **Sanctum** para gestão de chamados — projecto gerido **`assistencia-tickets`**.

---

## Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| PHP | 8.2+ |
| Composer | 2.x |
| Extensões PHP | `mbstring`, `openssl`, `pdo_sqlite`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo` (conjunto típico Laravel) |

---

## Instalação e base de dados

**Todas as ordens abaixo assumem que estás na pasta desta app** (`projects/assistencia-tickets/web/`).

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Criar ficheiro SQLite e aplicar migrações + dados de demonstração:

```bash
touch database/database.sqlite
php artisan migrate --seed
```

> **Nota:** em `.env`, `DB_CONNECTION=sqlite` e `DB_DATABASE` apontando para `database/database.sqlite` (já coerente com `.env.example` típico do Laravel para SQLite).

---

## Executar o projeto (modo desenvolvimento)

```bash
php artisan serve
```

Por omissão: **http://127.0.0.1:8000**

1. Abre **`/`** — home com resumo das funcionalidades e texto sobre o ecossistema aios-celx.
2. Clica **Entrar** ou vai a **`/login`**.
3. Usa uma das contas de demonstração (tabela abaixo). A **mesma rota de login** serve para staff e para cliente; após autenticação:
   - perfis **admin, atendente, técnico, supervisor** → **dashboard** e backoffice;
   - perfil **client** → **portal** (`/portal/tickets`).

### Contas de demonstração (`migrate --seed`)

Palavra-passe **em todas**: `password`

| Perfil | E-mail | Notas |
|--------|--------|--------|
| Administrador | `admin@example.com` | Acesso a utilizadores, configuração SLA, tudo o resto |
| Técnico | `tech@example.com` | Vê em lista/API sobretudo tickets atribuídos a si |
| Cliente (portal) | `cliente@example.com` | Só pedidos da empresa «Cliente Demo Ltda» |

Na página de login, estas credenciais aparecem **resumidas** quando `APP_ENV` não é `production`.

---

## O que está incluído (resumo)

- **Backoffice:** clientes, contactos, equipamentos, tickets, interações, horas, anexos, relatórios.
- **SLA:** `config/sla.php` — prazos por prioridade, pausas, indicadores.
- **Portal do cliente:** `/portal` — perfil `client` + `client_id`; mensagens públicas nos tickets.
- **API JSON (Sanctum):** prefixo ` /api/v1/tickets` — comportamento distinto para utilizador **client** (listagem filtrada; criação via API desactivada para cliente nesta versão).

Mais pormenores: secções **Roadmap MVP**, **Portal** e **API** mais abaixo.

---

## CLI aios (monorepo)

O workflow (agentes, backlog YAML, estado em `.aios/`) vive no **repositório pai**. A partir da **raiz do monorepo**:

```bash
pnpm exec aios status --project assistencia-tickets
pnpm exec aios next --project assistencia-tickets
```

Ver o [README da raiz](../../../README.md) para `run`, `approve`, `run:task`, etc.

---

## Testes automatizados

```bash
php artisan test
```

Os testes usam SQLite em memória conforme `phpunit.xml`.

---

## Roadmap MVP (neste código)

- **SLA:** `config/sla.php` — prazos de 1.ª resposta e resolução por prioridade; pausa em estados configuráveis; indicadores no ticket e no dashboard.
- **Horas:** apontamentos no ticket (minutos ou intervalo início/fim).
- **Anexos:** upload para `storage` (máx. 10 MB por ficheiro).
- **Encerramento:** exige solução, causa raiz, técnico atribuído e ≥ 1 minuto de horas registadas.
- **Perfis:** técnico vê só tickets atribuídos (lista e API); admin/gestão vê tudo conforme policy.
- **Utilizadores:** CRUD apenas **admin** (`/users`).
- **Relatórios:** `/reports` (filtro de datas). **SLA / Config:** `/settings` (admin, leitura dos valores de `config/sla.php`).

### Portal do cliente (`/portal`)

Perfil **client** (`client_id` em `users`). O middleware **`staff`** bloqueia o backoffice a clientes; estes usam **`/portal/tickets`**. Criação de utilizador cliente: **admin** → Utilizadores → «Cliente (portal)» + empresa.

### Fora de âmbito (próximas fases)

Abertura de ticket pelo portal, contratos com consumo de horas, agenda técnica, peças, integrações externas, IA.

---

## API JSON

Autenticação **Sanctum** (token Bearer ou sessão, conforme configuração).

- `GET /api/v1/tickets`
- `POST /api/v1/tickets`
- `GET /api/v1/tickets/{id}`

---

## Frontend opcional (Vite / Tailwind)

O layout usa CSS inline e Alpine via CDN; o `package.json` do skeleton Laravel permite `npm install && npm run dev` se quiseres compilar assets.
