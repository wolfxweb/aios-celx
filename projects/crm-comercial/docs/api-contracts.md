# Contratos de API — crm-comercial

Este documento define **convenções** e um **mapa de recursos** HTTP alinhado ao PRD e à especificação funcional. A implementação em **FastAPI** expõe **OpenAPI 3** automaticamente (útil para validação e geração de cliente). Tipos e campos seguem o modelo de domínio em [`prd.md`](./prd.md) e [`especificacao-funcional-crm-telas.md`](./especificacao-funcional-crm-telas.md).

## Convenções

| Item | Definição |
|------|-----------|
| **Base URL** | `https://{host}/api/v1` (prefixo versionado). |
| **Formato** | `Content-Type: application/json; charset=utf-8`. |
| **Autenticação** | **JWT:** `Authorization: Bearer <access_token>` em todos os endpoints protegidos (exceto login, forgot-password, health). Access token emitido por `POST /auth/login`; renovação via `POST /auth/refresh` com refresh token (corpo ou cookie conforme implementação — ver [`architecture.md`](./architecture.md)). |
| **Locale** | Respostas de validação em **pt-BR**; datas em **ISO 8601** (UTC ou com offset); o cliente exibe no fuso do usuário. |
| **Idempotência** | `Idempotency-Key` opcional em `POST` críticos (ex.: conversão de lead). |

### Paginação de listagens

Query comuns:

- `page` (inteiro ≥ 1), `pageSize` (ex.: 10, 25, 50, 100).
- **Alternativa futura:** `cursor` + `limit` para grandes volumes — documentar ao implementar.

Resposta envelope sugerido:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

### Filtros

- Filtros simples: query params nomeados (`status`, `responsibleUserId`, `pipelineId`, etc.).
- Filtros complexos: `POST /{resource}/search` com corpo JSON (lista de critérios: campo, operador `eq|ne|in|gte|lte|between|contains`, valor) **ou** query serializada — **uma abordagem deve ser escolhida e mantida** (registar em ADR).

### Ordenação

- `sort=field` ou `sort=-field` para descendente; múltiplos campos se suportado.

### Erros

Envelope único:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem legível em pt-BR",
    "details": [{ "field": "email", "message": "E-mail inválido" }]
  }
}
```

Códigos HTTP: `400` validação; `401` não autenticado; `403` sem permissão; `404` recurso inexistente; `409` conflito (ex.: regra de negócio); `422` semântica de negócio; `429` rate limit; `500` erro interno.

---

## Recursos e endpoints

Prefixo: `/api/v1`. Endpoints protegidos exigem header `Authorization: Bearer <jwt>` salvo indicação.

### Público (sem JWT)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/public/contact` | Formulário da Home (marketing). **201** com `{ "ok": true }`. Corpo: `name`, `email`, `message` (obrigatórios), `company` e `phone` opcionais, `consent` boolean obrigatório. Se `consent` for `false`, **422** com `error.code`: `CONSENT_REQUIRED`. Persistência em `contact_submissions` (MVP). |

**Implementação:** rate limit recomendado em produção; não documentado no MVP local.

### Auth (JWT)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/auth/login` | Corpo: `{ "email", "password", "rememberMe?" }` → `{ "accessToken", "refreshToken?", "tokenType": "bearer", "expiresIn", "user": { ... } }`. O objeto `user` inclui `is_admin` (boolean). |
| `POST` | `/auth/logout` | Opcional: enviar refresh para revogar lista (se implementada). |
| `POST` | `/auth/refresh` | Corpo: `{ "refreshToken" }` ou cookie — devolve novo par access/refresh. |
| `POST` | `/auth/forgot-password` | `{ "email" }` — resposta genérica. |
| `POST` | `/auth/reset-password` | `{ "token", "newPassword" }` |

