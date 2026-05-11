import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, clearToken, getToken, setToken } from './api';

export type User = {
  id: string;
  email: string;
  name: string;
  devices: string[];
  onboarded: boolean;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  goal?: string;
  premium_status: 'free' | 'trial' | 'lifetime';
  trial_end?: string | null;
  premium_active: boolean;
  created_at: string;
};

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  onboard: (payload: any) => Promise<void>;
  updateProfile: (payload: any) => Promise<User>;
  startTrial: () => Promise<User>;
  redeemCode: (code: string) => Promise<User>;
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

  useEffect(() => { refresh(); }, [refresh]);

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
  const onboard = async (payload: any) => {
    const u = await apiPost<User>('/auth/onboard', payload);
    setUser(u);
    await refresh();
  };
  const updateProfile = async (payload: any) => {
    const u = await apiPatch<User>('/auth/profile', payload);
    setUser(u);
    await refresh();
    return u;
  };
  const startTrial = async () => {
    const u = await apiPost<User>('/premium/start-trial', {});
    setUser(u);
    await refresh();
    return u;
  };
  const redeemCode = async (code: string) => {
    const u = await apiPost<User>('/premium/redeem', { code });
    setUser(u);
    await refresh();
    return u;
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh, onboard, updateProfile, startTrial, redeemCode }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
}
