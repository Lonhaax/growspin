"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiFetch, setAccessToken, getAccessToken, refreshSession } from "@/lib/auth";

interface User {
  id: number;
  username: string;
  role?: string;
  mockBalance: number;
  level: number;
  xp: number;
  rakebackBalance: number;
  totalWagered: number;
  debt?: number;
  debtCreatedAt?: string | null;
  isFrozen?: boolean;
  borrowLimit?: number;
  createdAt: string;
  transactions?: any[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  authModalType: "login" | "register" | null;
  openAuthModal: (type: "login" | "register") => void;
  closeAuthModal: () => void;
  register: (username: string, password: string) => Promise<string | null>;
  login:    (username: string, password: string) => Promise<string | null>;
  logout:   () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [authModalType, setAuthModalType] = useState<"login" | "register" | null>(null);

  const openAuthModal = (type: "login" | "register") => setAuthModalType(type);
  const closeAuthModal = () => setAuthModalType(null);

  // On mount, try to restore session from the HTTP-only refresh token cookie
  useEffect(() => {
    (async () => {
      try {
        const success = await refreshSession();
        if (success) {
          const res = await apiFetch("/user/me");
          if (res.ok) {
             const data = await res.json();
             setUser(data);
          }
        }
      } catch {
        // No session — that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch the full user profile (with transactions) after game plays
  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const res = await apiFetch("/user/me");
      if (res.ok) setUser(await res.json());
    } catch {}
  }, []);

  const register = useCallback(async (username: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Registration failed.";
    setAccessToken(data.accessToken);
    setUser(data.user);
    return null;
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Login failed.";
    setAccessToken(data.accessToken);
    setUser(data.user);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggedIn: !!user, authModalType, openAuthModal, closeAuthModal, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
