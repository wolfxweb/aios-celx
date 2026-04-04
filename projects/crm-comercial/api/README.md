# CRM AIOS-CELX — API (FastAPI)

API REST do produto **CRM AIOS-CELX** (`projectId` **`crm-comercial`**): SQLite, SQLAlchemy, JWT (Bearer), CORS para o front Vite.

## Requisitos

- Python 3.11+ (recomendado 3.12+)
- `pip` ou ambiente virtual (`python3 -m venv .venv`)

## Configuração

1. `cd` para esta pasta (`api/`).
2. Criar venv (se aplicável) e instalar dependências:

   ```bash
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. Copiar `.env.example` para `.env` e definir `JWT_SECRET` com pelo menos 32 caracteres em produção.

4. A base SQLite é criada em `data/crm.db` no primeiro arranque (pasta `data/` criada automaticamente).

## Utilizador de desenvolvimento

Na primeira execução com base vazia é criado:

- **E-mail:** `admin@example.com`
- **Senha:** `admin123`

Altere ou remova em produção.

## Executar

```bash
export PYTHONPATH=.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Documentação interativa: `http://127.0.0.1:8000/docs`
- Health: `GET /health`
- Prefixo API: `/api/v1` (ex.: `POST /api/v1/auth/login`, `GET /api/v1/me`)

### CRM (autenticado)

- **Leads:** `GET/POST /leads`, `GET/PATCH/DELETE /leads/{id}`, `PATCH /leads/{id}/stage`, `POST /leads/{id}/convert` (etapas: `novo`, `contato`, `qualificado`, `perdido`)
- **Pipelines:** `GET/POST /pipelines`, `GET/PATCH /pipelines/{id}`, `POST /pipelines/{id}/stages`
- **Etapas:** `PATCH/DELETE /stages/{id}`
- **Empresas:** `GET/POST /companies`, `GET/PATCH/DELETE /companies/{id}` (paginação `page`, `pageSize`)
- **Contatos:** `GET/POST /contacts`, `GET/PATCH/DELETE /contacts/{id}`
- **Oportunidades:** `GET/POST /opportunities`, `GET/PATCH/DELETE /opportunities/{id}`, `PATCH /opportunities/{id}/stage`, `POST .../mark-won`, `POST .../mark-lost`
- **Motivos de perda:** `GET/POST /loss-reasons`, `PATCH /loss-reasons/{id}`
- **Tags:** `GET/POST /tags`, `GET/PATCH /tags/{id}`, `DELETE /tags/{id}` (arquivar), `POST /tags/{tag_id}/link`, `DELETE /tags/{tag_id}/link?entity_type=&entity_id=`
- **Busca:** `GET /search?q=...&types=lead,company,contact,opportunity` (lista unificada de hits)
- **Perfil:** `GET/PATCH /me` (nome, telefone, tema, menu lateral)
- **Tarefas:** `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/{id}`, `POST /tasks/{id}/complete` (vínculo opcional a `company` / `contact` / `opportunity` / `lead`)
- **Atividades:** `GET/POST /activities`, `GET/PATCH/DELETE /activities/{id}` (tipos: `call`, `meeting`, `email`, `note`, `other`)
- **Dashboard:** `GET /dashboard/summary?days=30` — contagens para o utilizador atual (leads abertos, oportunidades em etapa aberta, tarefas pendentes, atividades no período, empresas, contatos)
- **Público (sem JWT):** `POST /public/contact` — formulário de contacto (`consent` obrigatório); resposta `201` + `{ "ok": true }`
- **Relatórios (autenticado):** `GET /reports` (catálogo), `POST /reports/{reportId}/run` (corpo opcional: `date_from`, `date_to`, `pipeline_id`)
- **Utilizadores (só admin da instância):** `GET/POST /users`, `GET/PATCH/DELETE /users/{id}` — perfil «super admin» neste MVP = `is_admin=true` na tabela `users`; o seed cria `admin@example.com` com `is_admin=true` (ver também `web/README.md`, secção SaaS e administrador).

Na primeira execução é criado o pipeline **Vendas padrão** com etapas (incl. ganho/perdido) e motivos de perda de exemplo.

## Testes

```bash
export PYTHONPATH=.
pytest
```

Os testes usam SQLite em memória (`tests/conftest.py`) e não escrevem em `data/`.

## Notas

- `requirements.txt` fixa `bcrypt<4.1` por compatibilidade com `passlib` 1.7.x.
- SQLite em memória nos testes usa `StaticPool` para todas as conexões partilharem o mesmo esquema.
- **Base antiga (`data/crm.db`):** `create_all` cria tabelas novas mas não altera colunas em tabelas existentes. Se faltar esquema, apague `data/crm.db` para recriar no arranque ou execute `ALTER` manualmente, por exemplo:
  - `phone` em `users`: `sqlite3 data/crm.db "ALTER TABLE users ADD COLUMN phone VARCHAR(64);"`
  - `is_admin` em `users`: `sqlite3 data/crm.db "ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0;"`
  - Tabela `contact_submissions`: se não existir após atualizar o código, apagar o ficheiro da BD ou criar a tabela alinhada ao modelo em `app/models/contact_submission.py`.
