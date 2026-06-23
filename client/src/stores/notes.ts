import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client';
import type { Note, NoteInput } from '@/types';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const currentNote = ref<Note | null>(null);
  const searchQuery = ref('');
  const loading = ref(false);
  const error = ref<string | null>(null);

  const filteredNotes = computed(() => notes.value);

  const noteCount = computed(() => notes.value.length);

  async function fetchNotes(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const params = searchQuery.value ? `?search=${encodeURIComponent(searchQuery.value)}` : '';
      const data = await api.get<{ notes: Note[] }>(`/notes${params}`);
      notes.value = data.notes;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch notes';
    } finally {
      loading.value = false;
    }
  }

  async function fetchNoteById(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.get<{ note: Note }>(`/notes/${id}`);
      currentNote.value = data.note;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch note';
    } finally {
      loading.value = false;
    }
  }

  async function createNote(input: NoteInput): Promise<Note> {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.post<{ note: Note }>('/notes', input);
      notes.value.unshift(data.note);
      return data.note;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create note';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateNote(id: number, input: NoteInput): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.put<{ note: Note }>(`/notes/${id}`, input);
      currentNote.value = data.note;
      // Update in list too
      const idx = notes.value.findIndex((n) => n.id === id);
      if (idx !== -1) {
        notes.value[idx] = data.note;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update note';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteNote(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await api.del(`/notes/${id}`);
      notes.value = notes.value.filter((n) => n.id !== id);
      if (currentNote.value?.id === id) {
        currentNote.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete note';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setSearchQuery(q: string): void {
    searchQuery.value = q;
    fetchNotes();
  }

  function clearCurrentNote(): void {
    currentNote.value = null;
  }

  return {
    notes,
    currentNote,
    searchQuery,
    loading,
    error,
    filteredNotes,
    noteCount,
    fetchNotes,
    fetchNoteById,
    createNote,
    updateNote,
    deleteNote,
    setSearchQuery,
    clearCurrentNote,
  };
});
