import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CanvasBoard from '../../../app/components/canvas/CanvasBoard.vue';

const mockPanBy = vi.fn();
const mockZoomAt = vi.fn();
const mockAddNode = vi.fn();

vi.mock('../../../app/composables/useCanvas', () => ({
  useCanvas: () => ({
    nodes: ref([]),
    edges: ref([]),
    viewport: ref({ x: 0, y: 0, zoom: 1 }),
    selectedNodeIds: ref([]),
    selectedEdgeId: ref(null),
    activeTool: ref('select'),
    selectedShapeType: ref('rectangle'),
    connectingState: ref(null),
    isSaving: ref(false),
    canUndo: ref(false),
    canRedo: ref(false),
    addNode: mockAddNode,
    updateNode: vi.fn(),
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
