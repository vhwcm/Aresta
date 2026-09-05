import { describe, it, expect } from 'vitest';
import {
  getAnchorPoint,
  calculateBezierPath,
  calculateMidPoint,
  getClosestAnchorSide,
} from '../../../app/utils/canvasGeometry';
import type { CanvasNode } from '../../../app/interfaces/canvas';

describe('canvasGeometry utils', () => {
  const sampleNode: CanvasNode = {
    id: 'node-1',
    type: 'text',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    text: 'Test',
  };

  it('calcula corretamente as 4 âncoras do nó', () => {
    expect(getAnchorPoint(sampleNode, 'top')).toEqual({ x: 200, y: 100 });
    expect(getAnchorPoint(sampleNode, 'right')).toEqual({ x: 300, y: 150 });
    expect(getAnchorPoint(sampleNode, 'bottom')).toEqual({ x: 200, y: 200 });
    expect(getAnchorPoint(sampleNode, 'left')).toEqual({ x: 100, y: 150 });
  });

  it('calcula o caminho SVG Bézier entre duas âncoras', () => {
    const fromPt = getAnchorPoint(sampleNode, 'right');
    const toNode: CanvasNode = {
      id: 'node-2',
      type: 'shape',
      x: 500,
      y: 100,
      width: 200,
      height: 100,
    };
    const toPt = getAnchorPoint(toNode, 'left');

    const path = calculateBezierPath(fromPt, 'right', toPt, 'left');
    expect(path).toContain('M 300 150 C');
    expect(path).toContain('500 150');
  });

  it('calcula o ponto médio entre duas coordenadas', () => {
    const mid = calculateMidPoint({ x: 100, y: 100 }, { x: 300, y: 200 });
    expect(mid).toEqual({ x: 200, y: 150 });
  });

  it('identifica a âncora mais próxima do ponto de destino', () => {
    // Ponto à direita
    expect(getClosestAnchorSide(320, 150, sampleNode)).toBe('right');
    // Ponto no topo
    expect(getClosestAnchorSide(200, 80, sampleNode)).toBe('top');
    // Ponto à esquerda
    expect(getClosestAnchorSide(80, 150, sampleNode)).toBe('left');
    // Ponto na base
    expect(getClosestAnchorSide(200, 220, sampleNode)).toBe('bottom');
  });
});
