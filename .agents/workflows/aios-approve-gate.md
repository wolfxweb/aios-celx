---
description: Aprovar um gate do workflow (aios approve --gate)
---

O utilizador quer **aprovar um gate** depois de os artefactos cumprirem as verificações.

1. Confirma **`projectId`** e **`gateId`**. Se o `gateId` não for informado, corre primeiramente `aios-next` para descobrir o `activeStep.gate`.
2. Confirma se os ficheiros de suporte estão correctos em `projects/<projectId>/`.
// turbo
3. Se o utilizador confirmar, executa: `pnpm exec aios approve --project <projectId> --gate <gateId>`
4. Resume se foi um sucesso ou o que falta (JSON).
