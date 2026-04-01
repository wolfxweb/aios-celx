---
description: Executar um agente do catálogo aios via CLI (aios run --agent)
---

O utilizador quer **correr um agente** do workflow (motor resolvido em `.aios/config.yaml`, por omissão `mock-engine`).

1. **`projectId`** — confirma ou pergunta.
2. **`agentId`** — confirma qual papel. IDs válidos (catálogo): `requirements-analyst`, `product-manager`, `software-architect`, `delivery-manager`, `engineer`, `qa-reviewer`, `technical-writer`, `refactor-guardian`, `integration-specialist`, `db-designer`, `security-reviewer`, `ux-reviewer`, `sprint-planner`, `cost-optimizer`, `observability-agent`, `release-manager`, `portfolio-strategist`.
3. Antes de correr, se o agente **não** for *advisory* (`canRunWithoutCurrentAgentMatch`), verifica com `pnpm exec aios next --project <projectId>` se `state.currentAgent` coincide com o `agentId` pedido; se não, explica o mismatch e o que fazer (`approve` de gates anteriores, `--sync`, ou ajustar estado).
4. Para **`engineer`** / **`qa-reviewer`**: garante que existe **`currentTaskId`** no estado quando usam `run --agent` no workflow `full-catalog-delivery`; senão recomenda `pnpm exec aios run:task` / `run:qa` com `--task <TASK-ID>`.
5. Executa: `pnpm exec aios run --project <projectId> --agent <agentId>`.
6. Resume o resultado JSON (sucesso, artefactos, erros) e ficheiros em `projects/<projectId>/` que o utilizador pode abrir no Cursor (`@caminho`).
