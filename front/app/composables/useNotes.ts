import { ref } from 'vue';
import type { NoteItem, NoteListResponse } from '~/interfaces/note';
import { useAuth } from '~/composables/useAuth';

const API_BASE = 'http://localhost:7070/api';

const notesList = ref<NoteItem[]>([]);
const currentNote = ref<NoteItem | null>(null);
const folders = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useNotes() {
  const { token } = useAuth();

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token?.value) {
      headers.Authorization = `Bearer ${token.value}`;
    }
    return headers;
  };

  const fetchNotes = async (params: { folder?: string; tag?: string; search?: string; page?: number; limit?: number } = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const queryParams = new URLSearchParams();
      if (params.folder) queryParams.append('folder', params.folder);
      if (params.tag) queryParams.append('tag', params.tag);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));

      const res = await $fetch<NoteListResponse>(`${API_BASE}/notes?${queryParams.toString()}`, {
        headers: getHeaders(),
      });

      if (res && Array.isArray(res.notes)) {
        notesList.value = res.notes;
      }
      return res;
    } catch (err: any) {
      error.value = 'Falha ao buscar notas.';
      console.error('[useNotes] fetchNotes error:', err);
      return { notes: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    } finally {
      isLoading.value = false;
    }
  };

  const loadNote = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const note = await $fetch<NoteItem>(`${API_BASE}/notes/${id}`, {
        headers: getHeaders(),
      });
      currentNote.value = note;
      return note;
    } catch (err: any) {
      error.value = 'Nota não encontrada.';
      console.error('[useNotes] loadNote error:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const createNote = async (input: { title?: string; content?: string; folder?: string | null; tags?: string[] }) => {
    isLoading.value = true;
    error.value = null;
    try {
      const created = await $fetch<NoteItem>(`${API_BASE}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: input,
      });

      notesList.value.unshift(created);
      currentNote.value = created;
      return created;
    } catch (err: any) {
      error.value = 'Falha ao criar nota.';
      console.error('[useNotes] createNote error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateNote = async (id: string, input: { title?: string; content?: string; folder?: string | null; tags?: string[] }) => {
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await $fetch<NoteItem>(`${API_BASE}/notes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: input,
      });

      const index = notesList.value.findIndex((n) => n.id === id);
      if (index !== -1) {
        notesList.value[index] = updated;
      }
      if (currentNote.value?.id === id) {
        currentNote.value = updated;
      }
      return updated;
    } catch (err: any) {
      error.value = 'Falha ao atualizar nota.';
      console.error('[useNotes] updateNote error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await $fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      notesList.value = notesList.value.filter((n) => n.id !== id);
      if (currentNote.value?.id === id) {
        currentNote.value = null;
      }
    } catch (err: any) {
      error.value = 'Falha ao excluir nota.';
      console.error('[useNotes] deleteNote error:', err);
      throw err;
    }
  };

  const fetchFolders = async () => {
    try {
      const list = await $fetch<string[]>(`${API_BASE}/notes/folders`, {
        headers: getHeaders(),
      });
      if (Array.isArray(list)) {
        folders.value = list;
      }
      return folders.value;
    } catch (err: any) {
      console.error('[useNotes] fetchFolders error:', err);
      return [];
    }
  };

  return {
    notesList,
    currentNote,
    folders,
    isLoading,
    error,
    fetchNotes,
    loadNote,
    createNote,
    updateNote,
    deleteNote,
    fetchFolders,
  };
}
