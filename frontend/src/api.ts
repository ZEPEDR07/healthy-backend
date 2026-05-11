import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://healthy-backend-production-49f8.up.railway.app';

async function authHeaders() {
  const token = await AsyncStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeaders()) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).detail || 'Request failed');
  return data as T;
}

export const apiGet = <T = any>(path: string) => request<T>('GET', path);
export const apiPost = <T = any>(path: string, body: any) => request<T>('POST', path, body);
export const apiPatch = <T = any>(path: string, body: any) => request<T>('PATCH', path, body);
export const apiDelete = <T = any>(path: string) => request<T>('DELETE', path);

export async function setToken(token: string) { await AsyncStorage.setItem('auth_token', token); }
export async function clearToken() { await AsyncStorage.removeItem('auth_token'); }
export async function getToken() { return AsyncStorage.getItem('auth_token'); }
