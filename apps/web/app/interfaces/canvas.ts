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

export type CanvasNodeType = 'text' | 'shape' | 'loose_text' | 'book' | 'highlight' | 'note_embed';

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

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface InkingStroke {
  points: StrokePoint[];
  color: string;
  width: number;
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
