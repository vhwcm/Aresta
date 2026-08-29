import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCanvas } from '../../../app/composables/useCanvas';
import type { CanvasNode, CanvasEdge } from '../../../app/interfaces/canvas';

// Mock useAuth
vi.mock('../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    token: { value: 'fake-token' },
    user: { value: { id: 1, name: 'Test' } },
  }),
}));

describe('useCanvas composable', () => {
  beforeEach(() => {
    const canvas = useCanvas();
    canvas.resetCanvasState();
  });
  it('adiciona nós e atualiza a seleção', () => {
    const canvas = useCanvas();
    const node: CanvasNode = {
      id: 'n1',
      type: 'text',
      x: 50,
      y: 50,
      width: 200,
      height: 120,
      text: 'Nota de Teste',
    };

    canvas.addNode(node);
    expect(canvas.nodes.value).toHaveLength(1);
    expect(canvas.selectedNodeIds.value).toContain('n1');
  });

  it('suporta Undo e Redo de modificações nos nós', () => {
    const canvas = useCanvas();
    const node1: CanvasNode = {
      id: 'n1',
      type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    const node2: CanvasNode = {
      id: 'n2',
      type: 'shape',
      shape: 'ellipse',
      x: 200,
      y: 200,
      width: 100,
      height: 100,
    };

    canvas.addNode(node1);
    canvas.addNode(node2);
    expect(canvas.nodes.value).toHaveLength(2);
    expect(canvas.canUndo.value).toBe(true);

    canvas.undo();
    expect(canvas.nodes.value).toHaveLength(1);
    expect(canvas.canRedo.value).toBe(true);

    canvas.redo();
    expect(canvas.nodes.value).toHaveLength(2);
  });

  it('adiciona arestas e remove em cascata ao excluir nós', () => {
    const canvas = useCanvas();
    const node1: CanvasNode = { id: 'n1', type: 'text', x: 0, y: 0, width: 100, height: 100 };
    const node2: CanvasNode = { id: 'n2', type: 'text', x: 200, y: 0, width: 100, height: 100 };
    canvas.addNode(node1);
    canvas.addNode(node2);

    const edge: CanvasEdge = {
      id: 'e1',
      fromNode: 'n1',
      fromSide: 'right',
      toNode: 'n2',
      toSide: 'left',
      label: 'relaciona',
    };
    canvas.addEdge(edge);
    expect(canvas.edges.value).toHaveLength(1);

    canvas.removeNode('n1');
    expect(canvas.nodes.value).toHaveLength(1);
    expect(canvas.edges.value).toHaveLength(0);
  });

  it('serializa e desserializa no formato JSON Canvas Spec', () => {
    const canvas = useCanvas();
    const node: CanvasNode = {
      id: 'n1',
      type: 'shape',
      shape: 'diamond',
      x: 120,
      y: 80,
      width: 150,
      height: 150,
      text: 'Decisão',
    };
    canvas.addNode(node);
    canvas.setViewport({ x: 10, y: 20, zoom: 1.5 });

    const serialized = canvas.serializeDocument();
    expect(serialized).toContain('"shape":"diamond"');
    expect(serialized).toContain('"zoom":1.5');

    const newCanvas = useCanvas();
    newCanvas.deserializeDocument(serialized);
    expect(newCanvas.nodes.value).toHaveLength(1);
    expect(newCanvas.nodes.value[0].shape).toBe('diamond');
    expect(newCanvas.viewport.value.zoom).toBe(1.5);
  });
});
