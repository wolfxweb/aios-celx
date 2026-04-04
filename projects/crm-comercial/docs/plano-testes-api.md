# Plano de testes — API (FastAPI) — crm-comercial

Este documento planeja **testes automatizados do backend** alinhados a [`api-contracts.md`](./api-contracts.md), [`architecture.md`](./architecture.md) e [`prd.md`](./prd.md). Distinção importante:

| Tipo | Âmbito | Ferramentas típicas |
|------|--------|---------------------|
| **Testes unitários** | Funções puras, validadores Pydantic, geração/validação de JWT, regras de domínio **com dependências mockadas** (repositórios, e-mail). | `pytest` + `unittest.mock` / `pytest-mock` |
| **Testes de integração da API** | Rotas FastAPI + base **SQLite** real (em memória ou ficheiro temporário) + HTTP via cliente de teste. | `httpx.AsyncClient` + `pytest-asyncio` **ou** `TestClient` (Starlette) |
| **Testes E2E** (fora do âmbito deste plano) | Stack completa com front — opcional em CI posterior. | Playwright, etc. |

**Recomendação:** manter **cobertura mínima** acordada (ex.: 70% em `services/` e `repositories/`) e **todos os endpoints** com pelo menos um teste de integração feliz + casos de erro (`401`, `403`, `404`, validação `400`).

---

## Stack de testes

| Item | Escolha |
|------|---------|
| Runner | **pytest** |
| Asserções HTTP API | `httpx` **AsyncClient** (lifespan da app) ou `TestClient` síncrono |
| Async | `pytest-asyncio` (`@pytest.mark.asyncio`) se a app for async |
| Base de dados | **SQLite** em memória (`:memory:`) ou ficheiro temporário por sessão de testes; **Alembic** aplicado antes dos testes ou `create_all` em ambiente de teste |
| Factories | `factory-boy` ou fixtures que criam `User`, `Lead`, etc. |
| Cobertura | `pytest-cov`; relatório em CI |

Variáveis de ambiente de teste: `ENVIRONMENT=test`, `JWT_SECRET` fixo conhecido, `DATABASE_URL` apontando para SQLite de teste.

---

## Estrutura de pastas sugerida (no pacote da API)

```
api/
  tests/
    conftest.py          # app, client, sessão DB, usuário autenticado
    unit/
      test_jwt.py
      test_passwords.py
      test_permissions.py
    integration/
      test_auth.py
      test_me.py
      test_leads.py
      test_opportunities.py
      ...
```

---

## Fixtures globais (`conftest.py`)

| Fixture | Responsabilidade |
|---------|------------------|
| `app` | Instância FastAPI com `lifespan` e overrides de dependências (ex.: pool DB de teste). |
| `db_session` | Sessão SQLAlchemy por função ou por teste; **rollback** após cada teste para isolamento. |
| `client` | Cliente HTTP ligado à `app` (sem rede real). |
| `user_factory` | Cria usuário com hash de senha válido. |
| `auth_headers` | Dicionário `Authorization: Bearer <token>` após login ou `create_access_token` de teste. |
| `admin_user` / `seller_user` | Usuários com perfis distintos para testes `403`. |

**Override de dependência:** substituir `get_current_user` por um usuário fake em testes unitários de rotas quando o foco não for o JWT.

---

## 1. Testes unitários (sem HTTP ou com mocks)

### 1.1 Segurança e tokens

| Caso | Descrição |
|------|-----------|
| JWT-01 | Token válido decodificado contém `sub`, `exp` esperados. |
| JWT-02 | Token expirado rejeitado na validação. |
| JWT-03 | Assinatura inválida rejeitada. |
| JWT-04 | Secret/algoritmo errados falham de forma explícita. |

### 1.2 Senhas

| Caso | Descrição |
|------|-----------|
| PWD-01 | Hash e verificação (`passlib`) para senha correta/incorreta. |
| PWD-02 | Política mínima de senha (se implementada) rejeita entradas fracas. |

### 1.3 Autorização (RBAC)

| Caso | Descrição |
|------|-----------|
| RBAC-01 | Função `has_permission(user, resource, action)` retorna `True`/`False` conforme matriz de perfil. |
| RBAC-02 | Utilizador inativo não recebe permissões efectivas. |

