import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NoteEditorPane from '~/components/notes/NoteEditorPane.vue';
import type { NoteItem } from '~/interfaces/note';

describe('NoteEditorPane Component', () => {
  const sampleNote: NoteItem = {
    id: 'note-test-1',
    userId: 1,
    title: 'Nota de Teste',
    content: '# Cabeçalho\nTexto da nota',
    folder: 'Geral',
    tags: ['teste', 'dev'],
    updatedAt: '2026-09-04T10:00:00Z',
  };

  it('renders note title, folder and tags correctly', () => {
    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral', 'Projetos'],
        canvases: [],
      },
      global: {
        stubs: {
          NoteCompositeRenderer: { template: '<div>Renderer</div>' },
        },
      },
    });

    const titleInput = wrapper.find('input[type="text"]');
    expect((titleInput.element as HTMLInputElement).value).toBe('Nota de Teste');
    expect(wrapper.text()).toContain('#teste');
    expect(wrapper.text()).toContain('#dev');
  });

  it('emits update:note and save when title is modified', async () => {
    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral', 'Projetos'],
        canvases: [],
      },
      global: {
        stubs: {
          NoteCompositeRenderer: { template: '<div>Renderer</div>' },
        },
      },
    });

    const titleInput = wrapper.find('input[type="text"]');
    await titleInput.setValue('Título Alterado');

    expect(wrapper.emitted('update:note')).toBeTruthy();
    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('emits delete when trash button is clicked', async () => {
    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral', 'Projetos'],
        canvases: [],
      },
      global: {
        stubs: {
          NoteCompositeRenderer: { template: '<div>Renderer</div>' },
        },
      },
    });

    const deleteBtn = wrapper.find('button[title="Excluir Nota"]');
    expect(deleteBtn.exists()).toBe(true);
    await deleteBtn.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['note-test-1']);
  });

  it('emits close when ver grade button is clicked', async () => {
    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral', 'Projetos'],
        canvases: [],
      },
      global: {
        stubs: {
          NoteCompositeRenderer: { template: '<div>Renderer</div>' },
        },
      },
    });

    const closeBtn = wrapper.find('button[title="Fechar e retornar à visão em grade"]');
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('formats note content with bold when Ctrl+B is pressed in textarea', async () => {
    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral', 'Projetos'],
        canvases: [],
      },
      global: {
        stubs: {
          NoteCompositeRenderer: { template: '<div>Renderer</div>' },
        },
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);

    const textareaEl = textarea.element as HTMLTextAreaElement;
    // Seleciona "Cabeçalho" (índice 2 a 11 em "# Cabeçalho\nTexto da nota")
    textareaEl.selectionStart = 2;
    textareaEl.selectionEnd = 11;

    await textarea.trigger('keydown', {
      key: 'b',
      ctrlKey: true,
    });

    expect(wrapper.emitted('update:note')).toBeTruthy();
    expect(textareaEl.value).toContain('**Cabeçalho**');
  });
});

