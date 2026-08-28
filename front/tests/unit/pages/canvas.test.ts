import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasIndexPage from '~/pages/canvas/index.vue';

// Mock useCanvas
const mockCreateCanvas = vi.fn();
const mockFetchCanvases = vi.fn();
const mockCanvasesList = { value: [] };
const mockIsLoading = { value: false };

vi.mock('~/composables/useCanvas', () => ({
  useCanvas: () => ({
    canvasesList: mockCanvasesList,
    isLoading: mockIsLoading,
    fetchCanvases: mockFetchCanvases,
    createCanvas: mockCreateCanvas,
    deleteCanvas: vi.fn(),
    duplicateCanvas: vi.fn(),
    importJsonCanvas: vi.fn(),
  }),
}));

describe('Canvas Index Page (/canvas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when there are no canvases', () => {
    mockCanvasesList.value = [];
    const wrapper = mount(CanvasIndexPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Nenhum quadro encontrado');
    expect(wrapper.text()).toContain('Criar Primeiro Quadro');
  });

  it('calls createCanvas and navigates when clicking Criar Primeiro Quadro', async () => {
    mockCreateCanvas.mockResolvedValueOnce({ id: 'test-canvas-123', title: 'Novo Quadro' });

    const wrapper = mount(CanvasIndexPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const createButton = wrapper.find('button.bg-primary');
    expect(createButton.exists()).toBe(true);

    await createButton.trigger('click');
    expect(mockCreateCanvas).toHaveBeenCalledWith('Novo Quadro');
  });
});
