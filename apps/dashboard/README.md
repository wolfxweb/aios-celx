# @aios-celx/dashboard

Dashboard operacional (React + Vite + TypeScript) que consome **apenas** a API HTTP em [`apps/api`](../api/README.md). Não duplica backend nem lógica de domínio.

## Requisitos

- Node.js 20+
- A API a correr (por omissão `http://127.0.0.1:3030`) — ver `pnpm --filter @aios-celx/api start` após `pnpm build` na raiz.

## Configuração

Variável opcional (ficheiro `.env` local ou ambiente):

| Variável | Descrição |
|----------|-----------|
| `VITE_API_BASE_URL` | URL base da API (ex.: `http://127.0.0.1:3030`). Se omitida, usa-se `http://127.0.0.1:3030`. |

## Comandos

Na raiz do monorepo:

```bash
pnpm install
pnpm --filter @aios-celx/dashboard dev
```

Build de produção:

```bash
pnpm --filter @aios-celx/dashboard build
```

Pré-visualização do build estático:

```bash
pnpm --filter @aios-celx/dashboard preview
```

## Verificação manual

1. `pnpm build` e `pnpm --filter @aios-celx/api start` num terminal.
2. `pnpm --filter @aios-celx/dashboard dev` noutro.
3. Abrir o URL indicado pelo Vite (tipicamente `http://127.0.0.1:5173`) e navegar em Projetos, detalhe de projeto e Portfolio.

A API regista CORS permissivo para desenvolvimento local; em produção restrinja origem no servidor Fastify se necessário.
