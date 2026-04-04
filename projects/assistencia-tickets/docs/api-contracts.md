# API contracts — assistencia-tickets

## Conventions (draft)

- **Base URL:** configurável por ambiente (ex.: `https://api.example.com`)
- **Versioning:** prefixo de versão (ex.: `/v1`)
- **Errors:** corpo consistente, ex.: `{ "error": { "code": "string", "message": "string" } }`
- **Auth:** Bearer / session (definir quando o PRD fechar)

## Endpoints (illustrative)

### Health

- `GET /v1/health` → `{ "ok": true }`

### Resources (substituir por domínio real)

- `GET /v1/resources` — listagem
- `POST /v1/resources` — criação

### Integration hooks (optional)

- Webhooks ou message bus — preencher com base no discovery.

_Stories (excerpt)_

```
stories:
  - id: STORY-1
    epicId: EPIC-1
    title: Publicar PRD e backlog inicial
    acceptance:
      - PRD contém resumo, objetivos e requisitos traçáveis ao discovery
      - Ficheiros backlog (epics, stories, tasks) existem e validam contra o
        schema
    status: draft


```

_Mock — **software-architect** — 2026-04-01T23:14:45.431Z_
