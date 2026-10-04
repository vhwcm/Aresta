export type CanvasSide = 'top' | 'right' | 'bottom' | 'left';

export type CanvasShapeType =
  | 'rectangle'
  | 'rounded'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'cylinder'
  | 'trapezoid'
  | 'parallelogram'
  | 'hexagon'
  | 'star';

export type CanvasNodeType = 'text' | 'shape' | 'loose_text' | 'book' | 'highlight' | 'note_embed' | 'image';

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  shape?: CanvasShapeType;
  color?: string;
  bookId?: number;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
  bookProgress?: number;
  quote?: string;
  chapter?: string;
  noteId?: string;
  noteTitle?: string;
  noteContent?: string;
  imageUrl?: string;
  imageAlt?: string;
  aspectRatio?: number;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide: CanvasSide;
  toNode: string;
  toSide: CanvasSide;
  label?: string;
  color?: string;
  fromEnd?: 'none' | 'arrow';
  toEnd?: 'none' | 'arrow';
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export type CanvasTool = 'select' | 'note' | 'shape' | 'loose_text' | 'pen' | 'eraser';

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface InkingStroke {
  id?: string;
  points: StrokePoint[];
  color: string;
  width: number;
  tool?: 'pen' | 'highlighter' | 'eraser';
  opacity?: number;
  path?: string; // Caminho vetorial SVG d="M...Z"
}

export interface CanvasDocument {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport?: CanvasViewport;
  strokes?: InkingStroke[];
}

export interface CanvasSummary {
  id: string;
  userId?: number;
  title: string;
  description?: string | null;
  folder?: string | null;
  tags?: string[];
  nodeCount?: number;
  edgeCount?: number;
  noteIds?: string[];
  createdAt?: string;
  updatedAt: string;
}

export interface CanvasItem extends CanvasSummary {
  data: string; // JSON Canvas Document string
}
