import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalNote } from '../types';

export class NoteRepository {
  private getDb() {
    return getDatabase();
  }

  async getAll(params?: { folder?: string; tag?: string; search?: string }): Promise<LocalNote[]> {
    const list = await this.getDb().getNotes();
    let filtered = list;
    if (params?.folder) {
      filtered = filtered.filter((n) => n.folder === params.folder);
    }
    if (params?.tag) {
      filtered = filtered.filter((n) => n.tags?.includes(params.tag!));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((n) => (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q)));
    }
    return filtered;
  }

  async getById(id: string): Promise<LocalNote | null> {
    return this.getDb().getNoteById(id);
  }

  async save(note: Partial<LocalNote> & { id: string; title: string }): Promise<LocalNote> {
    const existing = await this.getDb().getNoteById(note.id);
    const now = new Date().toISOString();
    const entity: LocalNote = {
      ...existing,
      ...note,
      content: note.content !== undefined ? note.content : (existing?.content || ''),
      folder: note.folder !== undefined ? note.folder : (existing?.folder || null),
      tags: note.tags || existing?.tags || [],
      links: note.links || existing?.links || [],
      created_at: existing?.created_at || note.created_at || now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    await this.getDb().saveNote(entity);
    await dbManager.recordMutation('note', entity.id, existing ? 'UPDATE' : 'INSERT', entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.getDb().deleteNote(id);
    await dbManager.recordMutation('note', id, 'DELETE', { id });
  }

  async getFolders(): Promise<string[]> {
    const list = await this.getDb().getNotes();
    const set = new Set<string>();
    list.forEach((n) => {
      if (n.folder) set.add(n.folder);
    });
    return Array.from(set);
  }
}

export const noteRepo = new NoteRepository();
