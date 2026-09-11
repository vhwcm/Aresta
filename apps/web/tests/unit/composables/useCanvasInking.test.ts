import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCanvasInking } from '../../../app/composables/useCanvasInking';
import { useCanvas } from '../../../app/composables/useCanvas';

// Mock useAuth
vi.mock('../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    token: { value: 'fake-token' },
    user: { value: { id: 1, name: 'Test' } },
  }),
}));

describe('useCanvasInking composable with Canvas Undo/Redo integration', () => {
  beforeEach(() => {
    const canvas = useCanvas();
    canvas.resetCanvasState();
  });

  it('desenha um traço com a caneta e permite desfazer pelo botão de voltar (undo)', () => {
    const inking = useCanvasInking();
    const canvas = useCanvas();

    expect(inking.strokes.value).toHaveLength(0);
    expect(canvas.canUndo.value).toBe(false);

    // 1. Inicia traço e adiciona pontos
    inking.startStroke({ x: 10, y: 10 });
    inking.addPoint({ x: 15, y: 20 });
    inking.addPoint({ x: 25, y: 35 });
    inking.endStroke();

    expect(inking.strokes.value).toHaveLength(1);
    expect(canvas.strokes.value).toHaveLength(1);
    expect(canvas.canUndo.value).toBe(true);

    // 2. O botão de voltar (undo) é acionado
    canvas.undo();

    // 3. O traço feito com a caneta deve ser desfeito
    expect(inking.strokes.value).toHaveLength(0);
    expect(canvas.strokes.value).toHaveLength(0);
    expect(canvas.canRedo.value).toBe(true);

    // 4. Refazer (redo) restaura o traço
    canvas.redo();
    expect(inking.strokes.value).toHaveLength(1);
    expect(inking.strokes.value[0]?.points).toHaveLength(3);
  });

  it('desfaz múltiplos traços sequenciais na ordem inversa em que foram desenhados', () => {
    const inking = useCanvasInking();
    const canvas = useCanvas();

    // Traço 1
    inking.startStroke({ x: 0, y: 0 });
    inking.addPoint({ x: 10, y: 10 });
    inking.endStroke();

    // Traço 2
    inking.startStroke({ x: 50, y: 50 });
    inking.addPoint({ x: 60, y: 60 });
    inking.endStroke();

    expect(canvas.strokes.value).toHaveLength(2);

    // Primeiro undo desfaz o Traço 2
    canvas.undo();
    expect(canvas.strokes.value).toHaveLength(1);
    expect(canvas.strokes.value[0]?.points[0]?.x).toBe(0);

    // Segundo undo desfaz o Traço 1
    canvas.undo();
    expect(canvas.strokes.value).toHaveLength(0);

    // Redo restaura Traço 1
    canvas.redo();
    expect(canvas.strokes.value).toHaveLength(1);

    // Redo restaura Traço 2
    canvas.redo();
    expect(canvas.strokes.value).toHaveLength(2);
  });

  it('permite desfazer a limpeza de traços (clearStrokes)', () => {
    const inking = useCanvasInking();
    const canvas = useCanvas();

    inking.startStroke({ x: 10, y: 10 });
    inking.addPoint({ x: 20, y: 20 });
    inking.endStroke();
    expect(canvas.strokes.value).toHaveLength(1);

    inking.clearStrokes();
    expect(canvas.strokes.value).toHaveLength(0);

    // Desfazer o descarte restaura os traços anteriores
    canvas.undo();
    expect(canvas.strokes.value).toHaveLength(1);
  });
});
