# Architecture — Forgeos

## Contexto

Forgeos será estruturado como uma aplicação web com separação entre frontend, backend e domínio.

## Componentes principais

- Interface web para o fluxo principal do utilizador.
- API/backend para regras de negócio e persistência.
- Camada de domínio para entidades e casos de uso.

## Estrutura inicial sugerida

- `src/` para domínio e serviços.
- `api/` ou módulo backend para endpoints e contratos.
- `web/` ou frontend para interface de utilização.
- `tests/` para testes unitários e de integração.

## Decisões iniciais

- Começar simples e modular.
- Priorizar clareza do backlog e rastreabilidade por story/task.
- Evoluir integrações e observabilidade por fases.
