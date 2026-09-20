import { ref } from 'vue';
import type { NoteItem } from '~/interfaces/note';
import { useAuth } from '~/composables/useAuth';
import { useFlashcards } from '~/composables/useFlashcards';
import { useGraph } from '~/composables/useGraph';
import { noteRepo } from '~/adapters/database/repositories/NoteRepository';
import type { LocalNote } from '~/adapters/database/types';
import { resolveNoteTitle } from '~/utils/noteTitle';

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

export function extractCanvasIdsFromMarkdown(content?: string): string[] {
  if (!content) return [];
  const regexes = [
    /\[.*?\]\(canvas:([a-zA-Z0-9_-]+)\)/gi,
    /\[\[canvas:([a-zA-Z0-9_-]+)(?:\|.*?)?\]\]/gi,
    /!\[\[canvas:([a-zA-Z0-9_-]+)\]\]/gi,
    /\[.*?\]\((?:https?:\/\/[^/\s)]+)?\/canvas\/([a-zA-Z0-9_-]+)\)/gi,
  ];
  const ids = new Set<string>();
  for (const reg of regexes) {
    let m: RegExpExecArray | null;
    while ((m = reg.exec(content)) !== null) {
      if (m[1]) ids.add(m[1]);
    }
  }
  return Array.from(ids);
}

export function useNotes() {
  const { token, user } = useAuth();

  const fetchNotes = async (params: { folder?: string; tag?: string; search?: string; page?: number; limit?: number } = {}) => {
    isLoading.value = true;
    error.value = null;

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
      const cleanId = String(id).trim();
      const prefixedId = cleanId.startsWith('note-') ? cleanId : `note-${cleanId}`;
      const strippedId = cleanId.replace(/^note-/, '');

      // 1. Tenta buscar no banco de dados local (Dexie/SQLite)
      let local = await noteRepo.getById(cleanId);
      if (!local && cleanId !== prefixedId) {
        local = await noteRepo.getById(prefixedId);
      }
      if (!local && cleanId !== strippedId) {
        local = await noteRepo.getById(strippedId);
      }
      if (local) {
        const item = mapLocalToNoteItem(local);
        currentNote.value = item;
        return item;
      }

      // 2. Tenta buscar na lista em memória atual
      const matchNote = (n: NoteItem) => {
        const nId = String(n.id);
        return nId === cleanId || nId === prefixedId || nId === strippedId || nId.replace(/^note-/, '') === strippedId;
      };

      let inMemory = notesList.value.find(matchNote);
      if (inMemory) {
        currentNote.value = inMemory;
        return inMemory;
      }

      // 3. Se não encontrou e a lista em memória estiver vazia, tenta recarregar notas
      if (notesList.value.length === 0) {
        await fetchNotes();
        inMemory = notesList.value.find(matchNote);
        if (inMemory) {
          currentNote.value = inMemory;
          return inMemory;
        }
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
    isLoading.value = true;
    error.value = null;
    const localId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const content = input.content || '';
    const initialLinks: Array<{ targetType: 'CANVAS' | 'BOOK' | 'NOTE'; targetId: string }> = (input.links || []).map((l) => ({ targetType: l.targetType, targetId: l.targetId }));
    if (input.canvasId && !initialLinks.some((l) => l.targetType === 'CANVAS' && l.targetId === input.canvasId)) {
      initialLinks.push({ targetType: 'CANVAS', targetId: input.canvasId });
    }
    const extractedFromContent = extractCanvasIdsFromMarkdown(content);
    for (const cId of extractedFromContent) {
      if (!initialLinks.some((l) => l.targetType === 'CANVAS' && l.targetId === cId)) {
        initialLinks.push({ targetType: 'CANVAS', targetId: cId });
      }
    }

    const resolvedTitle = resolveNoteTitle(input.title, content);

    const saved = await noteRepo.save({
      id: localId,
      title: resolvedTitle,
      content,
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

    try {
      const { fetchGraph } = useGraph();
      fetchGraph().catch(() => {});
    } catch {
      // Non-blocking
    }

    return item;
  };

  const updateNote = async (id: string, input: { title?: string; content?: string; folder?: string | null; tags?: string[] }) => {
    isLoading.value = true;
    error.value = null;

    try {
      const existing = await noteRepo.getById(id);
      const content = input.content !== undefined ? input.content : (existing?.content || '');
      const currentLinks: Array<{ targetType: 'CANVAS' | 'BOOK' | 'NOTE'; targetId: string }> = [...(existing?.links || [])];
      const extractedFromContent = extractCanvasIdsFromMarkdown(content);
      for (const cId of extractedFromContent) {
        if (!currentLinks.some((l) => l.targetType === 'CANVAS' && l.targetId === cId)) {
          currentLinks.push({ targetType: 'CANVAS', targetId: cId });
        }
      }

      const rawTitle = input.title !== undefined ? input.title : existing?.title;
      const resolvedTitle = resolveNoteTitle(rawTitle, content);

      const saved = await noteRepo.save({
        id,
        title: resolvedTitle,
        content,
        folder: input.folder !== undefined ? input.folder : (existing?.folder || null),
        tags: input.tags !== undefined ? input.tags : (existing?.tags || []),
        links: currentLinks,
      });

      const updated = mapLocalToNoteItem(saved);
      const index = notesList.value.findIndex((n) => n.id === id);
      if (index !== -1) {
        notesList.value[index] = updated;
      }
      if (currentNote.value?.id === id) {
        currentNote.value = updated;
      }

      try {
        const { fetchGraph } = useGraph();
        fetchGraph().catch(() => {});
      } catch {
        // Non-blocking
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

    try {
      const { fetchGraph } = useGraph();
      fetchGraph().catch(() => {});
    } catch {
      // Non-blocking
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
