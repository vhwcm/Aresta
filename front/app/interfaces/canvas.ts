export type CanvasSide = 'top' | 'right' | 'bottom' | 'left';

export type CanvasShapeType = 'rectangle' | 'rounded' | 'ellipse' | 'diamond' | 'triangle';

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

export interface CanvasDocument {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport?: CanvasViewport;
}

export interface CanvasSummary {
  id: string;
  userId?: number;
  title: string;
  description?: string | null;
  nodeCount?: number;
  edgeCount?: number;
  createdAt?: string;
  updatedAt: string;
}

export interface CanvasItem extends CanvasSummary {
  data: string; // JSON Canvas Document string
}
