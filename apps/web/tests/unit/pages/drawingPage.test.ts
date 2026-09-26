import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import DrawingPage from '../../../app/pages/canvas/drawing/[id].vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: 'drawing-123' },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
  onBeforeRouteLeave: vi.fn(),
}));

const mockDrawing = ref<any>({
  id: 'drawing-123',
  title: 'Meu Desenho de Teste',
  pages: [
    {
      id: 'page-1',
      pageNumber: 1,
      width: 794,
      height: 1123,
      backgroundType: 'blank',
      strokes: [],
      nodes: [],
      edges: [],
    },
  ],
});

const mockAddPage = vi.fn();

vi.mock('../../../app/composables/useDrawing', () => ({
  useDrawing: () => ({
    currentDrawing: mockDrawing,
    activePageIndex: ref(0),
    activeTool: ref('pen'),
    selectedShapeType: ref('rectangle'),
    selectedNodeIds: ref([]),
    selectedEdgeId: ref(null),
    strokeColor: ref('#E57B55'),
    strokeSize: ref(3),
    isSaving: ref(false),
    isSynthesizing: ref(false),
    isLoading: ref(false),
    canUndo: ref(false),
    canRedo: ref(false),
    loadDrawing: vi.fn().mockResolvedValue(mockDrawing.value),
    addPage: mockAddPage,
    removePage: vi.fn(),
    addStrokeToActivePage: vi.fn(),
    eraseStrokesAtPoint: vi.fn(),
    addNodeToPage: vi.fn(),
    updateNodeInPage: vi.fn(),
    removeNodeFromPage: vi.fn(),
    addEdgeToPage: vi.fn(),
    removeEdgeFromPage: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    saveDrawingNow: vi.fn(),
    synthesizeDrawing: vi.fn(),
    convertToNote: vi.fn(),
  }),
}));

vi.mock('../../../app/composables/useSettings', () => ({
  useSettings: () => ({
    themeMode: ref('light'),
    toggleThemeMode: vi.fn(),
  }),
}));

