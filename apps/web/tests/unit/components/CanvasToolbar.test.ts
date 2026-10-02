import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasToolbar from '../../../app/components/canvas/CanvasToolbar.vue';

const mockToggleCollapse = vi.fn();

vi.mock('../../../app/composables/useBottomNavbar', () => ({
  useBottomNavbar: () => ({
    toggleCollapse: mockToggleCollapse,
    isNavbarCollapsed: { value: true },
    isEcosystemOpen: { value: false },
  }),
}));

describe('CanvasToolbar component', () => {
  const defaultProps = {
    activeTool: 'select',
    selectedShapeType: 'rectangle' as const,
    canUndo: true,
    canRedo: false,
    zoom: 0.84,
    isSaving: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os itens de ferramentas e o ícone da navbar na posição central', () => {
    const wrapper = mount(CanvasToolbar, {
      props: defaultProps,
      global: {
        stubs: {
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' },
        },
      },
    });

    // Ícone da navbar na posição de meio
    const navbarBtn = wrapper.find('button[title="Menu Principal Aresta (Expandir Barra de Navegação)"]');
    expect(navbarBtn.exists()).toBe(true);

    // Botão de 3 pontinhos
    const moreBtn = wrapper.find('button[title="Mais opções (Zoom & Exportar)"]');
    expect(moreBtn.exists()).toBe(true);
  });

  it('chama toggleNavbar ao clicar no ícone central da navbar', async () => {
    const wrapper = mount(CanvasToolbar, {
      props: defaultProps,
      global: {
        stubs: {
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' },
        },
      },
    });

    const navbarBtn = wrapper.find('button[title="Menu Principal Aresta (Expandir Barra de Navegação)"]');
    await navbarBtn.trigger('click');

    expect(mockToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('abre popover de 3 pontinhos com zoom e exportar ao clicar', async () => {
    const wrapper = mount(CanvasToolbar, {
      props: defaultProps,
      global: {
        stubs: {
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' },
        },
      },
    });

    const moreBtn = wrapper.find('button[title="Mais opções (Zoom & Exportar)"]');
    await moreBtn.trigger('click');

    // Deve exibir porcentagem de zoom 84%
    expect(wrapper.text()).toContain('84%');
    expect(wrapper.text()).toContain('Exportar (.canvas)');

    // Testa zoom-in
    const zoomInBtn = wrapper.find('button[title="Aumentar Zoom (+)"]');
    await zoomInBtn.trigger('click');
    expect(wrapper.emitted('zoom-in')).toBeTruthy();

    // Testa export
    const exportBtn = wrapper.find('button[title="Exportar JSON Canvas (.canvas)"]');
    await exportBtn.trigger('click');
    expect(wrapper.emitted('export')).toBeTruthy();
  });

  it('abre popover de formas geométricas e emite update:selectedShapeType ao selecionar', async () => {
    const wrapper = mount(CanvasToolbar, {
      props: defaultProps,
      global: {
        stubs: {
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' },
        },
      },
    });

    const shapesBtn = wrapper.find('button[title="Formas Geométricas (S)"]');
    expect(shapesBtn.exists()).toBe(true);

    // Abre popover de formas
    await shapesBtn.trigger('click');
    expect(wrapper.emitted('update:activeTool')?.[0]).toEqual(['shape']);

    // Verifica se os botões de formas estão visíveis
    const circleBtn = wrapper.find('button[title="Círculo / Elipse"]');
    const diamondBtn = wrapper.find('button[title="Losango"]');
    const starBtn = wrapper.find('button[title="Estrela"]');
    expect(circleBtn.exists()).toBe(true);
    expect(diamondBtn.exists()).toBe(true);
    expect(starBtn.exists()).toBe(true);

    // Seleciona estrela
    await starBtn.trigger('click');
    expect(wrapper.emitted('update:selectedShapeType')?.[0]).toEqual(['star']);
  });

  it('ativa ferramenta caneta e borracha ao clicar nos botões correspondentes', async () => {
    const wrapper = mount(CanvasToolbar, {
      props: defaultProps,
      global: {
        stubs: {
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' },
        },
      },
    });

    // Botão de Caneta
    const penBtn = wrapper.find('button[title*="Caneta (P)"]');
    expect(penBtn.exists()).toBe(true);
    await penBtn.trigger('click');
    expect(wrapper.emitted('update:activeTool')?.[0]).toEqual(['pen']);

    // Botão de Borracha
    const eraserBtn = wrapper.find('button[title*="Borracha (E)"]');
    expect(eraserBtn.exists()).toBe(true);
    await eraserBtn.trigger('click');
    expect(wrapper.emitted('update:activeTool')?.[1]).toEqual(['eraser']);
  });

  it('abre popover de opções de caneta e emite alteração de cor e espessura', async () => {
    const wrapper = mount(CanvasToolbar, {
      props: {
        ...defaultProps,
        activeTool: 'pen',
        penColor: '#E57B55',
        penWidth: 3,
      },
      global: {
        stubs: {
          ArestaLogoGraph: { template: '<div class="aresta-logo-mock" />' },
        },
      },
    });

    const penBtn = wrapper.find('button[title*="Caneta (P)"]');
    await penBtn.trigger('click');

    // Verifica se os botões de cores aparecem
    const blueColorBtn = wrapper.find('button[title="Cor: #3B82F6"]');
    expect(blueColorBtn.exists()).toBe(true);
    await blueColorBtn.trigger('click');
    expect(wrapper.emitted('update:penColor')?.[0]).toEqual(['#3B82F6']);
  });
});
