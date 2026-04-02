# Contribuir para o aios-celx

Obrigado pelo teu interesse. Este documento explica como participar de forma alinhada com o projeto.

## Código de conduta

Participa de acordo com o **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)**. Comportamento inadequado pode ser reportado à equipa de mantenedores.

## Licença

Ao contribuir, aceitas que o teu contributo seja licenciado nos termos da **[LICENSE](./LICENSE)** (MIT), salvo indicação contrária explícita noutro ficheiro (ex.: cabeçalho de licença).

## Reportar problemas e ideias

- **Bug:** usa o template *Bug report* ao abrir uma issue (GitHub: *Issues → New issue*).
- **Funcionalidade:** usa o template *Feature request*.
- Inclui passos para reproduzir, versão de Node/pnpm, e logs relevantes (sem segredos).

## Desenvolvimento local

Na **raiz do monorepo** (onde está `pnpm-workspace.yaml`):

```bash
pnpm install
pnpm build
pnpm lint
```

- **CLI:** `pnpm exec aios` (ver [README.md](./README.md)).
- **Testes:** cada pacote pode expor testes via `pnpm --filter <pacote> test` quando existir; segue o `package.json` do pacote.

## O que versionar

- **Sim:** código em `packages/`, `apps/`, configuração na raiz, documentação em `docs/agentes/` (conforme `.gitignore`), `.cursor/`, etc.
- **Pasta `projects/`:** por omissão **`projects/*` está no `.gitignore`** (só `projects/.gitkeep` é versionado). Trabalho gerido pelo CLI aí fica local. Contribuições ao **framework** devem focar pacotes e apps do monorepo; se precisares de versionar um projeto exemplo, coordena com os mantenedores (política de `.gitignore`).

## Pull requests

1. **Fork** e **branch** a partir da branch principal (`main`), com nome claro: `fix/…`, `feat/…`, `docs/…`.
2. **Commits** com mensagens claras; podes seguir [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `docs:`) — não é obrigatório, mas ajuda.
3. Garante que **`pnpm build`** e **`pnpm lint`** passam nos pacotes afectados.
4. Abre o PR com descrição do *quê* e *porquê*; referencia issues com `Fixes #123` ou `Refs #123` quando aplicável.
5. Responde a revisões de código com civismo.

## Documentação e Cursor

- [AGENTS.md](./AGENTS.md) orienta agentes de IDE sobre o monorepo.
- Comandos `/aios-*` em [`.cursor/commands/`](./.cursor/commands/) são atalhos de roteiro; o estado do projeto muda com o **CLI** (`pnpm exec aios`).

Dúvidas: abre uma *discussion* ou issue *question* conforme o repositório permitir.
