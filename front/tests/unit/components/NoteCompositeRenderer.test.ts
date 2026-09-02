import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NoteCompositeRenderer from '../../../app/components/notes/NoteCompositeRenderer.vue';

describe('NoteCompositeRenderer Component', () => {
  it('renderiza texto markdown comum', () => {
    const wrapper = mount(NoteCompositeRenderer, {
      props: {
        content: '# Título da Nota\n\nEste é um parágrafo normal.',
      },
      global: {
        stubs: {
          AiMarkdown: {
            template: '<div class="stub-markdown">{{ content }}</div>',
            props: ['content'],
          },
          CanvasEmbedPreview: true,
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Título da Nota');
    expect(wrapper.find('.stub-markdown').exists()).toBe(true);
  });

  it('detecta e divide chunks compostos com ![[canvas:id]] e ![[book:id]]', () => {
    const wrapper = mount(NoteCompositeRenderer, {
      props: {
        content: 'Primeira seção\n\n![[canvas:canvas-uuid-1]]\n\n![[book:42]]\n\nConclusão final.',
      },
      global: {
        stubs: {
          AiMarkdown: {
            template: '<div class="stub-markdown">{{ content }}</div>',
            props: ['content'],
          },
          CanvasEmbedPreview: {
            template: '<div class="stub-canvas" :data-id="canvasId">Canvas {{ canvasId }}</div>',
            props: ['canvasId'],
          },
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.find('.stub-canvas').exists()).toBe(true);
    expect(wrapper.text()).toContain('Livro #42');
    expect(wrapper.text()).toContain('Primeira seção');
    expect(wrapper.text()).toContain('Conclusão final');
  });
});
