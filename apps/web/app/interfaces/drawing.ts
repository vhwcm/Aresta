export type PenToolType = 'pen' | 'fountain' | 'pencil' | 'highlighter' | 'eraser';

export type PageBackgroundType = 'blank' | 'ruled' | 'grid' | 'dots';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: PenToolType;
  color: string;
  size: number;
  opacity: number;
  points: DrawingPoint[];
}

export interface DrawingPage {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  backgroundType: PageBackgroundType;
  strokes: DrawingStroke[];
}

export interface DrawingDocument {
  id: string;
  title: string;
  folder: string | null;
  tags: string[];
  pages: DrawingPage[];
  preview_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DrawingSynthesisResult {
  html: string;
  titleSuggested: string;
  summary: string;
}
