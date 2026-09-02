export interface NoteLinkItem {
  id: number;
  targetType: 'CANVAS' | 'BOOK' | 'NOTE';
  targetId: string;
}

export interface NoteItem {
  id: string;
  userId: number;
  title: string;
  content: string;
  folder?: string | null;
  tags: string[];
  links?: NoteLinkItem[];
  linksCount?: number;
  createdAt?: string;
  updatedAt: string;
}

export interface NoteListResponse {
  notes: NoteItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
