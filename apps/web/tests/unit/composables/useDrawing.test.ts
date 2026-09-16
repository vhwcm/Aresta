import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDrawing } from '../../../app/composables/useDrawing';

// Mock useAuth
vi.mock('../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    token: { value: 'test-token' },
    user: { value: { id: 1, name: 'Tester' } },
  }),
}));

describe('useDrawing composable (Samsung Notes Style Paged Drawing)', () => {
  beforeEach(() => {
    const drawing = useDrawing();
    drawing.resetDrawingState();
    drawing.currentDrawing.value = {
      id: 'doc-test-1',
      title: 'Caderno Inicial',
      folder: null,
      tags: [],
      pages: [
        {
          id: 'page-1',
          pageNumber: 1,
          width: 794,
          height: 1123,
          backgroundType: 'ruled',
          strokes: [],
        },
      ],
    };
    drawing.activePageIndex.value = 0;
  });

  it('adiciona, troca fundo e remove páginas mantendo numeração correta', () => {
    const drawing = useDrawing();

    expect(drawing.currentDrawing.value?.pages).toHaveLength(1);
    expect(drawing.activePage.value?.pageNumber).toBe(1);
    expect(drawing.activePage.value?.backgroundType).toBe('ruled');

    // Troca fundo da página 1 para quadriculada
    drawing.changePageBackground(0, 'grid');
    expect(drawing.activePage.value?.backgroundType).toBe('grid');

    // Adiciona página 2
    drawing.addPage('blank');
    expect(drawing.currentDrawing.value?.pages).toHaveLength(2);
    expect(drawing.activePageIndex.value).toBe(1);
    expect(drawing.activePage.value?.pageNumber).toBe(2);
    expect(drawing.activePage.value?.backgroundType).toBe('blank');

    // Adiciona página 3
    drawing.addPage('dots');
    expect(drawing.currentDrawing.value?.pages).toHaveLength(3);

    // Remove página 2
    drawing.removePage(1);
    expect(drawing.currentDrawing.value?.pages).toHaveLength(2);
    expect(drawing.currentDrawing.value?.pages[1]?.pageNumber).toBe(2);
    expect(drawing.currentDrawing.value?.pages[1]?.backgroundType).toBe('dots');
  });

  it('adiciona traço à página ativa e suporta desfazer (undo) e refazer (redo)', () => {
    const drawing = useDrawing();

    expect(drawing.canUndo.value).toBe(false);

    // Adiciona um traço
    drawing.addStrokeToActivePage({
      id: 'stroke-1',
      tool: 'pen',
      color: '#E57B55',
      size: 3,
      opacity: 1,
      points: [{ x: 100, y: 100 }, { x: 120, y: 120 }],
    });

    expect(drawing.activePage.value?.strokes).toHaveLength(1);
    expect(drawing.canUndo.value).toBe(true);

    // Desfaz
    drawing.undo();
    expect(drawing.activePage.value?.strokes).toHaveLength(0);
    expect(drawing.canRedo.value).toBe(true);

    // Refaz
    drawing.redo();
    expect(drawing.activePage.value?.strokes).toHaveLength(1);
    expect(drawing.activePage.value?.strokes[0]?.id).toBe('stroke-1');
  });

  it('apaga traços que interceptam o raio da borracha (suporte ao botão da S-Pen)', () => {
    const drawing = useDrawing();

    drawing.addStrokeToActivePage({
      id: 'stroke-target',
      tool: 'pen',
      color: '#18181B',
      size: 3,
      opacity: 1,
      points: [{ x: 50, y: 50 }, { x: 55, y: 55 }],
    });

    drawing.addStrokeToActivePage({
      id: 'stroke-far',
      tool: 'pen',
      color: '#18181B',
      size: 3,
      opacity: 1,
      points: [{ x: 500, y: 500 }, { x: 510, y: 510 }],
    });

    expect(drawing.activePage.value?.strokes).toHaveLength(2);

    // Simula toque de borracha com raio próximo ao primeiro traço
    drawing.eraseStrokesAtPoint(0, { x: 52, y: 52 }, 10);

    expect(drawing.activePage.value?.strokes).toHaveLength(1);
    expect(drawing.activePage.value?.strokes[0]?.id).toBe('stroke-far');
  });

  it('permite alternar rejeição de palma ativa', () => {
    const drawing = useDrawing();
    expect(drawing.palmRejectionEnabled.value).toBe(true);

    drawing.palmRejectionEnabled.value = false;
    expect(drawing.palmRejectionEnabled.value).toBe(false);
  });

  it('adiciona, atualiza e remove nós (formas e textos) e arestas na página de desenho', () => {
    const drawing = useDrawing();

    // 1. Adicionar forma geométrica
    const node = drawing.addNodeToPage(0, {
      id: 'node-shape-1',
      type: 'shape',
      shape: 'diamond',
      x: 100,
      y: 100,
      width: 180,
      height: 120,
      color: '#E57B55',
    });

    expect(node).toBeDefined();
    expect(drawing.currentDrawing.value?.pages[0]?.nodes).toHaveLength(1);
    expect(drawing.selectedNodeIds.value).toEqual(['node-shape-1']);

    // 2. Atualizar nó
    drawing.updateNodeInPage(0, 'node-shape-1', { text: 'Conceito Central', shape: 'star' });
    expect(drawing.currentDrawing.value?.pages[0]?.nodes?.[0]?.text).toBe('Conceito Central');
    expect(drawing.currentDrawing.value?.pages[0]?.nodes?.[0]?.shape).toBe('star');

    // 3. Adicionar segundo nó para conexão
    drawing.addNodeToPage(0, {
      id: 'node-shape-2',
      type: 'shape',
      shape: 'rectangle',
      x: 350,
      y: 100,
      width: 180,
      height: 120,
    });
    expect(drawing.currentDrawing.value?.pages[0]?.nodes).toHaveLength(2);

    // 4. Adicionar aresta conectando os nós
    const edge = drawing.addEdgeToPage(0, {
      id: 'edge-1',
      fromNode: 'node-shape-1',
      fromSide: 'right',
      toNode: 'node-shape-2',
      toSide: 'left',
    });
    expect(edge).toBeDefined();
    expect(drawing.currentDrawing.value?.pages[0]?.edges).toHaveLength(1);
    expect(drawing.selectedEdgeId.value).toBe('edge-1');

    // 5. Remover aresta
    drawing.removeEdgeFromPage(0, 'edge-1');
    expect(drawing.currentDrawing.value?.pages[0]?.edges).toHaveLength(0);

    // 6. Remover nó
    drawing.removeNodeFromPage(0, 'node-shape-1');
    expect(drawing.currentDrawing.value?.pages[0]?.nodes).toHaveLength(1);
    expect(drawing.currentDrawing.value?.pages[0]?.nodes?.[0]?.id).toBe('node-shape-2');
  });
});
