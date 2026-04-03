---
description: Executar um agente do catálogo aios via CLI (aios run --agent)
---

O utilizador quer **correr um agente** do workflow (motor resolvido em `.aios/config.yaml`, por omissão `mock-engine`).

1. **`projectId`** e **`agentId`** — confirma ou pergunta.
   - IDs válidos: `requirements-analyst`, `product-manager`, `software-architect`, `delivery-manager`, `engineer`, `qa-reviewer`, `technical-writer`, `refactor-guardian`, `integration-specialist`, `db-designer`, `security-reviewer`, `ux-reviewer`, `sprint-planner`, `cost-optimizer`, `observability-agent`, `release-manager`, `portfolio-strategist`.

2. Verifica context antes de correr: deves preferencialmente saber se o `currentAgent` no status coincide com o `agentId`.
// turbo
3. Executa: `pnpm exec aios run --project <projectId> --agent <agentId>`
4. Resume o resultado JSON (sucesso, artefactos, erros) e ficheiros em `projects/<projectId>/` que o utilizador pode abrir no editor (@caminho).
