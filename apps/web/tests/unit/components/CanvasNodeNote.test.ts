import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasNodeNote from '../../../app/components/canvas/CanvasNodeNote.vue';
import type { CanvasNode } from '../../../app/interfaces/canvas';

describe('CanvasNodeNote Component', () => {
  it('renderiza nó de nota dentro do canvas com markdown formatado', () => {
    const node: CanvasNode = {
      id: 'node-note-1',
      type: 'note_embed',
      x: 30,
      y: 30,
      width: 300,
      height: 200,
      noteId: 'note-123',
      noteTitle: 'Arquitetura Limpa',
      noteContent: 'Regra de Dependência em círculos concêntricos.',
      color: '#8B5CF6',
    };

    const wrapper = mount(CanvasNodeNote, {
      props: {
        node,
        isSelected: false,
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          AiMarkdown: {
            template: '<div class="ai-markdown-stub">{{ content }}</div>',
            props: ['content'],
          },
          CycleWarningPlaceholder: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Arquitetura Limpa');
    expect(wrapper.find('.ai-markdown-stub').text()).toContain('Regra de Dependência em círculos concêntricos.');
  });

  it('detecta ciclo e renderiza CycleWarningPlaceholder se a nota já estiver na hierarquia', () => {
    const node: CanvasNode = {
      id: 'node-note-cycle',
      type: 'note_embed',
      x: 30,
      y: 30,
      width: 300,
      height: 200,
      noteId: 'note-cycle-target',
      noteTitle: 'Nota Cíclica',
      noteContent: 'Tentativa de loop infinito',
    };

    const wrapper = mount(CanvasNodeNote, {
      props: {
        node,
      },
      global: {
        provide: {
          ancestorStack: [
            { type: 'note', id: 'note-cycle-target', title: 'Nota Cíclica' },
            { type: 'canvas', id: 'canvas-intermediate', title: 'Canvas' },
          ],
        },
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          AiMarkdown: true,
          CycleWarningPlaceholder: {
            template: '<div class="cycle-warning-stub">Referência Cíclica Prevenida</div>',
          },
        },
      },
    });

    // Deve exibir o placeholder de ciclo prevenido
    expect(wrapper.find('.cycle-warning-stub').exists()).toBe(true);
    expect(wrapper.find('.cycle-warning-stub').text()).toContain('Referência Cíclica Prevenida');
  });

  it('exibe botões Anotar e Flashcard quando um texto é selecionado no nó de nota', async () => {
    const originalGetSelection = window.getSelection;
    window.getSelection = () => ({
      toString: () => 'Trecho selecionado no nó',
    } as any);

    const node: CanvasNode = {
      id: 'node-note-selection',
      type: 'note_embed',
      x: 30,
      y: 30,
      width: 300,
      height: 200,
      noteId: 'note-sel-1',
      noteTitle: 'Minha Nota',
      noteContent: 'Texto de estudo selecionável.',
    };

    const wrapper = mount(CanvasNodeNote, {
      props: { node },
      global: {
        stubs: {
          NuxtLink: true,
          AiMarkdown: true,
          CycleWarningPlaceholder: true,
          ReaderAnnotationModal: {
            name: 'ReaderAnnotationModal',
            props: ['isOpen', 'initialText', 'initialWantNote', 'initialWantFlashcard'],
            template: '<div class="annotation-modal-stub" v-if="isOpen">Modal Aberto</div>',
          },
        },
      },
    });

    const proseContainer = wrapper.find('.prose');
    await proseContainer.trigger('mouseup');

    // Botões devem estar visíveis
    expect(wrapper.text()).toContain('Anotar');
    expect(wrapper.text()).toContain('Flashcard');

    // Clica no botão Anotar
    const annotateBtn = wrapper.findAll('button').find((b) => b.text().includes('Anotar'));
    await annotateBtn?.trigger('mousedown');

    const modalStub = wrapper.findComponent({ name: 'ReaderAnnotationModal' });
    expect(modalStub.props('isOpen')).toBe(true);
    expect(modalStub.props('initialText')).toBe('Trecho selecionado no nó');
    expect(modalStub.props('initialWantNote')).toBe(true);
    expect(modalStub.props('initialWantFlashcard')).toBe(false);

    window.getSelection = originalGetSelection;
  });
});
