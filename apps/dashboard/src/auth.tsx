import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPost, setAuthToken } from "./api";

type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  defaultCredentials: { username: string; password: string } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "aios_auth_token";
const USER_KEY = "aios_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });
  const [defaultCredentials, setDefaultCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiGet<{ credentials: { username: string; password: string } }>(
          "/auth/default-user",
        );
        if (!cancelled) {
          setDefaultCredentials(response.credentials);
        }
      } catch {
        if (!cancelled) {
          setDefaultCredentials(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token && user),
      token,
      user,
      defaultCredentials,
      async login(username: string, password: string) {
        const response = await apiPost<{ token: string; user: AuthUser }>("/auth/login", {
          username,
          password,
        });
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [defaultCredentials, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

