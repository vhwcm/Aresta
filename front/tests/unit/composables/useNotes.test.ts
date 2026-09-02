import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotes } from '../../../app/composables/useNotes';

// Mock global $fetch
const mockFetch = vi.fn();
(global as any).$fetch = mockFetch;

vi.mock('../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    token: { value: 'fake-token' },
    user: { value: { id: 1, name: 'Test' } },
  }),
}));

describe('useNotes composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchNotes busca lista de notas da API', async () => {
    const mockResponse = {
      notes: [
        { id: 'note-1', title: 'Nota 1', content: 'Conteúdo 1', tags: ['tag1'], updatedAt: '2026-09-01' },
      ],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    const { notesList, fetchNotes } = useNotes();
    const result = await fetchNotes();

    expect(mockFetch).toHaveBeenCalled();
    expect(result.notes).toHaveLength(1);
    expect(notesList.value[0]?.title).toBe('Nota 1');
  });

  it('createNote envia payload e adiciona nota ao topo da lista', async () => {
    const newNote = {
      id: 'note-new',
      userId: 1,
      title: 'Nota Criada',
      content: 'Markdown content',
      tags: [],
      updatedAt: '2026-09-02',
    };
    mockFetch.mockResolvedValueOnce(newNote);

    const { createNote, notesList, currentNote } = useNotes();
    const created = await createNote({ title: 'Nota Criada', content: 'Markdown content' });

    expect(created.id).toBe('note-new');
    expect(notesList.value[0]?.id).toBe('note-new');
    expect(currentNote.value?.title).toBe('Nota Criada');
  });

  it('deleteNote remove a nota da lista', async () => {
    const { deleteNote, notesList } = useNotes();
    notesList.value = [
      { id: 'note-1', userId: 1, title: 'Nota 1', content: '', tags: [], updatedAt: '' },
      { id: 'note-2', userId: 1, title: 'Nota 2', content: '', tags: [], updatedAt: '' },
    ];
    mockFetch.mockResolvedValueOnce({ message: 'Nota excluída com sucesso' });

    await deleteNote('note-1');

    expect(notesList.value).toHaveLength(1);
    expect(notesList.value[0]?.id).toBe('note-2');
  });
});
