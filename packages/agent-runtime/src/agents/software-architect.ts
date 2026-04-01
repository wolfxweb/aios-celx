import { writeMarkdown } from "@aios-celx/artifact-manager";
import type { AgentResult } from "@aios-celx/shared";
import { join } from "node:path";
import type { AgentExecutionContext } from "../context.js";

export async function runSoftwareArchitect(ctx: AgentExecutionContext): Promise<AgentResult> {
  const discovery = ctx.files["docs/discovery.md"] ?? "";
  const prd = ctx.files["docs/prd.md"] ?? "";
  const stories = ctx.files["backlog/stories.yaml"] ?? "";

  const archBody = `# Architecture — ${ctx.projectId}

> **Scope:** descreve a arquitetura do **produto gerido** neste projeto (\`${ctx.projectId}\`), não a do monorepo aios-celx salvo quando esse _é_ o produto.

## Context & boundaries

- **Problem space:** derivado de discovery + PRD (excertos abaixo).
- **System boundary:** o que pertence a este produto vs integrações externas (listar quando conhecidas).
- **Trust boundaries:** dados sensíveis, auticação, exposição de APIs.

**Discovery (excerpt)**

\`\`\`
${discovery.split("\n").slice(0, 10).join("\n")}
\`\`\`

**PRD (excerpt)**

\`\`\`
${prd.split("\n").slice(0, 10).join("\n")}
\`\`\`

## Components (logical)

| Módulo / componente | Responsabilidade | Notas |
|--------------------|------------------|--------|
| **Client / UI** | Interação do utilizador | Web, mobile ou CLI conforme produto |
| **Application / API** | Casos de uso, orquestração | Serviço principal |
| **Dados** | Persistência, consistência | Bases, caches, filas |
| **Integrações** | Sistemas externos | Preencher com APIs reais quando existirem |

## Modules & boundaries

- Definir **fronteiras** entre módulos (DDD leve ou camadas).
- Evitar acoplamento circular; documentar dependências permitidas.

## Technical stack (candidate)

| Camada | Escolha (draft) |
|--------|------------------|
| Runtime | TBD (ex.: Node, Bun, JVM) |
| API | TBD (ex.: HTTP REST, RPC) |
| Data | TBD (ex.: Postgres, SQLite) |
| Observability | Logs estruturados, traços (TBD) |

## Data & storage (high level)

- Entidades principais alinhadas ao PRD (não modelo ERD completo no mock).
- Estratégia de migrações / versão de schema: TBD.

## Patterns & conventions

- Estilo de commits, branches (se Git activo no projecto).
- Erros, idempotência, paginação em APIs públicas.

_Mock — **software-architect** — ${new Date().toISOString()}_
`;

  const apiBody = `# API contracts — ${ctx.projectId}

## Conventions (draft)

- **Base URL:** configurável por ambiente (ex.: \`https://api.example.com\`)
- **Versioning:** prefixo de versão (ex.: \`/v1\`)
- **Errors:** corpo consistente, ex.: \`{ "error": { "code": "string", "message": "string" } }\`
- **Auth:** Bearer / session (definir quando o PRD fechar)

## Endpoints (illustrative)

### Health

- \`GET /v1/health\` → \`{ "ok": true }\`

### Resources (substituir por domínio real)

- \`GET /v1/resources\` — listagem
- \`POST /v1/resources\` — criação

### Integration hooks (optional)

- Webhooks ou message bus — preencher com base no discovery.

_Stories (excerpt)_

\`\`\`
${stories.split("\n").slice(0, 16).join("\n")}
\`\`\`

_Mock — **software-architect** — ${new Date().toISOString()}_
`;

  const archPath = "docs/architecture.md";
  const apiPath = "docs/api-contracts.md";
  await writeMarkdown(join(ctx.projectRoot, archPath), archBody);
  await writeMarkdown(join(ctx.projectRoot, apiPath), apiBody);

  return {
    agentId: "software-architect",
    success: true,
    message: "Wrote architecture and API contract drafts.",
    artifactsWritten: [archPath, apiPath],
  };
}
