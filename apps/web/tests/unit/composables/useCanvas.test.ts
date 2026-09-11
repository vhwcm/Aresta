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
    expect(newCanvas.nodes.value[0]?.shape).toBe('diamond');
    expect(newCanvas.viewport.value.zoom).toBe(1.5);
  });

  it('suporta Undo e Redo de traços da caneta (strokes)', () => {
    const canvas = useCanvas();
    expect(canvas.strokes.value).toHaveLength(0);

    // Simula adição de 2 traços
    canvas.pushHistory();
    canvas.strokes.value.push({
      points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
      color: '#E57B55',
      width: 3,
    });

    canvas.pushHistory();
    canvas.strokes.value.push({
      points: [{ x: 30, y: 30 }, { x: 40, y: 40 }],
      color: '#3B82F6',
      width: 4,
    });

    expect(canvas.strokes.value).toHaveLength(2);
    expect(canvas.canUndo.value).toBe(true);

    // 1º Undo: desfaz o 2º traço
    canvas.undo();
    expect(canvas.strokes.value).toHaveLength(1);
    expect(canvas.strokes.value[0]?.color).toBe('#E57B55');
    expect(canvas.canRedo.value).toBe(true);

    // 2º Undo: desfaz o 1º traço
    canvas.undo();
    expect(canvas.strokes.value).toHaveLength(0);

    // Redo restaura o 1º traço
    canvas.redo();
    expect(canvas.strokes.value).toHaveLength(1);
    expect(canvas.strokes.value[0]?.color).toBe('#E57B55');

    // Redo restaura o 2º traço
    canvas.redo();
    expect(canvas.strokes.value).toHaveLength(2);
  });

  it('preserva traços da caneta na serialização e desserialização do documento', () => {
    const canvas = useCanvas();
    canvas.strokes.value = [
      {
        points: [{ x: 5, y: 5 }, { x: 15, y: 25 }],
        color: '#10B981',
        width: 5,
      },
    ];

    const serialized = canvas.serializeDocument();
    expect(serialized).toContain('"strokes":');
    expect(serialized).toContain('"#10B981"');

    canvas.resetCanvasState();
    expect(canvas.strokes.value).toHaveLength(0);

    canvas.deserializeDocument(serialized);
    expect(canvas.strokes.value).toHaveLength(1);
    expect(canvas.strokes.value[0]?.color).toBe('#10B981');
    expect(canvas.strokes.value[0]?.points).toHaveLength(2);
  });
});
