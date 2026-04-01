---
description: Estado do projeto aios — config + state (aios status)
---

O utilizador quer o **estado consolidado** do projeto gerido pelo aios.

1. Confirma o **`projectId`**. Se faltar, pergunta.
2. Na raiz do monorepo executa: `pnpm exec aios status --project <projectId>`.
3. Resume `config` e `state` (stage, currentAgent, nextGate, completedGates, currentTaskId, blocked) e o que isso implica para o próximo passo manual ou CLI.
