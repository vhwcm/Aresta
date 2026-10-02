import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CanvasBoard from '../../../app/components/canvas/CanvasBoard.vue';

const mockPanBy = vi.fn();
const mockZoomAt = vi.fn();
const mockAddNode = vi.fn();
const mockUpdateNode = vi.fn();
const mockPushHistory = vi.fn();
const mockAddStroke = vi.fn();
const mockEraseStrokesAt = vi.fn();

const mockNodes = ref<any[]>([]);
const mockSelectedNodeIds = ref<string[]>([]);
const mockStrokes = ref<any[]>([]);
const mockActiveTool = ref<string>('select');

vi.mock('../../../app/composables/useCanvas', () => ({
  useCanvas: () => ({
    nodes: mockNodes,
    edges: ref([]),
    strokes: mockStrokes,
    viewport: ref({ x: 0, y: 0, zoom: 1 }),
    selectedNodeIds: mockSelectedNodeIds,
    selectedEdgeId: ref(null),
    activeTool: mockActiveTool,
    activePenColor: ref('#E57B55'),
    activePenWidth: ref(3),
    selectedShapeType: ref('rectangle'),
    connectingState: ref(null),
    isSaving: ref(false),
    canUndo: ref(false),
    canRedo: ref(false),
    pushHistory: mockPushHistory,
    addNode: mockAddNode,
    updateNode: mockUpdateNode,
    removeNode: vi.fn(),
    removeSelected: vi.fn(),
    addEdge: vi.fn(),
    addStroke: mockAddStroke,
    eraseStrokesAt: mockEraseStrokesAt,
    clearAllStrokes: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    panBy: mockPanBy,
    zoomAt: mockZoomAt,
    resetViewport: vi.fn(),
    loadCanvas: vi.fn(),
    exportAsJsonCanvas: vi.fn(),
  }),
}));

vi.mock('../../../app/composables/useNotes', () => ({
  useNotes: () => ({
    createNote: vi.fn(),
  }),
}));

describe('CanvasBoard Interaction (Desktop 2-finger Pan vs Click+Wheel Zoom)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNodes.value = [];
    mockSelectedNodeIds.value = [];
    mockStrokes.value = [];
    mockActiveTool.value = 'select';
  });

  it('dois dedos apenas (wheel sem clique e sem ctrl) move a tela via panBy', async () => {
    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');
    expect(board.exists()).toBe(true);

    // Evento wheel com 2 dedos no trackpad: sem botão pressionado, sem ctrlKey
    await board.trigger('wheel', {
      deltaX: 15,
      deltaY: 25,
      buttons: 0,
      ctrlKey: false,
      metaKey: false,
      clientX: 200,
      clientY: 300,
    });

    expect(mockPanBy).toHaveBeenCalledWith(-15, -25);
    expect(mockZoomAt).not.toHaveBeenCalled();
  });

  it('clicar mais dois dedos (buttons !== 0) dá zoom e deszoom via zoomAt', async () => {
    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');

    // Evento wheel enquanto o trackpad/mouse está clicado (buttons: 1)
    await board.trigger('wheel', {
      deltaX: 0,
      deltaY: -50,
      buttons: 1,
      ctrlKey: false,
      metaKey: false,
      clientX: 300,
      clientY: 400,
    });

    expect(mockZoomAt).toHaveBeenCalledWith(300, 400, 1.08);
    expect(mockPanBy).not.toHaveBeenCalled();
  });

  it('pinch ou Ctrl+wheel com dois dedos dá zoom e deszoom via zoomAt', async () => {
    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');

    // Evento wheel com gesto de pinch do trackpad (ctrlKey: true)
    await board.trigger('wheel', {
      deltaX: 0,
      deltaY: 40,
      buttons: 0,
      ctrlKey: true,
      metaKey: false,
      clientX: 150,
      clientY: 250,
    });

    expect(mockZoomAt).toHaveBeenCalledWith(150, 250, 0.92);
    expect(mockPanBy).not.toHaveBeenCalled();
  });
});

