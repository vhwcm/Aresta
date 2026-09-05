import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalAnnotation } from '../types';

export class AnnotationRepository {
  private db = getDatabase();

  async getAll(filters?: { bookId?: number; themeId?: number }): Promise<LocalAnnotation[]> {
    return this.db.getAnnotations(filters);
  }

  async getById(id: number): Promise<LocalAnnotation | null> {
    return this.db.getAnnotationById(id);
  }

  async save(annotation: Partial<LocalAnnotation> & { id: number; bookId: number; cfi: string }): Promise<LocalAnnotation> {
    const existing = await this.db.getAnnotationById(annotation.id);
    const now = new Date().toISOString();
    const entity: LocalAnnotation = {
      ...existing,
      ...annotation,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending',
      createdAt: annotation.createdAt || existing?.createdAt || now
    };
    await this.db.saveAnnotation(entity);
    await dbManager.recordMutation('annotation', entity.id, existing ? 'UPDATE' : 'INSERT', entity);
    return entity;
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteAnnotation(id);
    await dbManager.recordMutation('annotation', id, 'DELETE', { id });
  }
}

export const annotationRepo = new AnnotationRepository();
