import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function authHeaders() {
  const token = await AsyncStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeaders()) };
  const res = await fetch(`${BASE}/api${path}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

export async function setToken(token: string) {
  await AsyncStorage.setItem('auth_token', token);
}
export async function clearToken() {
  await AsyncStorage.removeItem('auth_token');
}
export async function getToken() {
  return AsyncStorage.getItem('auth_token');
}
