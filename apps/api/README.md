# @aios-celx/api

API HTTP local (Bloco 6.4) — Fastify, JSON, pensada como backend de dashboard/admin.

## Subir

Na raiz do monorepo (com dependências já compiladas):

```bash
pnpm build
pnpm --filter @aios-celx/api start
```

Ou:

```bash
node apps/api/dist/server.js
```

Desenvolvimento (recompilar TS em watch noutro terminal):

```bash
pnpm --filter @aios-celx/api dev
node apps/api/dist/server.js
```

## Variáveis de ambiente

| Variável | Descrição | Omissão |
|----------|-----------|---------|
| `AIOS_PROJECTS_ROOT` | Raiz dos projetos geridos (absoluto ou relativo ao cwd) | `<monorepo>/projects` (monorepo detetado a partir do processo, p.ex. ao correr `pnpm --filter @aios-celx/api start` dentro de `apps/api`) |
| `AIOS_MONOREPO_ROOT` | Raiz do monorepo (portfolio, registry) | detetado via `@aios-celx/memory-system` |
| `AIOS_API_HOST` | Bind | `127.0.0.1` |
| `AIOS_API_PORT` | Porta | `3030` |

O servidor regista **`@fastify/cors`** com `origin: true` para permitir pedidos do dashboard Vite em desenvolvimento (origens cruzadas). Para produção, restrinja `origin` conforme o ambiente.

## Endpoints

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/health` | Estado do serviço e caminhos configurados |
| GET | `/projects` | Lista de `projectId` em disco |
| GET | `/projects/:projectId` | `config` + `summary` |
| GET | `/projects/:projectId/state` | `state.json` |
| GET | `/projects/:projectId/queue` | Itens da fila |
| GET | `/projects/:projectId/memory` | Memória estruturada do projeto |
| GET | `/projects/:projectId/summary` | `ProjectSummary` agregado |
| GET | `/projects/:projectId/autonomy` | Política de autonomia (merged) |
| POST | `/projects/:projectId/scheduler/run` | Corpo JSON: `mode`, `maxSteps`, `maxDurationMs`, `maxConcurrent` (1–2, Bloco 6.6) |
| GET | `/portfolio` | Documento do portfolio |
| GET | `/portfolio/summary` | Resumo executivo agregado |

### Exemplos `curl`

```bash
curl -s http://127.0.0.1:3030/health | jq .
curl -s http://127.0.0.1:3030/projects | jq .
curl -s -X POST http://127.0.0.1:3030/projects/meu-projeto/scheduler/run \
  -H 'Content-Type: application/json' \
  -d '{"mode":"once"}' | jq .
```

## Relação com o dashboard (6.5)

Esta API expõe leitura agregada e ações controladas (`scheduler/run`) sem autenticação complexa; o painel pode consumir os mesmos caminhos por HTTP.
