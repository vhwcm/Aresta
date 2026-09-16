import { h } from 'vue';
import type { CanvasShapeType } from '~/interfaces/canvas';

export interface ShapeDefinition {
  type: CanvasShapeType;
  label: string;
  icon: () => any;
}

export const getDiamondPoints = (width: number, height: number): string => {
  return `${width / 2},3 ${width - 3},${height / 2} ${width / 2},${height - 3} 3,${height / 2}`;
};

export const getTrianglePoints = (width: number, height: number): string => {
  return `${width / 2},4 ${width - 4},${height - 4} 4,${height - 4}`;
};

export const getTrapezoidPoints = (width: number, height: number): string => {
  return `${width * 0.2},4 ${width * 0.8},4 ${width - 4},${height - 4} 4,${height - 4}`;
};

export const getParallelogramPoints = (width: number, height: number): string => {
  return `${width * 0.22},4 ${width - 4},4 ${width * 0.78},${height - 4} 4,${height - 4}`;
};

export const getHexagonPoints = (width: number, height: number): string => {
  return `${width * 0.25},4 ${width * 0.75},4 ${width - 4},${height / 2} ${width * 0.75},${height - 4} ${width * 0.25},${height - 4} 4,${height / 2}`;
};

export const getStarPoints = (width: number, height: number): string => {
  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(width, height) / 2 - 4;
  const innerR = outerR * 0.42;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(' ');
};

export const RectIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
  ]);

export const RoundedIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '6' }),
  ]);

export const CircleIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('circle', { cx: '12', cy: '12', r: '9' }),
  ]);

export const DiamondIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('path', { d: 'M12 2 22 12 12 22 2 12z' }),
  ]);

export const TriangleIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('path', { d: 'M12 3 2 21h20z' }),
  ]);

export const CylinderIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('path', { d: 'M5 6.5C5 4.567 8.134 3 12 3s7 1.567 7 3.5V17.5c0 1.933-3.134 3.5-7 3.5s-7-1.567-7-3.5z' }),
    h('ellipse', { cx: '12', cy: '6.5', rx: '7', ry: '3.5' }),
  ]);

export const TrapezoidIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('path', { d: 'M7 4h10l4 16H3z' }),
  ]);

export const ParallelogramIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('path', { d: 'M7 4h14l-4 16H3z' }),
  ]);

export const HexagonIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('polygon', { points: '6,3 18,3 22,12 18,21 6,21 2,12' }),
  ]);

export const StarIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
    h('polygon', { points: '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26' }),
  ]);

export const CANVAS_SHAPES: ShapeDefinition[] = [
  { type: 'rectangle', label: 'Retângulo', icon: RectIcon },
  { type: 'rounded', label: 'Arredondado', icon: RoundedIcon },
  { type: 'ellipse', label: 'Círculo / Elipse', icon: CircleIcon },
  { type: 'diamond', label: 'Losango', icon: DiamondIcon },
  { type: 'triangle', label: 'Triângulo', icon: TriangleIcon },
  { type: 'cylinder', label: 'Cilindro', icon: CylinderIcon },
  { type: 'trapezoid', label: 'Trapézio', icon: TrapezoidIcon },
  { type: 'parallelogram', label: 'Paralelogramo', icon: ParallelogramIcon },
  { type: 'hexagon', label: 'Hexágono', icon: HexagonIcon },
  { type: 'star', label: 'Estrela', icon: StarIcon },
];

export function getShapeIcon(shapeType?: CanvasShapeType) {
  const found = CANVAS_SHAPES.find((s) => s.type === shapeType);
  return found ? found.icon : RectIcon;
}
