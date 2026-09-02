import { describe, it, expect } from 'vitest';
import { useCycleDetector, MAX_COMPOSITE_DEPTH } from '../../../app/composables/useCycleDetector';

describe('useCycleDetector composable', () => {
  it('permite nós sem ciclos em profundidade segura', () => {
    const { checkCycle, createNextStack } = useCycleDetector([]);

    const res1 = checkCycle('note', 'note-1');
    expect(res1.hasCycle).toBe(false);
    expect(res1.maxDepthReached).toBe(false);

    const stack1 = createNextStack({ type: 'note', id: 'note-1' });
    const { checkCycle: checkCycle2 } = useCycleDetector(stack1);

    const res2 = checkCycle2('canvas', 'canvas-1');
    expect(res2.hasCycle).toBe(false);
    expect(res2.maxDepthReached).toBe(false);
  });

  it('detecta ciclo direto (Nota A -> Canvas B -> Nota A)', () => {
    const stack = [
      { type: 'note' as const, id: 'note-a' },
      { type: 'canvas' as const, id: 'canvas-b' },
    ];

    const { checkCycle } = useCycleDetector(stack);
    const result = checkCycle('note', 'note-a');

    expect(result.hasCycle).toBe(true);
    expect(result.maxDepthReached).toBe(false);
    expect(result.cycleChain).toEqual(['note:note-a', 'canvas:canvas-b', 'note:note-a']);
  });

  it('detecta ciclo indireto (Nota A -> Canvas B -> Nota C -> Canvas B)', () => {
    const stack = [
      { type: 'note' as const, id: 'note-a' },
      { type: 'canvas' as const, id: 'canvas-b' },
      { type: 'note' as const, id: 'note-c' },
    ];

    const { checkCycle } = useCycleDetector(stack);
    const result = checkCycle('canvas', 'canvas-b');

    expect(result.hasCycle).toBe(true);
    expect(result.maxDepthReached).toBe(false);
    expect(result.cycleChain).toEqual(['canvas:canvas-b', 'note:note-c', 'canvas:canvas-b']);
  });

  it('intercepta quando a profundidade máxima (MAX_COMPOSITE_DEPTH) é atingida', () => {
    const deepStack = [
      { type: 'note' as const, id: 'note-1' },
      { type: 'canvas' as const, id: 'canvas-1' },
      { type: 'note' as const, id: 'note-2' },
    ];

    expect(deepStack.length).toBe(MAX_COMPOSITE_DEPTH);

    const { checkCycle } = useCycleDetector(deepStack);
    const result = checkCycle('canvas', 'canvas-3');

    expect(result.hasCycle).toBe(false);
    expect(result.maxDepthReached).toBe(true);
  });
});
