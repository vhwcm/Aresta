import { getStroke } from 'perfect-freehand';
import type { PenToolType } from '~/interfaces/drawing';

export interface VectorPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface StrokeOptions {
  size?: number;
  thinning?: number;
  smoothing?: number;
  streamline?: number;
  easing?: (t: number) => number;
  start?: { taper: number | boolean; cap: boolean };
  end?: { taper: number | boolean; cap: boolean };
}

/**
 * Converte array de coordenadas gerado pelo perfect-freehand em string de caminho SVG (Bézier quadrático).
 */
export function getSvgPathFromStroke(strokePoints: number[][]): string {
  if (!strokePoints.length) return '';

  const firstPt = strokePoints[0] || [0, 0];
  const firstX = firstPt[0] ?? 0;
  const firstY = firstPt[1] ?? 0;
  const initialAcc: (string | number)[] = ['M', firstX, firstY, 'Q'];

  const d = strokePoints.reduce<(string | number)[]>(
    (acc, pt, i, arr) => {
      const x0 = pt[0] ?? 0;
      const y0 = pt[1] ?? 0;
      const next = arr[(i + 1) % arr.length] || [x0, y0];
      const x1 = next[0] ?? 0;
      const y1 = next[1] ?? 0;
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    initialAcc
  );

  d.push('Z');
  return d.join(' ');
}

/**
 * Gera caminho SVG fechado para um único ponto (toque / ponto isolado).
 */
export function getDotSvgPath(x: number, y: number, radius: number): string {
  const r = Math.max(radius, 1.5);
  return `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y} Z`;
}

/**
 * Calcula o caminho SVG vetorial a partir dos pontos e da ferramenta utilizada.
 */
export function computeVectorStrokePath(
  points: VectorPoint[],
  tool: PenToolType | 'pen' | 'highlighter' | 'eraser' = 'pen',
  size: number = 3
): string {
  if (!points || points.length === 0) return '';

  if (points.length === 1 && points[0]) {
    const p = points[0];
    const r = tool === 'highlighter' ? size * 2 : Math.max(size, 2);
    return getDotSvgPath(p.x, p.y, r);
  }

  const rawPoints = points.map((p) => [p.x, p.y, p.pressure ?? 0.5]);

  let strokeOptions: StrokeOptions = {
    size: size * 2,
    thinning: 0.4,
    smoothing: 0.65,
    streamline: 0.55,
    easing: (t: number) => t,
    start: { taper: 0, cap: true },
    end: { taper: 0, cap: true },
  };

  if (tool === 'fountain') {
    strokeOptions = {
      size: size * 2.2,
      thinning: 0.6,
      smoothing: 0.7,
      streamline: 0.6,
      easing: (t: number) => t,
      start: { taper: size * 1.5, cap: true },
      end: { taper: size * 1.5, cap: true },
    };
  } else if (tool === 'pencil') {
    strokeOptions = {
      size: Math.max(1.5, size * 1.6),
      thinning: 0.25,
      smoothing: 0.5,
      streamline: 0.4,
      easing: (t: number) => t,
      start: { taper: 0, cap: true },
      end: { taper: 0, cap: true },
    };
  } else if (tool === 'highlighter') {
    strokeOptions = {
      size: size * 4.5,
      thinning: 0,
      smoothing: 0.6,
      streamline: 0.5,
      easing: (t: number) => t,
      start: { taper: 0, cap: false },
      end: { taper: 0, cap: false },
    };
  }

  const outlinePoints = getStroke(rawPoints, strokeOptions);
  return getSvgPathFromStroke(outlinePoints);
}

/**
 * Converte uma marcação SVG pura em Data URL UTF-8 compacta.
 */
export function svgToDataUrl(svgString: string): string {
  const cleanSvg = svgString
    .replace(/\r?\n|\r/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}
