<template>
  <svg
    class="canvas-stroke-layer absolute inset-0 w-full h-full pointer-events-none overflow-visible z-15 select-none"
  >
    <!-- Traços Concluídos e Persistidos -->
    <g class="persisted-strokes">
      <path
        v-for="stroke in renderedStrokes"
        :key="stroke.id"
        :d="stroke.path"
        :fill="stroke.color"
        :opacity="stroke.opacity"
        class="transition-opacity duration-150"
      />
    </g>

    <!-- Traço Ativo em Andamento (Tempo Real) -->
    <g v-if="activeStrokePath" class="active-stroke">
      <path
        :d="activeStrokePath"
        :fill="activeStroke?.color || '#E57B55'"
        :opacity="activeStroke?.opacity || 1"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getStroke } from 'perfect-freehand';
import type { InkingStroke, StrokePoint } from '~/interfaces/canvas';

const props = withDefaults(
  defineProps<{
    strokes: InkingStroke[];
    activeStroke?: InkingStroke | null;
  }>(),
  {
    strokes: () => [],
    activeStroke: null,
  }
);

function getSvgPathFromStroke(strokePoints: number[][]): string {
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

function computePath(points: StrokePoint[], width: number = 3): string {
  if (!points || points.length === 0) return '';

  if (points.length === 1 && points[0]) {
    const p = points[0];
    const r = Math.max(width, 2);
    return `M ${p.x - r} ${p.y} A ${r} ${r} 0 1 0 ${p.x + r} ${p.y} A ${r} ${r} 0 1 0 ${p.x - r} ${p.y} Z`;
  }

  const rawPoints = points.map((p) => [p.x, p.y, p.pressure ?? 0.5]);
  const outlinePoints = getStroke(rawPoints, {
    size: width * 2,
    thinning: 0.4,
    smoothing: 0.65,
    streamline: 0.55,
    easing: (t: number) => t,
    start: { taper: 0, cap: true },
    end: { taper: 0, cap: true },
  });

  return getSvgPathFromStroke(outlinePoints);
}

const renderedStrokes = computed(() => {
  return props.strokes.map((stroke, index) => {
    return {
      id: stroke.id || `persisted-stroke-${index}`,
      path: computePath(stroke.points, stroke.width || 3),
      color: stroke.color || '#E57B55',
      opacity: stroke.opacity ?? 1,
    };
  });
});

const activeStrokePath = computed(() => {
  if (!props.activeStroke || !props.activeStroke.points.length) return '';
  return computePath(props.activeStroke.points, props.activeStroke.width || 3);
});
</script>
