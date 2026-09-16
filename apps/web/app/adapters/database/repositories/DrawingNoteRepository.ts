import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalDrawingNote } from '../types';

export class DrawingNoteRepository {
  private getDb() {
    return getDatabase();
  }

  async getAll(params?: { folder?: string; search?: string }): Promise<LocalDrawingNote[]> {
    const list = await this.getDb().getDrawingNotes();
    let filtered = list;
    if (params?.folder) {
      filtered = filtered.filter((d) => d.folder === params.folder);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((d) => d.title && d.title.toLowerCase().includes(q));
    }
    return filtered;
  }

  async getById(id: string): Promise<LocalDrawingNote | null> {
    return this.getDb().getDrawingNoteById(id);
  }

  async save(note: Partial<LocalDrawingNote> & { id: string; title: string }): Promise<LocalDrawingNote> {
    const existing = await this.getDb().getDrawingNoteById(note.id);
    const now = new Date().toISOString();
    const entity: LocalDrawingNote = {
      ...existing,
      ...note,
      folder: note.folder !== undefined ? note.folder : (existing?.folder || null),
      tags: note.tags || existing?.tags || [],
      pages_data: note.pages_data !== undefined ? note.pages_data : (existing?.pages_data || '[]'),
      preview_url: note.preview_url !== undefined ? note.preview_url : (existing?.preview_url || null),
      created_at: existing?.created_at || note.created_at || now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    await this.getDb().saveDrawingNote(entity);
    await dbManager.recordMutation('drawing_note', entity.id, existing ? 'UPDATE' : 'INSERT', entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.getDb().deleteDrawingNote(id);
    await dbManager.recordMutation('drawing_note', id, 'DELETE', { id });
  }
}

export const drawingNoteRepo = new DrawingNoteRepository();
