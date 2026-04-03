---
description: Orquestrador — PRD, novo projeto com api-contracts + architecture + discovery, relatorio-final.md, backlog YAML; pronto para aprovação (não substitui o CLI)
---

Este workflow guia uma **sessão de definição e aprovação** antes de programar, alinhando docs e backlog sob `projects/<projectId>/`.

## Passo 0 — Introdução
Perguntar explicitamente e registar se é:
1. **Novo projeto** (pasta nova)
2. **Nova funcionalidade** (projeto existente)
3. **Correção** (bug em projeto existente)

## Passo 1 — PRD (prd.md)
Criar ou actualizar `projects/<projectId>/docs/prd.md`.
- Definir **problema, objectivo, âmbito, dentro/fora, critérios de sucesso**.
- Definir **Estratégia de Testes**: testes unitários (padrão) ou opt-out (explicitar motivo).

## Passo 2 — Projecto e Docs
- Se novo: `pnpm exec aios project:create <projectId>`.
- Gerar/Actualizar: `api-contracts.md`, `architecture.md`, `discovery.md` com conteúdo real.

## Passo 3 — Backlog (YAML)
Preencher ou actualizar:
- `backlog/epics.yaml`
- `backlog/stories.yaml`
- `backlog/tasks.yaml`
(Garante cobertura total do pedido inicial).

## Passo 4 — Relatório Final (relatorio-final.md)
Criar `projects/<projectId>/docs/relatorio-final.md` com:
- Checklist de docs e backlog concluídos.
- Resumo para o utilizador aprovar ou ajustar.

## Passo 5 — Próximos Passos
Após aprovação do utilizador, sugerir avançar no workflow CLI com `aios-next` ou `aios-run-agent`.
