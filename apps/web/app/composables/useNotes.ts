import { ref } from 'vue';
import type { NoteItem, NoteListResponse } from '~/interfaces/note';
import { useAuth } from '~/composables/useAuth';
import { useFlashcards } from '~/composables/useFlashcards';
import { noteRepo } from '~/adapters/database/repositories/NoteRepository';
import type { LocalNote } from '~/adapters/database/types';

const mapLocalToNoteItem = (n: LocalNote): NoteItem => ({
  id: n.id,
  userId: 0,
  title: n.title,
  content: n.content || '',
  folder: n.folder || null,
  tags: n.tags || [],
  links: (n.links || []).map((l: any, idx: number) => ({
    id: idx + 1,
    targetType: l.targetType || 'NOTE',
    targetId: l.targetId || String(l.id || idx + 1)
  })),
  createdAt: n.created_at || new Date().toISOString(),
  updatedAt: n.updated_at || new Date().toISOString(),
});

const notesList = ref<NoteItem[]>([]);
const currentNote = ref<NoteItem | null>(null);
const folders = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export const resetNotesMemory = () => {
  notesList.value = [];
  currentNote.value = null;
  folders.value = [];
  isLoading.value = false;
  error.value = null;
};

export function useNotes() {
  const { token, user } = useAuth();

  const fetchNotes = async (params: { folder?: string; tag?: string; search?: string; page?: number; limit?: number } = {}) => {
    isLoading.value = true;
    error.value = null;

    if (!token?.value && !user?.value) {
      notesList.value = [];
      isLoading.value = false;
      return { notes: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    }

    try {
      const local = await noteRepo.getAll({ folder: params.folder, tag: params.tag, search: params.search });
      const mapped = local.map(mapLocalToNoteItem);
      notesList.value = mapped;
      return { notes: mapped, total: mapped.length, page: params.page || 1, limit: params.limit || 50, totalPages: 1 };
    } catch (err: any) {
      console.warn('[useNotes] Erro ao carregar notas locais:', err);
      error.value = 'Falha ao carregar anotações locais.';
      return { notes: notesList.value, total: notesList.value.length, page: 1, limit: 50, totalPages: 1 };
    } finally {
      isLoading.value = false;
    }
  };

  const loadNote = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const local = await noteRepo.getById(id);
      if (local) {
        const item = mapLocalToNoteItem(local);
        currentNote.value = item;
        return item;
      }
      const inMemory = notesList.value.find((n) => n.id === id);
      if (inMemory) {
        currentNote.value = inMemory;
        return inMemory;
      }
      error.value = 'Nota não encontrada.';
      return null;
    } catch (err: any) {
      error.value = 'Nota não encontrada.';
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
    if (!token?.value && !user?.value) {
      error.value = 'É necessário estar autenticado para criar uma anotação.';
      throw new Error('É necessário estar autenticado para criar uma anotação.');
    }

    isLoading.value = true;
    error.value = null;

    const localId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const initialLinks = (input.links || []).map((l, idx) => ({ id: idx + 1, targetType: l.targetType, targetId: l.targetId }));
    if (input.canvasId && !initialLinks.some((l) => l.targetType === 'CANVAS' && l.targetId === input.canvasId)) {
      initialLinks.push({ id: initialLinks.length + 1, targetType: 'CANVAS', targetId: input.canvasId });
    }

    const saved = await noteRepo.save({
      id: localId,
      title: input.title?.trim() || 'Nova Nota',
      content: input.content || '',
      folder: input.folder || null,
      tags: input.tags || [],
      links: initialLinks,
      created_at: now,
      updated_at: now,
    });

    const item = mapLocalToNoteItem(saved);
    notesList.value.unshift(item);
    currentNote.value = item;
    isLoading.value = false;
    return item;
  };

  const updateNote = async (id: string, input: { title?: string; content?: string; folder?: string | null; tags?: string[] }) => {
    isLoading.value = true;
    error.value = null;

    try {
      const existing = await noteRepo.getById(id);
      const saved = await noteRepo.save({
        id,
        title: input.title !== undefined ? input.title : (existing?.title || 'Nota'),
        content: input.content !== undefined ? input.content : (existing?.content || ''),
        folder: input.folder !== undefined ? input.folder : (existing?.folder || null),
        tags: input.tags !== undefined ? input.tags : (existing?.tags || []),
      });

      const updated = mapLocalToNoteItem(saved);
      const index = notesList.value.findIndex((n) => n.id === id);
      if (index !== -1) {
        notesList.value[index] = updated;
      }
      if (currentNote.value?.id === id) {
        currentNote.value = updated;
      }
      return updated;
    } catch (err: any) {
      console.warn('[useNotes] Erro ao atualizar nota local:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteNote = async (id: string) => {
    await noteRepo.delete(id);
    notesList.value = notesList.value.filter((n) => n.id !== id);
    if (currentNote.value?.id === id) {
      currentNote.value = null;
    }

    // Cascata: excluir flashcards locais vinculados a esta nota
    try {
      const { deleteFlashcardByNoteId } = useFlashcards();
      await deleteFlashcardByNoteId(id);
    } catch (e) {
      console.warn('[useNotes] Falha na cascata de exclusão de flashcards locais da nota:', e);
    }
  };

  const fetchFolders = async () => {
    try {
      const list = await noteRepo.getFolders();
      folders.value = list;
      return list;
    } catch (err: any) {
      console.warn('[useNotes] Erro ao buscar pastas locais:', err);
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
