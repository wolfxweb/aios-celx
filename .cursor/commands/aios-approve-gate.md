---
description: Aprovar um gate do workflow (aios approve --gate)
---

O utilizador quer **aprovar um gate** depois de os artefactos cumprirem as verificações.

1. Confirma **`projectId`**.
2. O **gate** deve ser o do passo activo: verifica com `pnpm exec aios next --project <projectId>` qual é `activeStep.gate` (ou o erro de mismatch se o utilizador passou outro id).
3. Só depois de o utilizador confirmar que os ficheiro(s) estão corretos, executa:  
   `pnpm exec aios approve --project <projectId> --gate <gateId>`
4. Se o comando falhar, mostra o JSON de `evaluateGate` e lista o que falta (paths relativos ao projeto gerido).
