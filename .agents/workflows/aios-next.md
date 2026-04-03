---
description: Workflow aios — ver passo activo, gate e próxima acção (aios next)
---

O utilizador quer ver ou sincronizar o **workflow aios** no projeto gerido.

1. Obtém o **`projectId`** (pasta `projects/<id>/` na raiz do monorepo). Se não estiver no contexto, pergunta.
// turbo
2. Na **raiz do monorepo** executa: `pnpm exec aios next --project <projectId>` (ou com `--sync` se o utilizador pedir para sincronizar).
3. Resume o estado actual e o que falta para avançar (gates).
