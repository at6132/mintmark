"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type PublicMember = {
  id: string;
  name: string;
  email: string;
  memberNo: string;
  createdAt: string;
};

type AuthContextValue = {
  member: PublicMember | null;
  ready: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<PublicMember | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as { member?: PublicMember | null };
      setMember(data.member ?? null);
    } catch {
      setMember(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMember(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ member, ready, refresh, logout }),
    [member, ready, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