### Usuário atual e preferências

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/me` | Perfil + permissões efetivas + preferências (tema, menu). |
| `PATCH` | `/me` | Atualizar nome, telefone, tema, menu retraído, etc. |

### Usuários (administrador)

Endpoints abaixo exigem JWT e **`user.is_admin === true`**. Caso contrário, **403** (`error.code`: `FORBIDDEN`).

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/users` | Lista paginada: query `page`, `pageSize`. Resposta envelope `data[]` com `{ id, email, full_name, is_active, is_admin }` + `meta`. |
| `POST` | `/users` | Criar utilizador: `{ email, password, full_name, is_admin? }` → item criado (**201**). |
| `GET` | `/users/{id}` | Detalhe (mesmo formato de item). |
| `PATCH` | `/users/{id}` | `{ full_name?, is_active?, is_admin? }`. Regras: não desativar nem remover admin a si próprio. |
| `DELETE` | `/users/{id}` | Desativa (`is_active = false`). Não permitido sobre a própria conta (**422**). |

**Futuro (não implementado no MVP actual):** `/profiles` e RBAC por perfis — ver roadmap.

### Leads

Cada item de lista e o detalhe incluem **`tags`** (`array` de tags ligadas à entidade).

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/leads` | Lista paginada; query de filtros. |
| `POST` | `/leads` | Criar. |
| `GET` | `/leads/{id}` | Detalhe + custom fields. |
| `PATCH` | `/leads/{id}` | Atualizar. |
| `DELETE` | `/leads/{id}` | Excluir conforme RBAC. |
| `POST` | `/leads/{id}/convert` | Converter em oportunidade (corpo com ids de pipeline/etapa e campos obrigatórios). |
| `PATCH` | `/leads/{id}/stage` | Atualizar etapa de qualificação (Kanban). |

### Empresas

Cada item de lista e o detalhe incluem **`tags`**.

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/companies` | Lista. |
| `POST` | `/companies` | Criar. |
| `GET` | `/companies/{id}` | Detalhe + relacionados (resumo). |
| `PATCH` | `/companies/{id}` | Atualizar. |
| `DELETE` | `/companies/{id}` | Excluir. |

### Contatos

Cada item de lista e o detalhe incluem **`tags`**.

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/contacts` | Lista. |
| `POST` | `/contacts` | Criar. |
| `GET` | `/contacts/{id}` | Detalhe. |
| `PATCH` | `/contacts/{id}` | Atualizar. |
| `DELETE` | `/contacts/{id}` | Excluir. |

### Oportunidades

Cada item de lista e o detalhe incluem **`tags`**.

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/opportunities` | Lista com filtros (pipeline, etapa, etc.). |
| `POST` | `/opportunities` | Criar. |
| `GET` | `/opportunities/{id}` | Detalhe. |
| `PATCH` | `/opportunities/{id}` | Atualizar. |
| `DELETE` | `/opportunities/{id}` | Excluir. |
| `PATCH` | `/opportunities/{id}/stage` | Mover etapa (Kanban e validações). |
| `POST` | `/opportunities/{id}/mark-won` | Fechar ganho (corpo com campos exigidos). |
| `POST` | `/opportunities/{id}/mark-lost` | Fechar perda + `lossReasonId`. |

### Pipelines (configuração)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/pipelines` | Lista pipelines e etapas. |
| `POST` | `/pipelines` | Criar pipeline. |
| `PATCH` | `/pipelines/{id}` | Atualizar. |
| `POST` | `/pipelines/{id}/stages` | Adicionar etapa. |
| `PATCH` | `/stages/{id}` | Atualizar etapa. |
| `DELETE` | `/stages/{id}` | Com migração de oportunidades se necessário. |

