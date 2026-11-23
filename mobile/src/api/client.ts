import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from './config';

const TOKEN_KEY = '@dcrustverse:auth:token';

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getStoredToken();
  const url = `${APP_CONFIG.API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = (await res.json()) as ApiResponse<T>;

    if (!res.ok) {
      const errorMsg = json?.error?.message || `Request failed with status ${res.status}`;
      const errorCode = json?.error?.code || 'API_ERROR';
      const error = new Error(errorMsg) as Error & { code?: string; status?: number };
      error.code = errorCode;
      error.status = res.status;
      throw error;
    }

    return (json.data !== undefined ? json.data : json) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Connection timed out. Campus server may be unreachable.');
      (timeoutErr as any).code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  }
}
