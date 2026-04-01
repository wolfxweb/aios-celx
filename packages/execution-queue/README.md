# @aios-celx/execution-queue

Fila de execução **por projeto** (Bloco 6.1): persistência simples em JSON, elegibilidade básica e logs de auditoria. Base para o scheduler (6.2).

## Conceito

- Cada projeto tem o seu próprio ficheiro `projects/<projectId>/.aios/queue.json` — **nunca** misturar filas entre `projectId`.
- Itens passam por estados (`pending` → `ready` → `running` → `done` / `failed` / …).
- `reconcilePendingToReady` promove itens cujas dependências estão `done` e, se `requiresApproval`, cujo `metadata.approved` (ou `approvalGranted`) é verdadeiro — use `grantQueueItemApproval` para aprovar.

## Tipos de item (`QueueItemType`)

| Tipo | Uso típico |
|------|------------|
| `run-task` | Payload: `{ taskId }` — engineer mock |
| `run-qa` | Payload: `{ taskId }` |
| `run-story` | Payload: `{ storyId, withQa? }` |
| `update-story-status` | Reservado / futuro |
| `update-project-state` | Reservado / futuro |
| `generate-delivery-summary` | Reservado / futuro |
| `request-approval` | Reservado / futuro |

O CLI `queue:run-next` executa apenas `run-task`, `run-qa` e `run-story`.

## Elegibilidade

- Projeto com `state.blocked === true` → nenhum item é reclamado.
- Projeto com `state.requiresHumanApproval === true` → idem (automação pausa).
- Dependências (`dependsOn`) têm de referenciar itens existentes no enqueue e estar todas `done` antes de `pending` → `ready`.
- Prioridade numérica maior corre antes (empate por `createdAt`).

## Logs

JSONL em `projects/<projectId>/.aios/logs/queue.log` (ex.: `queue.enqueue`, `queue.claim`, `queue.done`, `queue.failed`).

## API principal

- `loadProjectQueue` / `saveProjectQueue`
- `enqueue`, `peekNextEligibleItem`, `claimNextQueueItem` (`dequeueNextReady`)
- `listQueueItems`, `listQueueItemsByStatus`
- `markQueueItemDone` / `Failed` / `Blocked` / `Running`
- `grantQueueItemApproval`

Ver exports em `src/index.ts`.
