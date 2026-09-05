import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasEmbedPreview from '../../../app/components/canvas/CanvasEmbedPreview.vue';
import NoteCompositeRenderer from '../../../app/components/notes/NoteCompositeRenderer.vue';

vi.mock('../../../app/adapters/database/repositories/CanvasRepository', () => ({
  canvasRepo: {
    getById: vi.fn().mockImplementation((id: string) => {
      if (id === 'canvas-mock-1') {
        return Promise.resolve({
          id: 'canvas-mock-1',
          name: 'Quadro de Teste Arquitetura',
          document: {
            nodes: [
              { id: 'node-1', x: 100, y: 150, width: 200, height: 100, text: 'Conceito Central' },
            ],
            edges: [],
            viewport: { x: 50, y: 50, zoom: 1.0 },
          },
        });
      }
      return Promise.resolve(null);
    }),
  },
}));

describe('CanvasEmbedPreview Component', () => {
  it('monta CanvasEmbedPreview diretamente e exibe fallback inicial', () => {
    const wrapper = mount(CanvasEmbedPreview, {
      props: {
        canvasId: 'test-canvas-123',
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Quadro Infinito Embutido');
    expect(wrapper.find('button[title="Aumentar Zoom"]').exists()).toBe(true);
    expect(wrapper.find('button[title="Diminuir Zoom"]').exists()).toBe(true);
    expect(wrapper.find('button[title="Centralizar"]').exists()).toBe(true);
  });

  it('renderiza dados carregados do canvasRepo (offline-first)', async () => {
    const wrapper = mount(CanvasEmbedPreview, {
      props: {
        canvasId: 'canvas-mock-1',
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    // Aguarda a resolução da promise do canvasRepo
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.text()).toContain('Quadro de Teste Arquitetura');
    expect(wrapper.text()).toContain('1 nós');
    expect(wrapper.text()).toContain('Conceito Central');
  });

  it('interage com botões de zoom in, zoom out e resetView', async () => {
    const wrapper = mount(CanvasEmbedPreview, {
      props: {
        canvasId: 'test-canvas-123',
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    const zoomInBtn = wrapper.find('button[title="Aumentar Zoom"]');
    const zoomOutBtn = wrapper.find('button[title="Diminuir Zoom"]');
    const resetBtn = wrapper.find('button[title="Centralizar"]');

    await zoomInBtn.trigger('click');
    await zoomOutBtn.trigger('click');
    await resetBtn.trigger('click');
    expect(wrapper.exists()).toBe(true);
  });

  it('integra perfeitamente com NoteCompositeRenderer ao embutir ![[canvas:id]]', async () => {
    const wrapper = mount(NoteCompositeRenderer, {
      props: {
        content: '## oi\n\nolha aqui\n\n![[canvas:canvas-mock-1]]',
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.text()).toContain('oi');
    expect(wrapper.text()).toContain('olha aqui');
    expect(wrapper.text()).toContain('Quadro de Teste Arquitetura');
  });
});
