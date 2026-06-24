<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const submitting = ref(false);
const localError = ref('');

async function handleSubmit(): Promise<void> {
  localError.value = '';

  if (!username.value.trim() || !password.value) {
    localError.value = '请填写所有字段';
    return;
  }

  if (password.value !== confirmPassword.value) {
    localError.value = '两次密码不一致';
    return;
  }

  if (password.value.length < 4) {
    localError.value = '密码至少 4 个字符';
    return;
  }

  submitting.value = true;
  try {
    await auth.register(username.value.trim(), password.value);
    router.push('/');
  } catch {
    // Error is in auth.error
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">注册账号</h1>
      <form class="auth-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span>用户名</span>
          <input v-model="username" type="text" placeholder="至少 2 个字符" autocomplete="username" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="password" type="password" placeholder="至少 4 个字符" autocomplete="new-password" />
        </label>
        <label class="field">
          <span>确认密码</span>
          <input v-model="confirmPassword" type="password" placeholder="再次输入密码" autocomplete="new-password" />
        </label>
        <div v-if="localError" class="form-error">{{ localError }}</div>
        <div v-if="auth.error" class="form-error">{{ auth.error }}</div>
        <button class="btn-submit" type="submit" :disabled="submitting">
          {{ submitting ? '注册中...' : '注册' }}
        </button>
      </form>
      <p class="auth-switch">
        已有账号？<router-link to="/login">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 100px);
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 32px;
}

.auth-title {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 24px;
  color: var(--text-primary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.field input {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus {
  border-color: var(--accent-color);
}

.form-error {
  font-size: 13px;
  color: var(--danger-color);
  background: var(--danger-bg);
  padding: 8px 12px;
  border-radius: 6px;
}

.btn-submit {
  background: var(--accent-color);
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 4px;
}

.btn-submit:hover {
  opacity: 0.9;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 20px 0 0;
}

.auth-switch a {
  color: var(--accent-color);
  font-weight: 500;
}
</style>