describe('CanvasBoard Multi-selection Move and Drag Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNodes.value = [];
    mockSelectedNodeIds.value = [];
  });

  it('arrasta e move múltiplos itens selecionados simultaneamente', async () => {
    mockNodes.value = [
      { id: 'node-1', x: 50, y: 50, width: 100, height: 80 },
      { id: 'node-2', x: 200, y: 150, width: 100, height: 80 },
    ];
    mockSelectedNodeIds.value = ['node-1', 'node-2'];

    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: {
            props: ['node', 'isSelected', 'isMultiSelect'],
            template: '<div class="stub-node" :data-id="node.id" @pointerdown.stop="$emit(\'select\', node.id, false, $event); $emit(\'drag-start\', node.id, $event)"></div>',
          },
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');
    const firstNode = wrapper.find('.stub-node[data-id="node-1"]');

    // 1. Pointerdown no primeiro nó selecionado
    await firstNode.trigger('pointerdown', {
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });

    expect(mockPushHistory).toHaveBeenCalled();

    // 2. Pointermove arrastando por dx = 30, dy = 40
    await board.trigger('pointermove', {
      clientX: 80,
      clientY: 90,
      pointerId: 1,
    });

    expect(mockUpdateNode).toHaveBeenCalledWith('node-1', { x: 80, y: 90 });
    expect(mockUpdateNode).toHaveBeenCalledWith('node-2', { x: 230, y: 190 });

    // 3. Pointerup finaliza mantendo a multi-seleção
    await board.trigger('pointerup', {
      clientX: 80,
      clientY: 90,
      pointerId: 1,
    });

    expect(mockSelectedNodeIds.value).toEqual(['node-1', 'node-2']);
  });

  it('ao clicar sem arrastar em um nó já selecionado, isola a seleção apenas nele no pointerup', async () => {
    mockNodes.value = [
      { id: 'node-1', x: 50, y: 50, width: 100, height: 80 },
      { id: 'node-2', x: 200, y: 150, width: 100, height: 80 },
    ];
    mockSelectedNodeIds.value = ['node-1', 'node-2'];

    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: {
            props: ['node', 'isSelected', 'isMultiSelect'],
            template: '<div class="stub-node" :data-id="node.id" @pointerdown.stop="$emit(\'select\', node.id, false, $event); $emit(\'drag-start\', node.id, $event)"></div>',
          },
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');
    const firstNode = wrapper.find('.stub-node[data-id="node-1"]');

    // Pointerdown
    await firstNode.trigger('pointerdown', {
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });

    // Pointerup sem nenhum pointermove anterior (hasMoved = false)
    await board.trigger('pointerup', {
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });

    expect(mockSelectedNodeIds.value).toEqual(['node-1']);
  });

  it('move os nós selecionados com as setas do teclado', async () => {
    mockNodes.value = [
      { id: 'node-1', x: 100, y: 100, width: 100, height: 80 },
      { id: 'node-2', x: 200, y: 200, width: 100, height: 80 },
    ];
    mockSelectedNodeIds.value = ['node-1', 'node-2'];

    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');

    // Seta para a direita (dx = +2)
    await board.trigger('keydown', { key: 'ArrowRight' });
    expect(mockUpdateNode).toHaveBeenCalledWith('node-1', { x: 102, y: 100 });
    expect(mockUpdateNode).toHaveBeenCalledWith('node-2', { x: 202, y: 200 });

    // Seta para cima com Shift (dy = -10)
    await board.trigger('keydown', { key: 'ArrowUp', shiftKey: true });
    expect(mockUpdateNode).toHaveBeenCalledWith('node-1', { x: 100, y: 90 });
    expect(mockUpdateNode).toHaveBeenCalledWith('node-2', { x: 200, y: 190 });
  });
});

