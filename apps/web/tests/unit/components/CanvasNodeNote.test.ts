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
});
