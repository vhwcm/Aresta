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
const mockIsPenOnlyMode = ref(false);
const mockTogglePenOnlyMode = vi.fn(() => {
  mockIsPenOnlyMode.value = !mockIsPenOnlyMode.value;
});
const mockSetPenOnlyMode = vi.fn((val: boolean) => {
  mockIsPenOnlyMode.value = val;
});

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
    isPenOnlyMode: mockIsPenOnlyMode,
    setPenOnlyMode: mockSetPenOnlyMode,
    togglePenOnlyMode: mockTogglePenOnlyMode,
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

  it('não cria página indevida durante o carregamento inicial (mount) no mobile e ancora na página 1 com justify-start', async () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });

    mockAddPage.mockClear();

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const viewport = wrapper.find('main');
    const el = viewport.element as HTMLElement;

    // Dispara scroll durante a inicialização (antes dos 300ms de estabilização)
    Object.defineProperty(el, 'scrollLeft', { writable: true, configurable: true, value: 100 });
    Object.defineProperty(el, 'clientWidth', { writable: true, configurable: true, value: 390 });
    Object.defineProperty(el, 'scrollWidth', { writable: true, configurable: true, value: 780 });

    await viewport.trigger('scroll');

    // Não deve criar página durante o carregamento
    expect(mockAddPage).not.toHaveBeenCalled();

    // Container pai deve ter justify-start para rolagem natural a partir da página 1
    const track = wrapper.find('.page-slide').element.parentElement as HTMLElement;
    expect(track.className).toContain('justify-start');

    // Trailing slide deve exibir "Nova página" em repouso
    const trailingSlide = wrapper.find('.w-screen.md\\:hidden');
    expect(trailingSlide.text()).toContain('Nova página');
    expect(trailingSlide.text()).not.toContain('Criando nova página...');

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
  });

  it('chama addPage automaticamente ao rolar até o final da trilha no mobile após estabilização', async () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    mockAddPage.mockClear();

    // Aguarda o tempo de estabilização (300ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

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

  it('permite adicionar nova página ao tocar no trailing slide', async () => {
    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    mockAddPage.mockClear();

    const trailingSlide = wrapper.find('.w-screen.md\\:hidden');
    expect(trailingSlide.exists()).toBe(true);

    await trailingSlide.trigger('click');

    expect(mockAddPage).toHaveBeenCalledWith('blank');
  });

  it('configura alinhamento no topo com a toolbar 100% de largura colada no header e slides em telas horizontais', () => {
    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const track = wrapper.find('.page-slide').element.parentElement as HTMLElement;
    expect(track.className).toContain('md:pt-8');
    expect(track.className).toContain('landscape:pt-8');
    expect(track.className).toContain('md:items-start');
    expect(track.className).toContain('landscape:items-start');
    expect(track.className).toContain('md:my-0');
    expect(track.className).toContain('landscape:my-0');

    const slide = wrapper.find('.page-slide');
    expect(slide.classes()).toContain('md:justify-start');
    expect(slide.classes()).toContain('landscape:justify-start');

    // A DrawingToolbar fica colada imediatamente abaixo do header ocupando 100% de largura
    const toolbar = wrapper.find('.drawing-toolbar-stub');
    expect(toolbar.exists()).toBe(true);
  });

  it('calcula a escala em telas horizontais com folha colada no topo e respiro inferior', async () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    // Simula tela desktop 1920x1080 (horizontal)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const zoomFitBtn = wrapper.find('button[aria-label="Ajustar à tela"]');
    await zoomFitBtn.trigger('click');

    // availableHeight = 1080 - 104 = 976
    // scaleH = 976 / 1123 = 0.8691 -> 87%
    // availableWidth = 1920 - 240 = 1680
    // scaleW = 1680 / 794 = 2.115
    // fit = Math.min(2.115, 0.8691) = 0.87 -> 87%
    expect(zoomFitBtn.text()).toBe('87%');

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
  });

  it('calcula padding lateral e gap dinâmico para garantir folha única no centro e espreita no canto em telas horizontais', async () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });

    // Configura 2 páginas no desenho mock
    mockDrawing.value.pages = [
      { id: 'page-1', pageNumber: 1, width: 794, height: 1123, backgroundType: 'blank', strokes: [], nodes: [], edges: [] },
      { id: 'page-2', pageNumber: 2, width: 794, height: 1123, backgroundType: 'blank', strokes: [], nodes: [], edges: [] },
    ];

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    await wrapper.vm.$nextTick();

    const track = wrapper.find('.page-slide').element.parentElement as HTMLElement;
    expect(track.style.paddingLeft).toBeTruthy();
    expect(track.style.paddingRight).toBeTruthy();
    expect(track.style.columnGap).toBeTruthy();

    const paddingLeftNum = parseInt(track.style.paddingLeft, 10);
    const gapNum = parseInt(track.style.columnGap, 10);

    // O gap deve ser exatamente o paddingLeft menos a margem de peeking (~76px)
    expect(paddingLeftNum).toBeGreaterThan(300);
    expect(paddingLeftNum - gapNum).toBeCloseTo(76, -1);

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
  });

  it('exibe overlay de foco por clique apenas nas folhas inativas em telas horizontais e transfere o foco ao clicar', async () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });

    mockDrawing.value.pages = [
      { id: 'page-1', pageNumber: 1, width: 794, height: 1123, backgroundType: 'blank', strokes: [], nodes: [], edges: [] },
      { id: 'page-2', pageNumber: 2, width: 794, height: 1123, backgroundType: 'blank', strokes: [], nodes: [], edges: [] },
    ];

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    await wrapper.vm.$nextTick();

    const slides = wrapper.findAll('.page-slide');
    expect(slides.length).toBe(2);

    // Página 0 é ativa inicialmente; não deve ter overlay clicável
    const page0Overlay = slides[0]!.find('.page-focus-overlay');
    expect(page0Overlay.exists()).toBe(false);

    // Página 1 é inativa no canto; deve ter overlay clicável
    const page1Overlay = slides[1]!.find('.page-focus-overlay');
    expect(page1Overlay.exists()).toBe(true);

    // Clica na página inativa para transferir o foco
    await page1Overlay.trigger('click');
    await wrapper.vm.$nextTick();

    // Após o clique, a página 1 torna-se ativa e a página 0 recebe o overlay
    expect(slides[1]!.find('.page-focus-overlay').exists()).toBe(false);
    expect(slides[0]!.find('.page-focus-overlay').exists()).toBe(true);

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
  });

  it('exibe o botão do Modo Caneta no cabeçalho e alterna o estado ao clicar', async () => {
    mockIsPenOnlyMode.value = false;

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const penModeBtn = wrapper.find('button[aria-label="Alternar Modo Caneta"]');
    expect(penModeBtn.exists()).toBe(true);
    expect(penModeBtn.attributes('title')).toContain('Modo Caneta Inativo');

    await penModeBtn.trigger('click');
    expect(mockTogglePenOnlyMode).toHaveBeenCalled();

    mockIsPenOnlyMode.value = true;
    await wrapper.vm.$nextTick();
    expect(penModeBtn.attributes('title')).toContain('Modo Caneta Ativo');
  });

  it('desloca a viewport com 1 dedo quando o Modo Caneta está ativo', async () => {
    mockIsPenOnlyMode.value = true;

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const viewport = wrapper.find('main');
    expect(viewport.exists()).toBe(true);

    const viewportEl = viewport.element as HTMLElement;
    viewportEl.scrollLeft = 100;
    viewportEl.scrollTop = 50;

    // Dispara touchstart com 1 dedo
    const touchStartEvent = new Event('touchstart') as any;
    touchStartEvent.touches = [{ clientX: 200, clientY: 200 }];
    viewportEl.dispatchEvent(touchStartEvent);

    // Dispara touchmove com 1 dedo movendo 50px para a esquerda e 30px para cima
    const touchMoveEvent = new Event('touchmove', { cancelable: true }) as any;
    touchMoveEvent.touches = [{ clientX: 150, clientY: 170 }];
    touchMoveEvent.preventDefault = vi.fn();
    viewportEl.dispatchEvent(touchMoveEvent);

    expect(viewportEl.scrollLeft).toBe(150); // 100 - (150 - 200) = 100 - (-50) = 150
    expect(viewportEl.scrollTop).toBe(80);   // 50 - (170 - 200) = 50 - (-30) = 80
  });

  it('executa pan e zoom focal com 2 dedos suspendendo scroll snap', async () => {
    mockIsPenOnlyMode.value = false;

    const wrapper = mount(DrawingPage, {
      global: { stubs },
    });

    const viewport = wrapper.find('main');
    const viewportEl = viewport.element as HTMLElement;
    viewportEl.scrollLeft = 0;
    viewportEl.scrollTop = 0;
    viewportEl.getBoundingClientRect = vi.fn().mockReturnValue({ left: 0, top: 0, width: 400, height: 800 });

    // Inicia toque de 2 dedos (distância inicial: 100px, centro: 200, 200)
    const touchStartEvent = new Event('touchstart') as any;
    touchStartEvent.touches = [
      { clientX: 150, clientY: 200 },
      { clientX: 250, clientY: 200 },
    ];
    viewportEl.dispatchEvent(touchStartEvent);

    await wrapper.vm.$nextTick();
    // Durante a interação, o snap deve estar desativado
    expect(viewport.classes()).toContain('snap-none');

    // Move os 2 dedos afastando-os (pinch out: distância 200px -> dobra o zoom)
    const touchMoveEvent = new Event('touchmove', { cancelable: true }) as any;
    touchMoveEvent.touches = [
      { clientX: 100, clientY: 200 },
      { clientX: 300, clientY: 200 },
    ];
    touchMoveEvent.preventDefault = vi.fn();
    viewportEl.dispatchEvent(touchMoveEvent);

    await wrapper.vm.$nextTick();
    expect(touchMoveEvent.preventDefault).toHaveBeenCalled();

    // Finaliza gesto
    const touchEndEvent = new Event('touchend') as any;
    touchEndEvent.touches = [];
    viewportEl.dispatchEvent(touchEndEvent);
  });
});

