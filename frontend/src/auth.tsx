import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, clearToken, getToken, setToken } from './api';

type User = {
  id: string;
  email: string;
  name: string;
  devices: string[];
  onboarded: boolean;
  created_at: string;
};

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  onboard: (devices: string[], extra?: { age?: number; gender?: string; goal?: string }) => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = await getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await apiGet<User>('/auth/me');
      setUser(me);
    } catch {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await apiPost<{ token: string; user: User }>('/auth/login', { email, password });
    await setToken(res.token);
    setUser(res.user);
  };
  const register = async (email: string, password: string, name: string) => {
    const res = await apiPost<{ token: string; user: User }>('/auth/register', { email, password, name });
    await setToken(res.token);
    setUser(res.user);
  };
  const logout = async () => {
    await clearToken();
    setUser(null);
  };
  const onboard = async (devices: string[], extra?: any) => {
    const u = await apiPost<User>('/auth/onboard', { devices, ...(extra || {}) });
    setUser(u);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh, onboard }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
}
