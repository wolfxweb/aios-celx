# API Contracts — Forgeos

## Convenções

- API HTTP JSON.
- Respostas com payload consistente e mensagens de erro claras.

## Endpoints iniciais sugeridos

- `GET /health` — verificação de saúde.
- `GET /resources` — listagem do recurso principal.
- `POST /resources` — criação do recurso principal.
- `PATCH /resources/:id` — atualização do recurso principal.

## Observações

- Ajustar nomes e contratos conforme o domínio real do produto.
- Validar autenticação, autorização e paginação antes da implementação.