describe('Drawing Page Mobile Zoom & Pinch Controls ([id].vue)', () => {
  const stubs = {
    NuxtLink: {
      template: '<a><slot /></a>',
    },
    DrawingPageCanvas: {
      template: '<div class="drawing-page-canvas-stub">Canvas Stub</div>',
    },
    DrawingToolbar: {
      template: '<div class="drawing-toolbar-stub">Toolbar Stub</div>',
    },
    DrawingAiSynthesisModal: {
      template: '<div class="drawing-modal-stub" />',
    },
  };

  it('exibe a pílula flutuante de controles de zoom com botões -, + e porcentagem', () => {
    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const zoomPill = wrapper.find('.fixed.bottom-4.right-4');
    expect(zoomPill.exists()).toBe(true);

    const zoomInBtn = wrapper.find('button[aria-label="Aumentar Zoom"]');
    const zoomOutBtn = wrapper.find('button[aria-label="Diminuir Zoom"]');
    const zoomFitBtn = wrapper.find('button[aria-label="Ajustar à tela"]');

    expect(zoomInBtn.exists()).toBe(true);
    expect(zoomOutBtn.exists()).toBe(true);
    expect(zoomFitBtn.exists()).toBe(true);
  });

  it('permite aumentar e diminuir o zoom ao clicar nos botões da pílula', async () => {
    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const zoomFitBtn = wrapper.find('button[aria-label="Ajustar à tela"]');
    const zoomInBtn = wrapper.find('button[aria-label="Aumentar Zoom"]');
    const zoomOutBtn = wrapper.find('button[aria-label="Diminuir Zoom"]');

    // Escala inicial
    const initialText = zoomFitBtn.text();

    // Clica em zoom in
    await zoomInBtn.trigger('click');
    const afterZoomInText = zoomFitBtn.text();
    expect(afterZoomInText).not.toBe(initialText);

    // Clica em zoom out duas vezes
    await zoomOutBtn.trigger('click');
    await zoomOutBtn.trigger('click');
    const afterZoomOutText = zoomFitBtn.text();
    expect(afterZoomOutText).not.toBe(afterZoomInText);
  });

  it('executa pinch-to-zoom com dois dedos no viewport e ajusta o pageScale', async () => {
    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const viewport = wrapper.find('main');
    expect(viewport.exists()).toBe(true);

    const zoomFitBtn = wrapper.find('button[aria-label="Ajustar à tela"]');
    const initialText = zoomFitBtn.text();

    // 1. Inicia gesto com 2 dedos a 100px de distância
    const touch1Start = { clientX: 100, clientY: 100 } as Touch;
    const touch2Start = { clientX: 200, clientY: 100 } as Touch;

    viewport.element.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [touch1Start, touch2Start],
        cancelable: true,
        bubbles: true,
      })
    );

    // 2. Afasta os dedos para 250px de distância (zoom in de 2.5x)
    const touch1Move = { clientX: 50, clientY: 100 } as Touch;
    const touch2Move = { clientX: 300, clientY: 100 } as Touch;

    viewport.element.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [touch1Move, touch2Move],
        cancelable: true,
        bubbles: true,
      })
    );

    // 3. Finaliza gesto
    viewport.element.dispatchEvent(
      new TouchEvent('touchend', {
        touches: [],
        cancelable: true,
        bubbles: true,
      })
    );

    await wrapper.vm.$nextTick();

    // A escala deve ter aumentado
    const afterPinchText = zoomFitBtn.text();
    expect(afterPinchText).not.toBe(initialText);
  });

  it('configura o viewport com classes snap-x e snap-mandatory para rolagem horizontal estilo Samsung Notes', () => {
    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const viewport = wrapper.find('main');
    expect(viewport.classes()).toContain('snap-x');
    expect(viewport.classes()).toContain('snap-mandatory');

    const slides = wrapper.findAll('.page-slide');
    expect(slides.length).toBeGreaterThan(0);
    expect(slides[0]!.classes()).toContain('snap-center');
  });

  it('calcula a escala no mobile para ocupar toda a largura horizontal no meio', async () => {
    // Simula viewport mobile com 390px (iPhone / Galaxy)
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const zoomFitBtn = wrapper.find('button[aria-label="Ajustar à tela"]');
    await zoomFitBtn.trigger('click');

    // 390 / 794 = 0.4912 -> ~49%
    expect(zoomFitBtn.text()).toBe('49%');

    // Restaura window.innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
  });

  it('renderiza o trailing slide de auto-criação no mobile e oculta o botão circular no mobile', () => {
    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    // O trailing slide deve existir e ser snap-center com md:hidden
    const trailingSlide = wrapper.find('.w-screen.md\\:hidden');
    expect(trailingSlide.exists()).toBe(true);
    expect(trailingSlide.classes()).toContain('snap-center');

    // O botão circular manual clássico deve ter hidden md:flex
    const desktopAddBtn = wrapper.find('.hidden.md\\:flex button');
    expect(desktopAddBtn.exists()).toBe(true);
  });

  it('chama addPage automaticamente ao rolar até o final da trilha no mobile', async () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    mockAddPage.mockClear();

    const viewport = wrapper.find('main');
    const el = viewport.element as HTMLElement;

    // Simula que rolou até o fim da trilha horizontal
    Object.defineProperty(el, 'scrollLeft', { writable: true, configurable: true, value: 800 });
    Object.defineProperty(el, 'clientWidth', { writable: true, configurable: true, value: 390 });
    Object.defineProperty(el, 'scrollWidth', { writable: true, configurable: true, value: 1190 });

    // Dispara evento de scroll no viewport
    await viewport.trigger('scroll');

    expect(mockAddPage).toHaveBeenCalledWith('blank');

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
  });
});
