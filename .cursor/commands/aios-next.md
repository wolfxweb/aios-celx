---
description: Workflow aios — ver passo activo, gate e próxima acção (aios next)
---

O utilizador quer ver ou sincronizar o **workflow aios** no projeto gerido.

1. Obtém o **`projectId`** (pasta `projects/<id>/` na raiz do monorepo). Se não estiver no contexto, pergunta.
2. Na **raiz do monorepo** (onde está `pnpm-workspace.yaml`), executa no terminal:
   - `pnpm exec aios next --project <projectId>`
   - Se fizer sentido alinhar `state.json` ao passo activo do YAML: acrescenta `--sync`.
3. Explica em português o JSON: `workflowId`, passo activo, `gateEvaluationPreview`, `recommendedAction`, e se o `engine` esperado é `mock-engine` ou outro.
4. Se o gate falhar, indica **concretamente** que artefactos corrigir ou que comando correr a seguir (`run --agent`, `approve`, `run:task`, etc.), sem inventar ficheiros.