describe('CanvasBoard Double Click Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNodes.value = [];
    mockSelectedNodeIds.value = [];
  });

  it('duplo clique no fundo vazio cria uma nova nota', async () => {
    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');
    await board.trigger('dblclick', {
      clientX: 500,
      clientY: 400,
    });

    expect(mockAddNode).toHaveBeenCalledTimes(1);
    expect(mockAddNode).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text',
      })
    );
  });

  it('duplo clique com coordenadas sobre uma nota existente NÃO cria nova nota e seleciona o nó', async () => {
    mockNodes.value = [
      { id: 'node-existing', type: 'text', x: 100, y: 100, width: 260, height: 160, text: 'Nota existente' },
    ];

    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');
    // Coordenadas dentro de [100..360, 100..260]
    await board.trigger('dblclick', {
      clientX: 200,
      clientY: 180,
    });

    expect(mockAddNode).not.toHaveBeenCalled();
    expect(mockSelectedNodeIds.value).toEqual(['node-existing']);
  });

  it('duplo clique em elemento filho de .canvas-node via DOM target não cria nova nota e seleciona o nó', async () => {
    mockNodes.value = [
      { id: 'node-target', type: 'text', x: 0, y: 0, width: 260, height: 160, text: 'Nota' },
    ];

    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: {
            props: ['node'],
            template: '<div class="canvas-node" :data-node-id="node.id"><div class="inner-note">Texto</div></div>',
          },
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const innerNote = wrapper.find('.inner-note');
    expect(innerNote.exists()).toBe(true);

    await innerNote.trigger('dblclick');

    expect(mockAddNode).not.toHaveBeenCalled();
    expect(mockSelectedNodeIds.value).toEqual(['node-target']);
  });
});

describe('CanvasBoard Drawing and Eraser Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNodes.value = [];
    mockSelectedNodeIds.value = [];
    mockStrokes.value = [];
    mockActiveTool.value = 'select';
  });

  it('exibe camada de overlay de desenho quando a ferramenta é pen ou eraser', async () => {
    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    // Ferramenta select: overlay não existe
    expect(wrapper.find('.canvas-drawing-overlay').exists()).toBe(false);

    // Altera para pen
    mockActiveTool.value = 'pen';
    await wrapper.vm.$nextTick();

    const overlay = wrapper.find('.canvas-drawing-overlay');
    expect(overlay.exists()).toBe(true);
    expect(overlay.classes()).toContain('cursor-crosshair');
  });

  it('captura traço de caneta e chama addStroke ao soltar o ponteiro', async () => {
    mockActiveTool.value = 'pen';

    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const overlay = wrapper.find('.canvas-drawing-overlay');
    expect(overlay.exists()).toBe(true);

    // Inicia traço
    await overlay.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      buttons: 1,
      pointerId: 1,
    });

    // Move ponteiro
    await overlay.trigger('pointermove', {
      clientX: 120,
      clientY: 130,
      buttons: 1,
      pointerId: 1,
    });

    // Finaliza traço
    await overlay.trigger('pointerup', {
      clientX: 120,
      clientY: 130,
      pointerId: 1,
    });

    expect(mockAddStroke).toHaveBeenCalledTimes(1);
    expect(mockAddStroke).toHaveBeenCalledWith(
      expect.objectContaining({
        color: '#E57B55',
        width: 3,
        points: expect.arrayContaining([
          expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
        ]),
      })
    );
  });

  it('chama eraseStrokesAt ao desenhar/mover com a borracha ativa', async () => {
    mockActiveTool.value = 'eraser';

    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const overlay = wrapper.find('.canvas-drawing-overlay');
    expect(overlay.exists()).toBe(true);
    expect(overlay.classes()).toContain('cursor-pointer');

    // Pointer down com borracha
    await overlay.trigger('pointerdown', {
      clientX: 150,
      clientY: 150,
      buttons: 1,
      pointerId: 2,
    });

    expect(mockEraseStrokesAt).toHaveBeenCalledTimes(1);
  });

  it('permite alternar ferramentas via atalhos de teclado P (caneta) e E (borracha)', async () => {
    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasStrokeLayer: true,
          CanvasNode: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
          CanvasSelectionToolbar: true,
        },
      },
    });

    const board = wrapper.find('.canvas-board-wrapper');

    // Pressiona 'p'
    await board.trigger('keydown', { key: 'p' });
    expect(mockActiveTool.value).toBe('pen');

    // Pressiona 'e'
    await board.trigger('keydown', { key: 'e' });
    expect(mockActiveTool.value).toBe('eraser');

    // Pressiona 'v'
    await board.trigger('keydown', { key: 'v' });
    expect(mockActiveTool.value).toBe('select');
  });
});

