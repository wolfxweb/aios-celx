# Agentes — estrutura por pasta

Cada agente MVP segue o mesmo padrão (alinhado ao catálogo em `docs/agentes/`):

| Ficheiro | Função |
|----------|--------|
| `definition.ts` | `AgentDefinition` (id, description, reads, writes) + constantes opcionais (role, mission). |
| `prompt-template.md` | Texto com `{{placeholders}}` para futura engine LLM; no **mock-engine** é carregado e interpolado (e incluído como referência no Markdown gerado quando aplicável). |
| `output-schema.ts` | `OUTPUT_PATHS` e, quando útil, listas de secções esperadas (validação futura). |
| `run.ts` | Handler executado pelo `mock-engine` (`runAgentCore`). |

Pastas especiais:

- **`engineer/`** e **`qa-reviewer/`** — só `definition` + templates + `output-schema`; a execução real está em `engineer-task-runner.ts` e `qa-task-runner.ts`. O `registry` usa `cli-route-hints` para `aios run --agent`.

Utilitário partilhado: `src/agent-kit/load-prompt.ts` (`loadPromptTemplate`, `interpolateTemplate`).
