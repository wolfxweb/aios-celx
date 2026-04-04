# Decision log — crm-comercial

| Date | ID | Decision | Rationale |
|------|----|-----------|-----------|
| 2026-04-02 | ADR-001 | Persistência em **SQLite** | Um ficheiro por instância simplifica MVP, deploy e backups por cópia; adequado a carga comercial moderada e um servidor de API. WAL e boas práticas de escrita cobrem uso típico. Migração futura para PostgreSQL (ou outro) se houver necessidade de réplicas ou multi-escrita. |
| 2026-04-02 | ADR-002 | Frontend **Vue 3** + **Vuetify 3** | Ecossistema maduro para SPAs; Vuetify fornece tabelas, formulários, diálogos e tema claro/escuro alinhados à especificação de UI; Composition API e Pinia para estado. Vite como bundler padrão. |
| 2026-04-02 | ADR-003 | API **FastAPI** + autenticação **JWT** | FastAPI oferece performance, validação Pydantic e OpenAPI automático; JWT stateless alinha com SPA Vue e escala bem com SQLite em instância única; dependências nativas para `HTTPBearer` e claims. Refresh token para renovar access sem novo login. |
| 2026-04-02 | ADR-004 | Testes da API com **pytest** + SQLite de teste | Separação entre testes unitários (JWT, RBAC, domínio com mocks) e integração HTTP (`httpx`/`TestClient`) com base isolada; reprodutível em CI e alinhado a `api-contracts.md`. |

_Use this file for lightweight ADRs._
