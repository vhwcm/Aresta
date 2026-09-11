import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasNode from '../../../app/components/canvas/CanvasNode.vue';
import type { CanvasNode as ICanvasNode } from '../../../app/interfaces/canvas';

describe('CanvasNode Component', () => {
  it('exibe o botão Criar Nota na mini toolbar quando nó de texto está selecionado', async () => {
    const node: ICanvasNode = {
      id: 'node-text-1',
      type: 'text',
      x: 100,
      y: 100,
      width: 260,
      height: 160,
      text: 'Ideia de arquitetura',
      color: '#E57B55',
    };

    const wrapper = mount(CanvasNode, {
      props: {
        node,
        isSelected: true,
        zoom: 1,
      },
      global: {
        stubs: {
          CanvasNodeText: {
            template: '<div class="stub-text">Texto</div>',
          },
          CanvasNodeShape: true,
          CanvasNodeBook: true,
          CanvasNodeNote: true,
        },
      },
    });

    const createNoteButton = wrapper.findAll('button').find((b) => b.attributes('title')?.includes('Salvar como Nota'));
    expect(createNoteButton).toBeDefined();
    expect(createNoteButton?.text()).toContain('Criar Nota');

    await createNoteButton?.trigger('click');
    expect(wrapper.emitted('convert-to-note')).toBeTruthy();
    expect(wrapper.emitted('convert-to-note')?.[0]).toEqual(['node-text-1']);
  });

  it('não inicia drag-start quando pointerdown ocorre dentro de um textarea', async () => {
    const node: ICanvasNode = {
      id: 'node-text-2',
      type: 'loose_text',
      x: 50,
      y: 50,
      width: 280,
      height: 60,
      text: 'Texto Livre',
    };

    const wrapper = mount(CanvasNode, {
      props: {
        node,
        isSelected: false,
        zoom: 1,
      },
      global: {
        stubs: {
          CanvasNodeText: {
            template: '<div><textarea class="inner-textarea">Texto Livre</textarea></div>',
          },
          CanvasNodeShape: true,
          CanvasNodeBook: true,
          CanvasNodeNote: true,
        },
      },
    });

    const textarea = wrapper.find('.inner-textarea');
    expect(textarea.exists()).toBe(true);

    await textarea.trigger('pointerdown');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('drag-start')).toBeFalsy();
  });

  it('inicia drag-start quando pointerdown ocorre no corpo de um bloco de anotações', async () => {
    const node: ICanvasNode = {
      id: 'node-text-3',
      type: 'text',
      x: 100,
      y: 100,
      width: 260,
      height: 160,
      text: 'Texto de anotação no corpo',
      color: '#E57B55',
    };

    const wrapper = mount(CanvasNode, {
      props: {
        node,
        isSelected: false,
        zoom: 1,
      },
      global: {
        stubs: {
          CanvasNodeText: {
            template: '<div class="body-content"><p class="inner-text">Texto de anotação no corpo</p></div>',
          },
          CanvasNodeShape: true,
          CanvasNodeBook: true,
          CanvasNodeNote: true,
        },
      },
    });

    const innerText = wrapper.find('.inner-text');
    expect(innerText.exists()).toBe(true);

    await innerText.trigger('pointerdown');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('drag-start')).toBeTruthy();
    expect(wrapper.emitted('drag-start')?.[0]?.[0]).toBe('node-text-3');
  });

  it('não inicia drag-start quando pointerdown ocorre dentro de um link', async () => {
    const node: ICanvasNode = {
      id: 'node-note-4',
      type: 'note_embed',
      x: 100,
      y: 100,
      width: 260,
      height: 160,
    };

    const wrapper = mount(CanvasNode, {
      props: {
        node,
        isSelected: false,
        zoom: 1,
      },
      global: {
        stubs: {
          CanvasNodeText: true,
          CanvasNodeShape: true,
          CanvasNodeBook: true,
          CanvasNodeNote: {
            template: '<div><a href="/notes" class="inner-link">Abrir</a></div>',
          },
        },
      },
    });

    const link = wrapper.find('.inner-link');
    expect(link.exists()).toBe(true);

    await link.trigger('pointerdown');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('drag-start')).toBeFalsy();
  });

  it('permite drag-start mesmo ao clicar em conteúdo com isMultiSelect ativo', async () => {
    const node: ICanvasNode = {
      id: 'node-text-multi',
      type: 'text',
      x: 100,
      y: 100,
      width: 260,
      height: 160,
      text: 'Texto de anotação no corpo',
      color: '#E57B55',
    };

    const wrapper = mount(CanvasNode, {
      props: {
        node,
        isSelected: true,
        isMultiSelect: true,
        zoom: 1,
      },
      global: {
        stubs: {
          CanvasNodeText: {
            template: '<div class="body-content"><div class="ProseMirror">Texto</div></div>',
          },
          CanvasNodeShape: true,
          CanvasNodeBook: true,
          CanvasNodeNote: true,
        },
      },
    });

    const editorEl = wrapper.find('.ProseMirror');
    expect(editorEl.exists()).toBe(true);

    await editorEl.trigger('pointerdown');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('drag-start')).toBeTruthy();
  });

  it('oculta mini toolbar flutuante individual e resize handles quando isMultiSelect é verdadeiro', () => {
    const node: ICanvasNode = {
      id: 'node-text-toolbar-multi',
      type: 'text',
      x: 100,
      y: 100,
      width: 260,
      height: 160,
      text: 'Nota multi selecionada',
    };

    const wrapper = mount(CanvasNode, {
      props: {
        node,
        isSelected: true,
        isMultiSelect: true,
        zoom: 1,
      },
      global: {
        stubs: {
          CanvasNodeText: true,
          CanvasNodeShape: true,
          CanvasNodeBook: true,
          CanvasNodeNote: true,
        },
      },
    });

    // Resize handles e mini toolbar não devem existir em multi-seleção
    expect(wrapper.find('.resize-handle').exists()).toBe(false);
    const createNoteButton = wrapper.findAll('button').find((b) => b.attributes('title')?.includes('Salvar como Nota'));
    expect(createNoteButton).toBeUndefined();
  });
});
