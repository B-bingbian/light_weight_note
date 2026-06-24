<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MdEditor, MdPreview } from 'md-editor-v3';
import { useNotesStore } from '@/stores/notes';

const route = useRoute();
const router = useRouter();
const store = useNotesStore();

const title = ref('');
const content = ref('');
const isNew = ref(true);
const noteId = ref<number | null>(null);
const saving = ref(false);
const saved = ref(false);
const isPreview = ref(false);

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let savedTimer: ReturnType<typeof setTimeout> | null = null;

const formattedCreatedAt = computed(() => {
  if (!store.currentNote?.created_at) return '';
  return store.currentNote.created_at.slice(0, 10);
});

const formattedUpdatedAt = computed(() => {
  if (!store.currentNote?.updated_at) return '';
  return store.currentNote.updated_at.slice(0, 10);
});

onMounted(async () => {
  const id = route.params.id;
  if (id && typeof id === 'string') {
    isNew.value = false;
    noteId.value = Number(id);
    await store.fetchNoteById(noteId.value);
    if (store.currentNote) {
      title.value = store.currentNote.title;
      content.value = store.currentNote.content;
    }
    // 已有笔记默认进入预览模式
    isPreview.value = true;
  }
});

// Auto-save: debounce 2 seconds after changes stop
function scheduleSave() {
  if (savedTimer) {
    clearTimeout(savedTimer);
    saved.value = false;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    doSave();
  }, 2000);
}

watch([title, content], () => {
  if (isPreview.value) return;
  if (isNew.value && !title.value && !content.value) return;
  scheduleSave();
});

async function doSave() {
  if (saving.value) return;
  saving.value = true;
  try {
    if (isNew.value) {
      const note = await store.createNote({ title: title.value, content: content.value });
      isNew.value = false;
      noteId.value = note.id;
      // Update URL without navigation
      router.replace(`/note/${note.id}`);
    } else if (noteId.value) {
      await store.updateNote(noteId.value, { title: title.value, content: content.value });
    }
    saved.value = true;
    savedTimer = setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch {
    // Error is stored in store.error
  } finally {
    saving.value = false;
  }
}

// Flush pending save on leave
onBeforeUnmount(() => {
  if (saveTimer && !isPreview.value) {
    clearTimeout(saveTimer);
    doSave();
  }
  store.clearCurrentNote();
});

function goBack() {
  router.push('/');
}

function toggleMode() {
  if (isPreview.value) {
    // 切换到编辑模式前，刷新笔记内容以防有变更
    isPreview.value = false;
  } else {
    // 切换到预览模式前，先保存未保存的更改
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      doSave();
    }
    isPreview.value = true;
  }
}

async function handleDelete() {
  if (!noteId.value) return;
  if (!confirm('确定要删除这篇笔记吗？')) return;
  try {
    await store.deleteNote(noteId.value);
    router.push('/');
  } catch {
    // Error in store
  }
}

async function onUploadImg(files: File[], callback: (urls: string[]) => void): Promise<void> {
  const results: string[] = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('notes-token');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await res.json();
    if (json.success) {
      results.push(json.data.url);
    }
  }
  callback(results);
}
</script>

<template>
  <div class="editor-page">
    <div class="editor-toolbar">
      <button class="btn-back" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4L6 9l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        返回
      </button>

      <!-- 预览模式：标题只读展示 -->
      <h1 v-if="isPreview" class="preview-title-inline">{{ title || '无标题' }}</h1>

      <!-- 编辑模式：标题输入框 -->
      <input
        v-else
        v-model="title"
        type="text"
        class="title-input"
        placeholder="笔记标题..."
      />

      <div class="toolbar-actions">
        <span v-if="saving" class="save-status">保存中...</span>
        <span v-else-if="saved" class="save-status saved">已保存</span>

        <!-- 预览/编辑切换按钮 -->
        <button class="btn-mode" @click="toggleMode" :title="isPreview ? '编辑' : '预览'">
          <!-- 编辑图标 -->
          <svg v-if="isPreview" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- 预览图标 -->
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          {{ isPreview ? '编辑' : '预览' }}
        </button>

        <button v-if="!isNew" class="btn-delete" @click="handleDelete" title="删除笔记">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 7v4M9 7v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="store.error" class="editor-error">
      {{ store.error }}
    </div>

    <!-- 预览模式 -->
    <div v-if="isPreview" class="preview-container">
      <div class="preview-meta" v-if="formattedCreatedAt || formattedUpdatedAt">
        <span v-if="formattedCreatedAt">创建于 {{ formattedCreatedAt }}</span>
        <span v-if="formattedUpdatedAt && formattedUpdatedAt !== formattedCreatedAt">· 更新于 {{ formattedUpdatedAt }}</span>
      </div>
      <MdPreview :modelValue="content" :preview-theme="'default'" :language="'zh-CN'" />
    </div>

    <!-- 编辑模式 -->
    <div v-else class="editor-container">
      <MdEditor
        v-model="content"
        :language="'zh-CN'"
        :toolbars="['bold', 'italic', 'strikethrough', '|', 'h1', 'h2', 'h3', '|', 'quote', 'unorderedList', 'orderedList', 'code', '|', 'link', 'image', 'table', '|', 'preview']"
        :preview-theme="'default'"
        :on-upload-img="onUploadImg"
        style="height: calc(100vh - 140px)"
      />
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  max-width: 1200px;
  margin: 0 auto;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.btn-back:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.title-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  outline: none;
  min-width: 0;
}

.title-input::placeholder {
  color: var(--text-tertiary);
  font-weight: 400;
}

.preview-title-inline {
  flex: 1;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.save-status {
  font-size: 12px;
  color: var(--text-tertiary);
}

.save-status.saved {
  color: var(--success-color);
}

.btn-mode {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.btn-mode:hover {
  background: var(--bg-secondary);
  color: var(--accent-color);
  border-color: var(--accent-color);
}

.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.btn-delete:hover {
  color: var(--danger-color);
  border-color: var(--danger-color);
}

.editor-error {
  background: var(--danger-bg);
  color: var(--danger-color);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 12px;
}

.editor-container {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.preview-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 8px 24px 40px;
}

.preview-meta {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}
</style>
