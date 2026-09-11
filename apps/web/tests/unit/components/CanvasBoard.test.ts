import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CanvasBoard from '../../../app/components/canvas/CanvasBoard.vue';

const mockPanBy = vi.fn();
const mockZoomAt = vi.fn();
const mockAddNode = vi.fn();
const mockUpdateNode = vi.fn();
const mockPushHistory = vi.fn();

const mockNodes = ref<any[]>([]);
const mockSelectedNodeIds = ref<string[]>([]);

vi.mock('../../../app/composables/useCanvas', () => ({
  useCanvas: () => ({
    nodes: mockNodes,
    edges: ref([]),
    viewport: ref({ x: 0, y: 0, zoom: 1 }),
    selectedNodeIds: mockSelectedNodeIds,
    selectedEdgeId: ref(null),
    activeTool: ref('select'),
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
  });

  it('dois dedos apenas (wheel sem clique e sem ctrl) move a tela via panBy', async () => {
    const wrapper = mount(CanvasBoard, {
      global: {
        stubs: {
          CanvasEdgeLayer: true,
          CanvasNode: true,
          CanvasInkingOverlay: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
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
          CanvasNode: true,
          CanvasInkingOverlay: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
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
          CanvasNode: true,
          CanvasInkingOverlay: true,
          CanvasToolbar: true,
          CanvasInsertDrawer: true,
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
          CanvasNode: {
            props: ['node', 'isSelected', 'isMultiSelect'],
            template: '<div class="stub-node" :data-id="node.id" @pointerdown.stop="$emit(\'select\', node.id, false, $event); $emit(\'drag-start\', node.id, $event)"></div>',
          },
          CanvasInkingOverlay: true,
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
          CanvasNode: {
            props: ['node', 'isSelected', 'isMultiSelect'],
            template: '<div class="stub-node" :data-id="node.id" @pointerdown.stop="$emit(\'select\', node.id, false, $event); $emit(\'drag-start\', node.id, $event)"></div>',
          },
          CanvasInkingOverlay: true,
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
          CanvasNode: true,
          CanvasInkingOverlay: true,
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

