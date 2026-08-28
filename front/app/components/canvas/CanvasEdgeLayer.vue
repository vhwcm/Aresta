<template>
  <svg
    class="canvas-edge-layer absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
  >
    <defs>
      <!-- Arrow Marker Default -->
      <marker
        id="canvas-arrow-default"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#71717A" />
      </marker>

      <!-- Arrow Marker Selected / Primary -->
      <marker
        id="canvas-arrow-primary"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#E57B55" />
      </marker>
    </defs>

    <!-- Render Registered Edges -->
    <g v-for="edge in computedEdges" :key="edge.id">
      <!-- Invisible Wider Path for Easy Clicking -->
      <path
        :d="edge.path"
        fill="none"
        stroke="transparent"
        stroke-width="18"
        class="cursor-pointer pointer-events-auto"
        @click.stop="$emit('select-edge', edge.id)"
      />

      <!-- Visible Edge Path -->
      <path
        :d="edge.path"
        fill="none"
        :stroke="edge.isSelected ? '#E57B55' : (edge.color || '#52525B')"
        :stroke-width="edge.isSelected ? 2.5 : 2"
        :marker-end="edge.isSelected ? 'url(#canvas-arrow-primary)' : 'url(#canvas-arrow-default)'"
        class="transition-colors duration-150"
      />

      <!-- Optional Edge Label -->
      <g
        v-if="edge.label"
        :transform="`translate(${edge.midPoint.x}, ${edge.midPoint.y})`"
        class="pointer-events-auto cursor-pointer"
        @click.stop="$emit('select-edge', edge.id)"
      >
        <rect
          :x="-((edge.label.length * 7 + 16) / 2)"
          y="-11"
          :width="edge.label.length * 7 + 16"
          height="22"
          rx="11"
          fill="#18181BEE"
          :stroke="edge.isSelected ? '#E57B55' : '#3F3F46'"
          stroke-width="1"
        />
        <text
          y="4"
          text-anchor="middle"
          fill="#D4D4D8"
          font-size="11"
          font-family="sans-serif"
          font-weight="500"
        >
          {{ edge.label }}
        </text>
      </g>
    </g>

    <!-- Active Connecting Line (When User is Dragging an Anchor) -->
    <g v-if="activeConnectingPath">
      <path
        :d="activeConnectingPath"
        fill="none"
        stroke="#E57B55"
        stroke-width="2.5"
        stroke-dasharray="4 4"
        marker-end="url(#canvas-arrow-primary)"
        class="animate-pulse"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CanvasNode, CanvasEdge, CanvasSide } from '~/interfaces/canvas';
import {
  getAnchorPoint,
  calculateBezierPath,
  calculateMidPoint,
} from '~/utils/canvasGeometry';

const props = defineProps<{
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedEdgeId?: string | null;
  connectingState?: {
    fromNodeId: string;
    fromSide: CanvasSide;
    currentX: number;
    currentY: number;
  } | null;
}>();

defineEmits<{
  (e: 'select-edge', id: string): void;
}>();

const nodeMap = computed(() => {
  const map = new Map<string, CanvasNode>();
  for (const node of props.nodes) {
    map.set(node.id, node);
  }
  return map;
});

const computedEdges = computed(() => {
  const result: Array<{
    id: string;
    path: string;
    midPoint: { x: number; y: number };
    label?: string;
    color?: string;
    isSelected: boolean;
  }> = [];

  for (const edge of props.edges) {
    const fromNode = nodeMap.value.get(edge.fromNode);
    const toNode = nodeMap.value.get(edge.toNode);

    if (!fromNode || !toNode) continue;

    const fromPt = getAnchorPoint(fromNode, edge.fromSide);
    const toPt = getAnchorPoint(toNode, edge.toSide);

    const path = calculateBezierPath(fromPt, edge.fromSide, toPt, edge.toSide);
    const midPoint = calculateMidPoint(fromPt, toPt);

    result.push({
      id: edge.id,
      path,
      midPoint,
      label: edge.label,
      color: edge.color,
      isSelected: props.selectedEdgeId === edge.id,
    });
  }

  return result;
});

const activeConnectingPath = computed(() => {
  if (!props.connectingState) return null;
  const fromNode = nodeMap.value.get(props.connectingState.fromNodeId);
  if (!fromNode) return null;

  const fromPt = getAnchorPoint(fromNode, props.connectingState.fromSide);
  const toPt = {
    x: props.connectingState.currentX,
    y: props.connectingState.currentY,
  };

  // Determine opposing side for smooth draft curve
  const opposingSides: Record<CanvasSide, CanvasSide> = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  };
  const targetSide = opposingSides[props.connectingState.fromSide];

  return calculateBezierPath(fromPt, props.connectingState.fromSide, toPt, targetSide);
});
</script>
