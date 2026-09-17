import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NoteEditorPane from '~/components/notes/NoteEditorPane.vue';
import MilkdownEditor from '~/components/MilkdownEditor.vue';
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
          MilkdownEditor: {
            props: ['modelValue'],
            template: '<div class="milkdown-stub">{{ modelValue }}</div>'
          },
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
          MilkdownEditor: {
            props: ['modelValue'],
            template: '<div class="milkdown-stub">{{ modelValue }}</div>'
          },
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
          MilkdownEditor: {
            props: ['modelValue'],
            template: '<div class="milkdown-stub">{{ modelValue }}</div>'
          },
        },
      },
    });

    const deleteBtn = wrapper.find('button[title="Excluir Nota"]');
    expect(deleteBtn.exists()).toBe(true);
    await deleteBtn.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['note-test-1']);
  });

  it('emits close when close button is clicked', async () => {
    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral', 'Projetos'],
        canvases: [],
      },
      global: {
        stubs: {
          MilkdownEditor: {
            props: ['modelValue'],
            template: '<div class="milkdown-stub">{{ modelValue }}</div>'
          },
        },
      },
    });

    const closeBtn = wrapper.find('button[title="Fechar e retornar"]');
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits update:note and save when MilkdownEditor content changes', async () => {
    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral', 'Projetos'],
        canvases: [],
      },
      global: {
        stubs: {
          MilkdownEditor: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: '<div class="milkdown-stub" @click="$emit(\'update:modelValue\', \'# Novo Conteudo\')">Stub</div>'
          },
        },
      },
    });

    const stub = wrapper.find('.milkdown-stub');
    await stub.trigger('click');

    expect(wrapper.emitted('update:note')).toBeTruthy();
    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('exibe barra flutuante de anotação e flashcard ao selecionar texto e abre modal com parâmetros corretos', async () => {
    const originalGetSelection = window.getSelection;
    window.getSelection = () => ({
      toString: () => 'trecho selecionado para estudo',
    } as any);

    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral'],
        canvases: [],
      },
      global: {
        stubs: {
          MilkdownEditor: true,
          ReaderAnnotationModal: {
            name: 'ReaderAnnotationModal',
            props: ['isOpen', 'initialText', 'noteId', 'initialWantNote', 'initialWantFlashcard'],
            template: '<div class="annotation-modal-stub" v-if="isOpen" :data-note="initialWantNote" :data-flashcard="initialWantFlashcard">{{ initialText }}</div>',
          },
        },
      },
    });

    // Dispara seleção via mouseup na área do editor
    await wrapper.find('.flex-1.p-4').trigger('mouseup');

    // Barra de ferramentas deve aparecer
    const toolbar = wrapper.find('[data-testid="note-selection-toolbar"]');
    expect(toolbar.exists()).toBe(true);
    expect(toolbar.text()).toContain('Anotar');
    expect(toolbar.text()).toContain('Flashcard');

    // Clica no botão Anotar
    const noteBtn = wrapper.find('[data-testid="btn-create-note-from-snippet"]');
    await noteBtn.trigger('mousedown');

    // Modal deve abrir com initialWantNote = true
    const modalStub = wrapper.findComponent({ name: 'ReaderAnnotationModal' });
    expect(modalStub.props('isOpen')).toBe(true);
    expect(modalStub.props('initialText')).toBe('trecho selecionado para estudo');
    expect(modalStub.props('noteId')).toBe('note-test-1');
    expect(modalStub.props('initialWantNote')).toBe(true);
    expect(modalStub.props('initialWantFlashcard')).toBe(false);

    window.getSelection = originalGetSelection;
  });

  it('abre modal configurado para flashcard ao clicar no botão Flashcard da barra flutuante', async () => {
    const originalGetSelection = window.getSelection;
    window.getSelection = () => ({
      toString: () => 'conceito para flashcard',
    } as any);

    const wrapper = mount(NoteEditorPane, {
      props: {
        note: sampleNote,
        folders: ['Geral'],
        canvases: [],
      },
      global: {
        stubs: {
          MilkdownEditor: true,
          ReaderAnnotationModal: {
            name: 'ReaderAnnotationModal',
            props: ['isOpen', 'initialText', 'noteId', 'initialWantNote', 'initialWantFlashcard'],
            template: '<div class="annotation-modal-stub" v-if="isOpen">{{ initialText }}</div>',
          },
        },
      },
    });

    await wrapper.find('.flex-1.p-4').trigger('mouseup');

    const flashcardBtn = wrapper.find('[data-testid="btn-create-flashcard-from-snippet"]');
    await flashcardBtn.trigger('mousedown');

    const modalStub = wrapper.findComponent({ name: 'ReaderAnnotationModal' });
    expect(modalStub.props('isOpen')).toBe(true);
    expect(modalStub.props('initialText')).toBe('conceito para flashcard');
    expect(modalStub.props('initialWantNote')).toBe(false);
    expect(modalStub.props('initialWantFlashcard')).toBe(true);

    window.getSelection = originalGetSelection;
  });

  it('renderiza preview vivo de HTML sintetizado quando a nota contém HTML', () => {
    const htmlNote: NoteItem = {
      id: 'note-html-1',
      userId: 1,
      title: 'Nota Sintetizada',
      content: '<div class="synthesized-html-container"><h1>Título Gerado</h1><p>Conteúdo Semântico</p></div>',
      folder: 'Geral',
      tags: ['sintese'],
      updatedAt: '2026-09-04T10:00:00Z',
    };

    const wrapper = mount(NoteEditorPane, {
      props: {
        note: htmlNote,
        folders: ['Geral'],
        canvases: [],
      },
      global: {
        stubs: {
          MilkdownEditor: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Síntese de Desenho (HTML)');
    expect(wrapper.find('.synthesized-html-container').exists()).toBe(true);
    expect(wrapper.html()).toContain('Título Gerado');
  });
});
