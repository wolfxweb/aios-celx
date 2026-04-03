---
description: Bem-vindo à integração Antigravity + aios-celx (BETA)
---

# Antigravity aios-celx Integration 🚀

Olá! Agora o **Antigravity** está alinhado com o workflow da framework **aios-celx**.
Estes scripts (workflows) permitem-me seguir o mesmo roteiro dos comandos do Cursor, mas com a capacidade de rodar a CLI automaticamente.

## Como usar
Para disparar uma acção sincronizada com a framework, pede algo como:
- **"usa o workflow aios-status para o projecto crm-comercial"**
- **"corre o aios-next no projecto assistencia-tickets"**
- **"aprova o gate com o workflow aios-approve-gate"**
- **"inicia o aios-define-scope"** (para novos projectos ou funcionalidades)

## O que foi instalado
1. `aios-status.md`: Estado consolidado (`pnpm exec aios status`).
2. `aios-next.md`: Ver próximo passo (`pnpm exec aios next`).
3. `aios-run-agent.md`: Executar agentes (`pnpm exec aios run --agent`).
4. `aios-approve-gate.md`: Aprovação de gates.
5. `aios-task-qa.md`: Ciclo task -> QA.
6. `aios-define-scope.md`: Orquestrador de PRD, docs e backlog YAML.

## Regras de Workspace
Foram instaladas em `.agents/rules/aios-celx-workspace.md`. Estas asseguarm que eu (Antigravity) opero sempre alinhado ao protocolo do framework (CLI, `projectId` e monorepo).

## Vantagens
- **Automação (// turbo):** Posso correr os comandos da CLI sem pedir aprovação manual para cada um, desde que sigamos o "roteiro".
- **Alinhamento:** Garante que eu não me perco do `state.json` do projecto.

Pronto para começar? Diz-me qual o projecto ou funcionalidade que queres atacar!
