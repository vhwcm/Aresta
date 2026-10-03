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

  it('renderiza exatamente 2 slots de cor e seleciona slot inativo ao clicar', async () => {
    const wrapper = mount(DrawingToolbar, {
      props: {
        tool: 'pen',
        color: '#18181B',
        size: 3,
      },
    });

    const slot1 = wrapper.find('button[data-testid="color-slot-1"]');
    const slot2 = wrapper.find('button[data-testid="color-slot-2"]');

    expect(slot1.exists()).toBe(true);
    expect(slot2.exists()).toBe(true);

    // O popover de todas as cores não deve estar visível inicialmente
    expect(wrapper.find('[data-testid="color-palette-popover"]').exists()).toBe(false);

    // Clicar no slot 2 (inativo) deve selecionar a cor do slot 2
    await slot2.trigger('click');
    expect(wrapper.emitted('update:color')?.[0]).toEqual(['#E57B55']);
    // Não deve ter aberto o popover no 1º clique em slot inativo
    expect(wrapper.find('[data-testid="color-palette-popover"]').exists()).toBe(false);
  });

  it('abre o seletor com todas as cores em blocos ao clicar no slot que já está selecionado', async () => {
    const wrapper = mount(DrawingToolbar, {
      props: {
        tool: 'pen',
        color: '#18181B',
        size: 3,
      },
    });

    const slot1 = wrapper.find('button[data-testid="color-slot-1"]');

    // Slot 1 já está selecionado (ativo). Clicar nele abre o seletor de paleta dividida em blocos
    await slot1.trigger('click');

    const popover = wrapper.find('[data-testid="color-palette-popover"]');
    expect(popover.exists()).toBe(true);
    expect(popover.text()).toContain('Neutros & Grafites');
    expect(popover.text()).toContain('Aresta & Quentes');
    expect(popover.text()).toContain('Frios & Azuis');
    expect(popover.text()).toContain('Naturais & Verdes');

    // Selecionar uma cor na paleta (ex: #10B981)
    const emeraldBtn = popover.find('button[title*="#10B981"]');
    expect(emeraldBtn.exists()).toBe(true);

    await emeraldBtn.trigger('click');
    expect(wrapper.emitted('update:color')).toBeTruthy();
    expect(wrapper.emitted('update:color')?.slice(-1)[0]).toEqual(['#10B981']);

    // O popover deve fechar após selecionar a cor
    expect(wrapper.find('[data-testid="color-palette-popover"]').exists()).toBe(false);
  });
});
