<script setup lang="ts">
import { ref, watch } from 'vue';

const emit = defineEmits<{
  search: [query: string];
}>();

const query = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit('search', val);
  }, 300);
});

function clearSearch() {
  query.value = '';
  emit('search', '');
}
</script>

<template>
  <div class="search-bar">
    <svg class="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="var(--text-tertiary)" stroke-width="1.5"/>
      <path d="M12 12l4 4" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <input
      v-model="query"
      type="text"
      class="search-input"
      placeholder="搜索笔记..."
    />
    <button
      v-if="query"
      class="clear-btn"
      @click="clearSearch"
      title="清除"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-bar:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.search-icon {
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  padding: 10px 0;
  font-size: 15px;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s;
}

.clear-btn:hover {
  color: var(--text-primary);
}
</style>