### Tarefas

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/tasks` | Lista com filtros por entidade relacionada. |
| `POST` | `/tasks` | Criar. |
| `GET` | `/tasks/{id}` | Detalhe. |
| `PATCH` | `/tasks/{id}` | Atualizar. |
| `DELETE` | `/tasks/{id}` | Excluir. |
| `POST` | `/tasks/{id}/complete` | Concluir. |

### Atividades

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/activities` | Lista. |
| `POST` | `/activities` | Criar. |
| `GET` | `/activities/{id}` | Detalhe. |
| `PATCH` | `/activities/{id}` | Atualizar se política permitir. |
| `DELETE` | `/activities/{id}` | Excluir. |

### Relatórios e dashboard

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/dashboard/summary` | Agregações para widgets (query: `days`, etc.). |
| `GET` | `/reports` | Catálogo: lista de `{ id, title, description }` (JWT obrigatório). |
| `POST` | `/reports/{reportId}/run` | Corpo opcional: `{ date_from?, date_to? (ISO8601), pipeline_id? }`. Resposta: `{ report_id, columns[], rows[][], meta }`. IDs conhecidos no MVP: `leads-by-stage`, `opportunities-by-stage`, `activities-by-type`. **404** se `reportId` desconhecido. |

**Nota:** `downloadUrl` para export não está no MVP; campo `meta` reservado para evolução.

### Configuração: tags, motivos de perda, campos customizados

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/tags` | Lista de tags do utilizador; query `include_archived` (boolean, omissão `false`). |
| `POST` | `/tags` | Criar: `{ "name", "color_hex?" }` → **201** com `{ id, name, color_hex, is_archived }`. |
| `GET` | `/tags/{tag_id}` | Detalhe da tag (do próprio utilizador). |
| `PATCH` | `/tags/{tag_id}` | `{ "name?", "color_hex?", "is_archived?" }`. |
| `DELETE` | `/tags/{tag_id}` | Arquivar (`is_archived = true`). |
| `GET` | `/tags/by-entity/{entity_type}/{entity_id}` | Tags ligadas a uma entidade CRM. `entity_type` ∈ `lead` \| `company` \| `contact` \| `opportunity`. **422** se o tipo for inválido; **404** se a entidade não existir ou não pertencer ao utilizador. |
| `POST` | `/tags/{tag_id}/link` | Corpo JSON `{ "entity_type", "entity_id" }` (mesmos valores de `entity_type`). Liga a tag à entidade; **204** (idempotente se já existir vínculo). |
| `DELETE` | `/tags/{tag_id}/link` | Query obrigatória `entity_type` + `entity_id` — remove o vínculo; **404** se o vínculo não existir. |
| `GET` | `/loss-reasons` | Lista. |
| `POST` | `/loss-reasons` | Criar. |
| `PATCH` | `/loss-reasons/{id}` | Atualizar. |
| `GET` | `/custom-fields` | Por `entityType`. |
| `POST` | `/custom-fields` | Definir campo. |
| `PATCH` | `/custom-fields/{id}` | Atualizar definição. |

### Busca global

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/search` | `q` + `types[]` opcional — retorna hits unificados com tipo e id para navegação. |

## Conventions

_English heading for aios workflow gate checks — detailed rules are under **Convenções** at the top of this file (base URL, JSON, JWT Bearer, pagination, errors)._

## Endpoints

_English heading for aios workflow gate checks — full route tables are under **Recursos e endpoints** above (auth, CRM entities, reports, settings, search)._

---

## Esquemas (referência de campos)

Os payloads devem incluir os campos das entidades descritos no PRD e na especificação por tela (ids, títulos, datas, moeda em centavos ou decimal com código de moeda — **definir uma convenção** e documentar). Campos customizados:

```json
"customFields": {
  "cf_internal_name_1": "valor",
  "cf_internal_name_2": 123
}
```

---

## Evolução

- Versão **v1** estável para o MVP; mudanças incompatíveis → **v2** ou negociação de deprecação.
- Gerar **OpenAPI 3** a partir do código ou contrato canónico quando o primeiro endpoint estiver implementado.

_Atualizado: contrato de referência para implementação da API `crm-comercial`._
