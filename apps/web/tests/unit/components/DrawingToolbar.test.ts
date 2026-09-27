import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DrawingToolbar from '~/components/canvas/drawing/DrawingToolbar.vue';

describe('DrawingToolbar Component', () => {
  it('renders drawing tools, shapes, colors and size slider without zoom or undo/redo buttons', () => {
    const wrapper = mount(DrawingToolbar, {
      props: {
        tool: 'pen',
        selectedShapeType: 'rectangle',
        color: '#18181B',
        size: 3,
      },
    });

    expect(wrapper.find('button[title*="Caneta"]').exists()).toBe(true);
    expect(wrapper.find('button[title*="Borracha"]').exists()).toBe(true);
    expect(wrapper.find('button[title*="Selecionar"]').exists()).toBe(true);
    expect(wrapper.find('button[title*="Marcador"]').exists()).toBe(true);

    // Zoom and Undo/Redo must NOT exist in the toolbar
    expect(wrapper.find('button[title*="Desfazer"]').exists()).toBe(false);
    expect(wrapper.find('button[title*="Refazer"]').exists()).toBe(false);
    expect(wrapper.find('button[title*="Zoom"]').exists()).toBe(false);
    expect(wrapper.find('button[title*="Ajustar"]').exists()).toBe(false);
  });

  it('emits tool change when tool button is clicked', async () => {
    const wrapper = mount(DrawingToolbar, {
      props: {
        tool: 'pen',
        selectedShapeType: 'rectangle',
        color: '#18181B',
        size: 3,
      },
    });

    const eraserButton = wrapper.find('button[title*="Borracha"]');
    await eraserButton.trigger('click');
    expect(wrapper.emitted('update:tool')?.[0]).toEqual(['eraser']);
  });

  it('renderiza o botão de Modo Caneta e emite update:penMode ao clicar', async () => {
    const wrapper = mount(DrawingToolbar, {
      props: {
        tool: 'pen',
        color: '#18181B',
        size: 3,
        penMode: false,
      },
    });

    const penModeBtn = wrapper.find('button[aria-label="Modo Caneta"]');
    expect(penModeBtn.exists()).toBe(true);
    expect(penModeBtn.attributes('title')).toContain('Modo Caneta Desativado');

    await penModeBtn.trigger('click');
    expect(wrapper.emitted('update:penMode')?.[0]).toEqual([true]);

    // Quando ativo
    await wrapper.setProps({ penMode: true });
    expect(penModeBtn.attributes('title')).toContain('Modo Caneta Ativado');
  });
});