### 1.4 Pydantic / schemas

| Caso | Descrição |
|------|-----------|
| SCH-01 | Request bodies inválidos (e-mail mal formado, campos obrigatórios em falta) falham validação antes de tocar na BD. |
| SCH-02 | Envelope de erro segue o formato de [`api-contracts.md`](./api-contracts.md) (handler global). |

### 1.5 Regras de negócio isoladas

| Caso | Descrição |
|------|-----------|
| DOM-01 | Cálculo de probabilidade ou transição de etapa (quando extraído para função pura). |
| DOM-02 | Validação «motivo de perda obrigatório ao fechar perdido» com mocks no serviço. |

---

## 2. Testes de integração por recurso (HTTP + SQLite)

Cada bloco deve incluir, no mínimo: **sucesso (2xx)**, **401 sem token**, **403 com token sem permissão** (onde aplicável), **404** para ID inexistente, **validação 400/422** para corpo inválido.

### 2.1 Público

| Endpoint | Casos |
|----------|--------|
| `POST /api/v1/public/contact` | Sucesso com payload válido; campos obrigatórios em falta; rate limit (429) se middleware existir — pode usar teste separado com muitas chamadas ou mock do limiter. |

### 2.2 Auth

| Endpoint | Casos |
|----------|--------|
| `POST /auth/login` | Credenciais válidas → `accessToken` + estrutura esperada; senha errada → 401 genérico; usuário inativo → 403 ou 401 conforme implementação documentada. |
| `POST /auth/refresh` | Refresh válido; refresh inválido/expirado. |
| `POST /auth/forgot-password` | Resposta genérica (não enumera e-mail). |
| `POST /auth/reset-password` | Token válido/inválido. |

### 2.3 Me

| Endpoint | Casos |
|----------|--------|
| `GET /me` | 200 com JWT; 401 sem token. |
| `PATCH /me` | Atualiza tema e preferências; validação de campos. |

### 2.4 Users e profiles (admin)

| Casos | CRUD; impedir que não-admin aceda (`403`); não eliminar último admin. |

### 2.5 CRM core (leads, companies, contacts, opportunities)

| Casos | Listagem com paginação (`meta`); filtros; criar/editar/obter/apagar; regras de conversão de lead; `PATCH` de etapa Kanban; soft delete se existir. |

### 2.6 Pipelines e stages

| Casos | Ordem das etapas; impedir eliminar etapa com oportunidades sem migração. |

### 2.7 Tasks e activities

| Casos | Vínculos a entidades; conclusão de tarefa. |

### 2.8 Dashboard e reports

| Casos | Parâmetros de período; resposta sem dados; exportação se existir. |

### 2.9 Settings (tags, loss reasons, custom fields)

| Casos | CRUD básico e restrições por perfil. |

### 2.10 Search global

| Casos | Query vazia; resultado com tipos mistos. |

---

## 3. Ordem sugerida de implementação (CI)

1. `conftest.py` + SQLite + cliente HTTP estável.  
2. Auth + `/me` (base para todos os outros com JWT).  
3. Um recurso CRM completo (ex.: **leads**) como modelo.  
4. Replicar padrão para restantes entidades.  
5. Testes unitários de JWT e RBAC em paralelo.

---

## 4. Critérios de qualidade

- Nenhum teste depende de ordem global nem de dados partilhados sem isolamento.  
- Senhas e tokens de exemplo **nunca** são os de produção.  
- Logs de teste não imprimem segredos.  
- Falha clara: mensagens de assert indicam endpoint e corpo esperado.

---

## 5. Integração contínua

| Passo | Comando |
|-------|---------|
| Lint | `ruff check` / `mypy` (se configurado) |
| Testes | `pytest -q --cov=api --cov-report=term-missing` |
| Limite | Falhar CI se cobertura &lt; limiar definido (ex.: 60% no primeiro sprint, subir depois). |

---

## Documentos relacionados

- [`api-contracts.md`](./api-contracts.md) — contratos a validar.  
- [`architecture.md`](./architecture.md) — FastAPI, JWT, SQLite.  
- [`prd.md`](./prd.md) — requisitos incluindo NFR de testes (secção adicionada).

_Atualizado: plano de testes unitários e de integração da API `crm-comercial`._
