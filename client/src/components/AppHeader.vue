<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

function goHome() {
  router.push('/');
}

function createNote() {
  router.push('/note/new');
}

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <button class="logo" @click="goHome">
        <svg class="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="currentColor"/>
          <path d="M8 9h16M8 16h16M8 23h10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <span class="logo-text">Notes</span>
      </button>

      <div v-if="auth.isAuthenticated" class="header-right">
        <button class="btn-new" @click="createNote">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>新建笔记</span>
        </button>
        <div class="user-menu">
          <span class="username">{{ auth.user?.username }}</span>
          <button class="btn-logout" @click="handleLogout" title="退出登录">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 13H3V3h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  padding: 4px;
  border-radius: 8px;
  transition: opacity 0.15s;
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: var(--accent-color);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--accent-color);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.btn-new:hover {
  opacity: 0.9;
}

.btn-new:active {
  transform: scale(0.97);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
  padding: 5px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.btn-logout:hover {
  color: var(--danger-color);
  border-color: var(--danger-color);
}
</style>
