import type { ApiResponse } from '@/types';

const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('notes-token');
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    headers,
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem('notes-token');
    window.location.href = '/login';
    throw new Error('请重新登录');
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }

  return json.data as T;
}

export const api = {
  get<T>(url: string): Promise<T> {
    return request<T>(url);
  },

  post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  del<T>(url: string): Promise<T> {
    return request<T>(url, { method: 'DELETE' });
  },
};
