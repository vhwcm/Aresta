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
});
