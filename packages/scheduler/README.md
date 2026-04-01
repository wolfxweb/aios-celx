# @aios-celx/scheduler

Scheduler **local** (Bloco 6.2): processa a fila (`@aios-celx/execution-queue`) de um projeto em modo explícito, sem daemon.

## Relação com a fila

- Usa `claimNextQueueItem` ou `claimQueueItemsByIds` (vagas paralelas), `markQueueItemDone` / `markQueueItemFailed` e `peekNextEligibleItem`.
- Respeita as mesmas regras de elegibilidade que `queue:run-next` (projeto não bloqueado, sem `requiresHumanApproval`, dependências, aprovações).
- Execução dos itens delegada a `executeQueueItem` em `@aios-celx/agent-runtime` (sem duplicar engineer/QA/story).

## Modos

| Modo | Comportamento |
|------|----------------|
| `once` | Uma **vaga**: até um item (omissão) ou até dois em paralelo com `--max-concurrent 2` se o plano aprovar independência. |
| `loop` | Vários itens até cumprir **pelo menos um** limite: `maxSteps` e/ou `maxDurationMs`. Nunca loop infinito sem limite. |

## Paralelismo básico (Bloco 6.6)

- **Ativar:** `maxConcurrent` **2** (`--max-concurrent 2` na CLI ou campo no JSON do `POST` da API). Omissão **1** = sequencial.
- **Política:** dois itens `ready` só correm em paralelo com `storyId` distinto (`payload` ou `metadata`), `metadata.touchPaths` declarado nos dois sem interseção, e sem `dependsOn` cruzado. Caso contrário o plano fica **sequencial** e os motivos aparecem em `plan.conflicts` no log `scheduler.parallel_plan`.
- **Autonomia:** avaliada por item; se o segundo for recusado, a vaga reduz-se a um item (`scheduler.parallel_autonomy_shrink`).
- **Limite:** no máximo **2** por vaga; execução só local.

Exportado: `buildParallelExecutionPlan`, `describePairConflict`, `extractStoryKeyForParallelism`. Teste rápido: `pnpm --filter @aios-celx/scheduler run selftest`.

## Resultado (`SchedulerResult`)

Inclui `executedOk`, `executedFailed`, `stopReason`, `summaries`, `nextPeek`, `lastParallelPlan` (opcional) e timestamps.

## Logs

JSONL em `projects/<projectId>/.aios/logs/scheduler.log` (`scheduler.start`, `scheduler.parallel_plan`, `scheduler.parallel_batch`, `scheduler.parallel_autonomy_shrink`, `scheduler.step`, `scheduler.stop`).

## CLI

```bash
pnpm exec aios scheduler:run --project my-proj
pnpm exec aios scheduler:run --project my-proj --mode loop --max-steps 5
pnpm exec aios scheduler:run --project my-proj --mode loop --max-duration-ms 60000 --max-steps 100
pnpm exec aios scheduler:run --project my-proj --max-concurrent 2 --mode loop --max-steps 10
```
