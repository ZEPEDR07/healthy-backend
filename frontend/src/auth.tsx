import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, clearToken, getToken, setToken } from './api';
import { initLanguage, setLanguage as setI18nLang } from './i18n';

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

export type Prefs = {
  language: 'pt' | 'en' | 'es' | 'fr';
  units: 'metric' | 'imperial';
  notifications_enabled: boolean;
  daily_recovery_reminder: boolean;
  sleep_reminder: boolean;
  workout_reminder: boolean;
};

export type StatusType = 'ativo' | 'doente' | 'aleijado' | 'ferias';

type Ctx = {
  user: User | null;
  prefs: Prefs;
  status: StatusType;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  onboard: (payload: any) => Promise<void>;
  updateProfile: (payload: any) => Promise<User>;
  startTrial: () => Promise<User>;
  redeemCode: (code: string) => Promise<User>;
  setStatus: (s: StatusType) => Promise<void>;
  setPrefs: (p: Partial<Prefs>) => Promise<void>;
  addDevice: (d: string) => Promise<void>;
  removeDevice: (d: string) => Promise<void>;
};

const DEFAULT_PREFS: Prefs = {
  language: 'pt',
  units: 'metric',
  notifications_enabled: true,
  daily_recovery_reminder: true,
  sleep_reminder: true,
  workout_reminder: false,
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [status, setStatusState] = useState<StatusType>('ativo');
  const [loading, setLoading] = useState(true);
  const [, forceTick] = useState(0);

  const loadPrefsAndStatus = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        apiGet<Prefs>('/user/preferences').catch(() => DEFAULT_PREFS),
        apiGet<{ status: StatusType }>('/user/status').catch(() => ({ status: 'ativo' as StatusType })),
      ]);
      setPrefsState(p);
      setStatusState(s.status || 'ativo');
      // Sync i18n language
      if (p.language) {
        await setI18nLang(p.language);
        forceTick((x) => x + 1);
      }
    } catch {}
  }, []);

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
      await loadPrefsAndStatus();
    } catch {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadPrefsAndStatus]);

  useEffect(() => {
    (async () => {
      await initLanguage();
      forceTick((x) => x + 1);
      await refresh();
    })();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await apiPost<{ token: string; user: User }>('/auth/login', { email, password });
    await setToken(res.token);
    setUser(res.user);
    await loadPrefsAndStatus();
  };
  const register = async (email: string, password: string, name: string) => {
    const res = await apiPost<{ token: string; user: User }>('/auth/register', { email, password, name });
    await setToken(res.token);
    setUser(res.user);
    await loadPrefsAndStatus();
  };
  const logout = async () => {
    await clearToken();
    setUser(null);
    setStatusState('ativo');
    setPrefsState(DEFAULT_PREFS);
  };
  const onboard = async (payload: any) => {
    const u = await apiPost<User>('/auth/onboard', payload);
    setUser(u);
    await refresh();
  };
  const updateProfile = async (payload: any) => {
    const u = await apiPatch<User>('/auth/profile', payload);
    setUser(u);
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
  const setStatus = async (s: StatusType) => {
    setStatusState(s);  // optimistic
    try {
      await apiPatch('/user/status', { status: s });
    } catch (e) {
      console.warn('setStatus failed', e);
    }
  };
  const setPrefs = async (p: Partial<Prefs>) => {
    const next = { ...prefs, ...p };
    setPrefsState(next);  // optimistic
    try {
      const updated = await apiPatch<Prefs>('/user/preferences', p);
      setPrefsState(updated);
      if (p.language) {
        await setI18nLang(p.language);
        forceTick((x) => x + 1);
      }
    } catch (e) {
      console.warn('setPrefs failed', e);
    }
  };
  const addDevice = async (d: string) => {
    const r = await apiPost<{ devices: string[] }>('/user/devices/add', { device: d });
    if (user) setUser({ ...user, devices: r.devices });
  };
  const removeDevice = async (d: string) => {
    const r = await apiPost<{ devices: string[] }>('/user/devices/remove', { device: d });
    if (user) setUser({ ...user, devices: r.devices });
  };

  return (
    <AuthCtx.Provider value={{
      user, prefs, status, loading, login, register, logout, refresh, onboard,
      updateProfile, startTrial, redeemCode, setStatus, setPrefs, addDevice, removeDevice,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
}
