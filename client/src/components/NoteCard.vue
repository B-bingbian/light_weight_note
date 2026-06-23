<script setup lang="ts">
import type { Note } from '@/types';

const props = defineProps<{
  note: Note;
}>();

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr + 'Z').getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;

  const years = Math.floor(months / 12);
  return `${years} 年前`;
}

function snippet(content: string): string {
  return content.replace(/[#*`>\-\[\]()!|]/g, '').slice(0, 120) || '空笔记';
}

function formatDate(dateStr: string): string {
  return dateStr.slice(0, 10);
}
</script>

<template>
  <article class="note-card">
    <div class="note-card-main">
      <h3 class="note-title">{{ note.title || 'Untitled' }}</h3>
      <p class="note-snippet">{{ snippet(note.content) }}</p>
      <div class="note-meta">
        <span class="note-date" :title="formatDate(note.updated_at)">
          {{ timeAgo(note.updated_at) }}
        </span>
      </div>
    </div>
    <svg class="note-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M7 4l6 6-6 6" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </article>
</template>

<style scoped>
.note-card {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}

.note-card:hover {
  border-color: var(--accent-color);
  box-shadow: 0 2px 8px var(--shadow-color);
  transform: translateY(-1px);
}

.note-card-main {
  flex: 1;
  min-width: 0;
}

.note-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-snippet {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.note-chevron {
  flex-shrink: 0;
  margin-left: 12px;
}
</style>
