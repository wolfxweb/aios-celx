---
description: Ciclo por task — engineer e QA (run:task / run:qa)
---

O utilizador quer **executar ou rever uma task** do backlog (implementação + QA).

1. Confirma **`projectId`** e o **`taskId`** (ex. `TASK-1`).
// turbo
2. **Implementação:**  
   `pnpm exec aios run:task --project <projectId> --task <taskId>`
3. **QA:** Após implementação (`execution/<slug>-implementation.md` gerado):
// turbo
   `pnpm exec aios run:qa --project <projectId> --task <taskId>`
4. Resume caminhos dos relatórios (`docs/execution/`, `qa/reports/`) e o resultado final da task.
