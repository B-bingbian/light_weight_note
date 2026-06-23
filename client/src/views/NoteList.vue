<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import SearchBar from '@/components/SearchBar.vue';
import NoteCard from '@/components/NoteCard.vue';

const store = useNotesStore();
const router = useRouter();

onMounted(() => {
  store.fetchNotes();
});

function onSearch(query: string) {
  store.setSearchQuery(query);
}

function openNote(id: number) {
  router.push(`/note/${id}`);
}

function createNote() {
  router.push('/note/new');
}
</script>

<template>
  <div class="note-list-page">
    <div class="list-header">
      <SearchBar @search="onSearch" />
    </div>

    <div v-if="store.loading" class="state-message">
      <p>加载中...</p>
    </div>

    <div v-else-if="store.error" class="state-message state-error">
      <p>{{ store.error }}</p>
      <button class="btn-retry" @click="store.fetchNotes()">重试</button>
    </div>

    <div v-else-if="store.filteredNotes.length === 0" class="state-empty">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="4" y="6" width="40" height="36" rx="4" stroke="var(--text-tertiary)" stroke-width="1.5"/>
        <path d="M16 20h16M16 28h10" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <h3 v-if="store.searchQuery">没有找到匹配的笔记</h3>
      <h3 v-else>还没有笔记</h3>
      <p v-if="!store.searchQuery">点击右上角「新建笔记」开始吧</p>
      <button v-if="!store.searchQuery" class="btn-create" @click="createNote">
        创建第一篇笔记
      </button>
    </div>

    <div v-else class="note-list">
      <NoteCard
        v-for="note in store.filteredNotes"
        :key="note.id"
        :note="note"
        @click="openNote(note.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.note-list-page {
  max-width: 800px;
  margin: 0 auto;
}

.list-header {
  margin-bottom: 20px;
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state-message,
.state-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.state-empty h3 {
  font-size: 18px;
  color: var(--text-primary);
  margin: 16px 0 8px;
}

.state-empty p {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 20px;
}

.state-error {
  color: var(--danger-color);
}

.btn-retry,
.btn-create {
  background: var(--accent-color);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-retry:hover,
.btn-create:hover {
  opacity: 0.9;
}
</style>
