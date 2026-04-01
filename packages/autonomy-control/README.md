# @aios-celx/autonomy-control

Governança de automação (Bloco 6.3): política em `.aios/config.yaml` → `autonomy`, decisões auditáveis e integração com o **scheduler**.

## Configuração (`autonomy`)

| Campo | Efeito |
|--------|--------|
| `enabled` | Se `false`, o scheduler não processa fila (para com `autonomy_disabled`). |
| `autoRunTask` / `autoRunQA` / `autoRunStory` | Tipos de item da fila que podem correr automaticamente. |
| `allowLoopExecution` | Se `false`, `scheduler:run --mode loop` para logo (`autonomy_loop_forbidden`). |
| `maxAutoSteps` | Máximo de itens processados **por execução** do scheduler (além dos limites CLI). |
| `haltOnBlockedTask` | Se `true`, para se existir task `blocked` em `backlog/tasks.yaml`. |
| `haltOnApprovalRequired` | Se `true`, para quando `state.requiresHumanApproval`. |
| `haltOnArchitectureDecision` | Para se o item tiver `metadata.architectureDecision: true`. |
| `haltOnScopeChange` | Idem com `metadata.scopeChange: true`. |
| `haltOnFailure` | Após uma execução falhada no mesmo run, o passo seguinte é recusado. |
| `requireApprovalFor` | Lista (`architecture`, `scope-change`, …): para se `metadata.approvalCategory` coincidir. |

Valores por omissão: ver `DEFAULT_AUTONOMY_POLICY` em `@aios-celx/shared`.

## API

- `evaluateAutonomyForSchedulerStep(projectsRoot, projectId, input)` — decisão antes de `claim`.
- `setAutonomyEnabled(...)` — usado pelo CLI `autonomy:toggle`.
- Logs: `projects/<id>/.aios/logs/autonomy.log`.

## Relação scheduler ↔ fila

O scheduler faz `peek` → **autonomia** → `claim` → `executeQueueItem`. A fila continua isolada por projeto; a política só restringe **se** e **quando** avançar.
