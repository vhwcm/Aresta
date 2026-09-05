import type { CanvasNode, CanvasSide } from '~/interfaces/canvas';

export function getAnchorPoint(node: CanvasNode, side: CanvasSide): { x: number; y: number } {
  switch (side) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y };
    case 'right':
      return { x: node.x + node.width, y: node.y + node.height / 2 };
    case 'bottom':
      return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: node.y + node.height / 2 };
    default:
      return { x: node.x, y: node.y };
  }
}

export function getVectorForSide(side: CanvasSide): { dx: number; dy: number } {
  switch (side) {
    case 'top':
      return { dx: 0, dy: -1 };
    case 'right':
      return { dx: 1, dy: 0 };
    case 'bottom':
      return { dx: 0, dy: 1 };
    case 'left':
      return { dx: -1, dy: 0 };
    default:
      return { dx: 0, dy: 0 };
  }
}

export function calculateBezierPath(
  from: { x: number; y: number },
  fromSide: CanvasSide,
  to: { x: number; y: number },
  toSide: CanvasSide
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Fator de curvatura proporcional à distância
  const curvature = Math.max(Math.min(distance * 0.5, 160), 40);

  const vFrom = getVectorForSide(fromSide);
  const vTo = getVectorForSide(toSide);

  const cp1 = {
    x: from.x + vFrom.dx * curvature,
    y: from.y + vFrom.dy * curvature,
  };

  const cp2 = {
    x: to.x + vTo.dx * curvature,
    y: to.y + vTo.dy * curvature,
  };

  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
}

export function calculateMidPoint(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
}

export function getClosestAnchorSide(
  targetX: number,
  targetY: number,
  node: CanvasNode
): CanvasSide {
  const sides: CanvasSide[] = ['top', 'right', 'bottom', 'left'];
  let closestSide: CanvasSide = 'top';
  let minDistance = Infinity;

  for (const side of sides) {
    const pt = getAnchorPoint(node, side);
    const dist = Math.hypot(pt.x - targetX, pt.y - targetY);
    if (dist < minDistance) {
      minDistance = dist;
      closestSide = side;
    }
  }

  return closestSide;
}
