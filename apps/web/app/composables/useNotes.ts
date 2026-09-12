import { ref } from 'vue';
import type { NoteItem, NoteListResponse } from '~/interfaces/note';
import { useAuth } from '~/composables/useAuth';
import { useFlashcards } from '~/composables/useFlashcards';

const getNotesApiUrl = () => {
  if (typeof useRuntimeConfig === 'function') {
    try {
      const config = useRuntimeConfig();
      if (config?.public?.canvasApiUrl) return `${config.public.canvasApiUrl}/api`;
    } catch {
      // Ignora erro ao obter runtimeConfig fora do contexto Nuxt
    }
  }
  return 'http://localhost:3004/api';
};

const LOCAL_STORAGE_KEY = 'aresta_local_notes';

const loadLocalNotes = (): NoteItem[] => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalNotes = (notes: NoteItem[]) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('[useNotes] Erro ao salvar notas no localStorage:', e);
  }
};

const notesList = ref<NoteItem[]>([]);
const currentNote = ref<NoteItem | null>(null);
const folders = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useNotes() {
  const { token, user } = useAuth();

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

    if (notesList.value.length === 0) {
      const cached = loadLocalNotes();
      if (cached.length > 0) {
        notesList.value = cached;
      }
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.folder) queryParams.append('folder', params.folder);
      if (params.tag) queryParams.append('tag', params.tag);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));

      const res = await $fetch<NoteListResponse>(`${getNotesApiUrl()}/notes?${queryParams.toString()}`, {
        headers: getHeaders(),
      });

      if (res && Array.isArray(res.notes)) {
        const remoteIds = new Set(res.notes.map((n) => n.id));
        const localOnly = notesList.value.filter((n) => !remoteIds.has(n.id) && n.id.startsWith('note-'));
        notesList.value = [...localOnly, ...res.notes];
        saveLocalNotes(notesList.value);
      }
      return res;
    } catch (err: any) {
      console.warn('[useNotes] fetchNotes offline ou sem resposta da API:', err);
      const cached = loadLocalNotes();
      if (cached.length > 0) {
        notesList.value = cached;
      }
      return { notes: notesList.value, total: notesList.value.length, page: 1, limit: 50, totalPages: 1 };
    } finally {
      isLoading.value = false;
    }
  };

  const loadNote = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const note = await $fetch<NoteItem>(`${getNotesApiUrl()}/notes/${id}`, {
        headers: getHeaders(),
      });
      currentNote.value = note;
      return note;
    } catch (err: any) {
      const local = notesList.value.find((n) => n.id === id);
      if (local) {
        currentNote.value = local;
        return local;
      }
      error.value = 'Nota não encontrada.';
      console.warn('[useNotes] loadNote offline / local fallback:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const createNote = async (input: {
    title?: string;
    content?: string;
    folder?: string | null;
    tags?: string[];
    canvasId?: string;
    links?: Array<{ targetType: 'CANVAS' | 'BOOK' | 'NOTE'; targetId: string }>;
  }) => {
    isLoading.value = true;
    error.value = null;

    const localId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const initialLinks = (input.links || []).map((l, idx) => ({ id: idx + 1, targetType: l.targetType, targetId: l.targetId }));
    if (input.canvasId && !initialLinks.some((l) => l.targetType === 'CANVAS' && l.targetId === input.canvasId)) {
      initialLinks.push({ id: initialLinks.length + 1, targetType: 'CANVAS', targetId: input.canvasId });
    }

    const fallbackNote: NoteItem = {
      id: localId,
      userId: (user as any)?.value?.id || 1,
      title: input.title?.trim() || 'Nova Nota',
      content: input.content || '',
      folder: input.folder || null,
      tags: input.tags || [],
      links: initialLinks,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await $fetch<NoteItem>(`${getNotesApiUrl()}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: input,
      });

      const index = notesList.value.findIndex((n) => n.id === created.id);
      if (index !== -1) {
        notesList.value[index] = created;
      } else {
        notesList.value.unshift(created);
      }
      currentNote.value = created;
      saveLocalNotes(notesList.value);
      return created;
    } catch (err: any) {
      console.warn('[useNotes] createNote API falhou ou offline, persistindo localmente:', err);
      notesList.value.unshift(fallbackNote);
      currentNote.value = fallbackNote;
      saveLocalNotes(notesList.value);
      return fallbackNote;
    } finally {
      isLoading.value = false;
    }
  };

  const updateNote = async (id: string, input: { title?: string; content?: string; folder?: string | null; tags?: string[] }) => {
    isLoading.value = true;
    error.value = null;

    // Atualiza otimista localmente
    const index = notesList.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      const existing = notesList.value[index]!;
      const updatedLocal: NoteItem = {
        ...existing,
        ...input,
        folder: input.folder !== undefined ? input.folder : existing.folder,
        tags: input.tags !== undefined ? input.tags : existing.tags,
        updatedAt: new Date().toISOString(),
      };
      notesList.value[index] = updatedLocal;
      if (currentNote.value?.id === id) {
        currentNote.value = updatedLocal;
      }
      saveLocalNotes(notesList.value);
    }

    try {
      const updated = await $fetch<NoteItem>(`${getNotesApiUrl()}/notes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: input,
      });

      if (index !== -1) {
        notesList.value[index] = updated;
      }
      if (currentNote.value?.id === id) {
        currentNote.value = updated;
      }
      saveLocalNotes(notesList.value);
      return updated;
    } catch (err: any) {
      console.warn('[useNotes] updateNote API offline / local-only:', err);
      return notesList.value[index] || null;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteNote = async (id: string) => {
    notesList.value = notesList.value.filter((n) => n.id !== id);
    if (currentNote.value?.id === id) {
      currentNote.value = null;
    }
    saveLocalNotes(notesList.value);

    // Cascata: excluir flashcards locais vinculados a esta nota
    try {
      const { deleteFlashcardByNoteId } = useFlashcards()
      await deleteFlashcardByNoteId(id)
    } catch (e) {
      console.warn('[useNotes] Falha na cascata de exclusão de flashcards locais da nota:', e)
    }

    try {
      await $fetch(`${getNotesApiUrl()}/notes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (err: any) {
      console.warn('[useNotes] deleteNote API offline / local-only:', err);
    }
  };

  const fetchFolders = async () => {
    try {
      const list = await $fetch<string[]>(`${getNotesApiUrl()}/notes/folders`, {
        headers: getHeaders(),
      });
      if (Array.isArray(list)) {
        folders.value = list;
      }
      return folders.value;
    } catch (err: any) {
      console.warn('[useNotes] fetchFolders offline / derivando das notas locais:', err);
      const set = new Set<string>();
      notesList.value.forEach((n) => {
        if (n.folder) set.add(n.folder);
      });
      folders.value = Array.from(set);
      return folders.value;
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
