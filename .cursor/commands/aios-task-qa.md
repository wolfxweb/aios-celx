---
description: Ciclo por task — engineer e QA (run:task / run:qa)
---

O utilizador quer **executar ou rever uma task** do backlog (implementação + QA).

1. Confirma **`projectId`** e o **`taskId`** (ex. `TASK-1`, como em `backlog/tasks.yaml`). Se o id estiver só no ficheiro, lê com ferramentas em `projects/<projectId>/backlog/tasks.yaml`.
2. **Implementação:**  
   `pnpm exec aios run:task --project <projectId> --task <taskId>`
3. **QA:** só depois de existir `projects/<projectId>/docs/execution/<slug>-implementation.md` (o CLI indica se falta):  
   `pnpm exec aios run:qa --project <projectId> --task <taskId>`
4. Resume caminhos dos relatórios (`docs/execution/`, `qa/reports/`) e o novo **status** da task; sugere `@` nos ficheiros para revisão no editor.
