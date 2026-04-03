import { randomUUID } from "node:crypto";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: string;
};

type SessionRecord = {
  token: string;
  user: AuthUser;
  createdAt: string;
};

const DEFAULT_USER = {
  id: "user-default-admin",
  name: "Administrador AIOS",
  username: "admin",
  password: "aios123",
  role: "admin",
} as const;

const sessions = new Map<string, SessionRecord>();

function nowIso(): string {
  return new Date().toISOString();
}

export function getDefaultUserInfo(): AuthUser {
  return {
    id: DEFAULT_USER.id,
    name: DEFAULT_USER.name,
    username: DEFAULT_USER.username,
    role: DEFAULT_USER.role,
  };
}

export function getDefaultCredentials() {
  return {
    username: DEFAULT_USER.username,
    password: DEFAULT_USER.password,
  };
}

export function loginWithPassword(username: string, password: string) {
  if (username !== DEFAULT_USER.username || password !== DEFAULT_USER.password) {
    return null;
  }
  const token = randomUUID();
  const user = getDefaultUserInfo();
  sessions.set(token, {
    token,
    user,
    createdAt: nowIso(),
  });
  return {
    token,
    user,
  };
}

export function resolveUserFromAuthHeader(
  headerValue: string | undefined,
): { token: string; user: AuthUser } | null {
  if (!headerValue) {
    return null;
  }
  const prefix = "Bearer ";
  if (!headerValue.startsWith(prefix)) {
    return null;
  }
  const token = headerValue.slice(prefix.length).trim();
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  return {
    token,
    user: session.user,
  };
}

