# API Contracts — Amigo Secreto

## Entities

### Participant

```typescript
interface Participant {
  id: string; // UUID
  name: string; // Full name
  email: string; // Unique email
}
```

### Restriction

```typescript
interface Restriction {
  participantId: string;
  cannotDrawId: string;
}
```

### DrawResult

```typescript
interface DrawResult {
  participantId: string;
  drawnFriendId: string;
}
```

## Endpoints (JSON API)

- `GET /api/participants`: Lista todos os participantes.
- `POST /api/participants`: `{ "name": string, "email": string }` -> Cria participante.
- `POST /api/restrictions`: `{ "participantId": string, "cannotDrawId": string }` -> Cria restrição.
- `POST /api/draw`: Realiza o sorteio e devolve os pares.

## Conventions
- Uso de interfaces para contratos.
- Testes unitários para lógica de sorteio.
- TypeScript strict mode.
- RESTful API com payloads JSON.

_Last updated: 2026-04-03._
