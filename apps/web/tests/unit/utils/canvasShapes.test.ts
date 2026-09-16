import { describe, it, expect } from 'vitest';
import {
  CANVAS_SHAPES,
  getShapeIcon,
  getDiamondPoints,
  getTrianglePoints,
  getTrapezoidPoints,
  getParallelogramPoints,
  getHexagonPoints,
  getStarPoints,
} from '../../../app/utils/canvasShapes';

describe('canvasShapes utils', () => {
  it('contém todas as 10 formas geométricas suportadas', () => {
    const types = CANVAS_SHAPES.map((s) => s.type);
    expect(types).toEqual([
      'rectangle',
      'rounded',
      'ellipse',
      'diamond',
      'triangle',
      'cylinder',
      'trapezoid',
      'parallelogram',
      'hexagon',
      'star',
    ]);
  });

  it('retorna o ícone correspondente para cada forma e fallback para retângulo', () => {
    expect(getShapeIcon('diamond')).toBeDefined();
    expect(getShapeIcon('star')).toBeDefined();
    expect(getShapeIcon(undefined)).toBeDefined();
  });

  it('calcula pontos SVG válidos para as formas poligonais', () => {
    const diamond = getDiamondPoints(200, 100);
    expect(diamond).toBe('100,3 197,50 100,97 3,50');

    const triangle = getTrianglePoints(200, 100);
    expect(triangle).toBe('100,4 196,96 4,96');

    const trapezoid = getTrapezoidPoints(200, 100);
    expect(trapezoid).toBe('40,4 160,4 196,96 4,96');

    const parallelogram = getParallelogramPoints(200, 100);
    expect(parallelogram).toBe('44,4 196,4 156,96 4,96');

    const hexagon = getHexagonPoints(200, 100);
    expect(hexagon).toBe('50,4 150,4 196,50 150,96 50,96 4,50');

    const star = getStarPoints(200, 200);
    expect(star.split(' ').length).toBe(10);
  });
});
