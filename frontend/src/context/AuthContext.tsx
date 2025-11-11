import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { login as loginRequest } from "../api";
import type { AuthTokens, Role } from "../types";

interface AuthContextValue {
  user: {
    id: number;
    username: string;
    role: Role;
    department?: string | null;
    plant?: string | null;
  } | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const storageKeys = {
  access: "access_token",
  refresh: "refresh_token",
  user: "auth_user"
} as const;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
    };
    window.addEventListener("auth:logout", handleForcedLogout);

    const storedUser = localStorage.getItem(storageKeys.user);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(storageKeys.user);
      }
    }
    setLoading(false);

    return () => {
      window.removeEventListener("auth:logout", handleForcedLogout);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await loginRequest(username, password);
    persistTokens(tokens);
    setUser(tokens.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(storageKeys.access);
    localStorage.removeItem(storageKeys.refresh);
    localStorage.removeItem(storageKeys.user);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return ctx;
};

const persistTokens = (tokens: AuthTokens) => {
  localStorage.setItem(storageKeys.access, tokens.access_token);
  localStorage.setItem(storageKeys.refresh, tokens.refresh_token);
  localStorage.setItem(storageKeys.user, JSON.stringify(tokens.user));
};
