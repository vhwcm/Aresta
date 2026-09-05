import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalCanvasItem } from '../types';

export class CanvasRepository {
  private db = getDatabase();

  async getAll(): Promise<LocalCanvasItem[]> {
    return this.db.getCanvases();
  }

  async getById(id: string): Promise<LocalCanvasItem | null> {
    return this.db.getCanvasById(id);
  }

  async save(canvas: Partial<LocalCanvasItem> & { id: string; name: string; document: any }): Promise<LocalCanvasItem> {
    const existing = await this.db.getCanvasById(canvas.id);
    const now = new Date().toISOString();
    const entity: LocalCanvasItem = {
      ...existing,
      ...canvas,
      nodeCount: canvas.document?.nodes?.length || 0,
      edgeCount: canvas.document?.edges?.length || 0,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    await this.db.saveCanvas(entity);
    await dbManager.recordMutation('canvas', entity.id, existing ? 'UPDATE' : 'INSERT', entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteCanvas(id);
    await dbManager.recordMutation('canvas', id, 'DELETE', { id });
  }
}

export const canvasRepo = new CanvasRepository();
