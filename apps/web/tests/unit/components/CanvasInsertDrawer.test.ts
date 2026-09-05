import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasInsertDrawer from '../../../app/components/canvas/CanvasInsertDrawer.vue';

const mockCreateNote = vi.fn();
const mockFetchNotes = vi.fn().mockResolvedValue({ notes: [] });
const mockFetchFolders = vi.fn().mockResolvedValue(['Projetos']);

vi.mock('../../../app/composables/useNotes', () => ({
  useNotes: () => ({
    notesList: { value: [{ id: 'note-existing', title: 'Nota Existente', folder: 'Geral' }] },
    folders: { value: ['Projetos', 'Livros'] },
    fetchNotes: mockFetchNotes,
    fetchFolders: mockFetchFolders,
    createNote: mockCreateNote,
  }),
}));

vi.mock('../../../app/composables/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: { value: [] },
    fetchAnnotations: vi.fn().mockResolvedValue([]),
  }),
}));

describe('CanvasInsertDrawer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe o botão Criar Nova Nota na aba de notas e abre o formulário', async () => {
    const wrapper = mount(CanvasInsertDrawer, {
      props: {
        initialTab: 'notes',
      },
    });

    // Deve exibir o botão de criar nota
    const createButton = wrapper.findAll('button').find((b) => b.text().includes('Criar Nova Nota'));
    expect(createButton).toBeDefined();

    // Clica para abrir o formulário inline
    await createButton?.trigger('click');

    const titleInput = wrapper.find('input[placeholder="Título da nota *"]');
    expect(titleInput.exists()).toBe(true);
  });

  it('cria a nota com createNote e emite insert-note ao submeter o formulário', async () => {
    mockCreateNote.mockResolvedValueOnce({
      id: 'note-created-123',
      title: 'Minha Ideia Nova',
      content: 'Conteúdo markdown relevante',
      folder: 'Projetos',
    });

    const wrapper = mount(CanvasInsertDrawer, {
      props: {
        initialTab: 'notes',
        openCreateNote: true,
      },
    });

    const titleInput = wrapper.find('input[placeholder="Título da nota *"]');
    const contentTextarea = wrapper.find('textarea');

    await titleInput.setValue('Minha Ideia Nova');
    await contentTextarea.setValue('Conteúdo markdown relevante');

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Criar e Inserir'));
    expect(submitBtn).toBeDefined();

    await submitBtn?.trigger('click');

    expect(mockCreateNote).toHaveBeenCalledWith({
      title: 'Minha Ideia Nova',
      content: 'Conteúdo markdown relevante',
      folder: null,
      canvasId: undefined,
    });

    // Deve ter emitido insert-note com a nota criada
    expect(wrapper.emitted('insert-note')).toBeTruthy();
    expect(wrapper.emitted('insert-note')?.[0]?.[0]).toMatchObject({
      id: 'note-created-123',
      title: 'Minha Ideia Nova',
    });
  });

  it('emite insert-note com nota fallback caso ocorra erro inesperado em createNote', async () => {
    mockCreateNote.mockRejectedValueOnce(new Error('Erro inesperado de rede'));

    const wrapper = mount(CanvasInsertDrawer, {
      props: {
        initialTab: 'notes',
        openCreateNote: true,
      },
    });

    const titleInput = wrapper.find('input[placeholder="Título da nota *"]');
    const contentTextarea = wrapper.find('textarea');

    await titleInput.setValue('Ideia Resiliente');
    await contentTextarea.setValue('Conteúdo offline seguro');

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Criar e Inserir'));
    await submitBtn?.trigger('click');

    expect(wrapper.emitted('insert-note')).toBeTruthy();
    expect(wrapper.emitted('insert-note')?.[0]?.[0]).toMatchObject({
      title: 'Ideia Resiliente',
      content: 'Conteúdo offline seguro',
    });
  });
});
