import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';

const TOKEN_KEY = 'notes-token';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // Restore from localStorage on init
  function init(): void {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      token.value = saved;
      // Fetch current user to validate token
      fetchMe();
    }
  }

  async function fetchMe(): Promise<void> {
    if (!token.value) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      if (!res.ok) {
        logout();
        return;
      }
      const json = await res.json();
      if (json.success) {
        user.value = json.data.user;
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }

  async function login(username: string, password: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Login failed');
      }
      token.value = json.data.token;
      user.value = json.data.user;
      localStorage.setItem(TOKEN_KEY, json.data.token);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string, password: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Register failed');
      }
      token.value = json.data.token;
      user.value = json.data.user;
      localStorage.setItem(TOKEN_KEY, json.data.token);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function logout(): void {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return { user, token, loading, error, isAuthenticated, init, login, register, logout };
});
