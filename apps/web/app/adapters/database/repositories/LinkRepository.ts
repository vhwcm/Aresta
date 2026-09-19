import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalLinkItem } from '../types';
import { extractDomain, getFaviconUrl, cleanUrlTitle, sanitizeUrl } from '~/utils/urlOpener';

export class LinkRepository {
  private getDb() {
    return getDatabase();
  }

  async getAll(params?: { folder?: string; tag?: string; search?: string }): Promise<LocalLinkItem[]> {
    const list = await this.getDb().getLinks();
    let filtered = list;
    if (params?.folder) {
      filtered = filtered.filter((l) => l.folder === params.folder);
    }
    if (params?.tag) {
      filtered = filtered.filter((l) => l.tags?.includes(params.tag!));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((l) => 
        (l.title && l.title.toLowerCase().includes(q)) || 
        (l.url && l.url.toLowerCase().includes(q)) ||
        (l.domain && l.domain.toLowerCase().includes(q))
      );
    }
    return filtered;
  }

  async getById(id: string): Promise<LocalLinkItem | null> {
    return this.getDb().getLinkById(id);
  }

  async save(link: Partial<LocalLinkItem> & { id: string; url: string; title?: string }): Promise<LocalLinkItem> {
    const existing = await this.getDb().getLinkById(link.id);
    const now = new Date().toISOString();
    const sanitized = sanitizeUrl(link.url);
    const domain = extractDomain(sanitized);
    const title = cleanUrlTitle(sanitized, link.title || existing?.title);
    const favicon = link.favicon !== undefined ? link.favicon : (existing?.favicon || getFaviconUrl(sanitized));

    const rawEntity: LocalLinkItem = {
      ...existing,
      ...link,
      url: sanitized,
      title,
      domain,
      favicon,
      folder: link.folder !== undefined ? link.folder : (existing?.folder || null),
      tags: link.tags ? [...link.tags] : (existing?.tags || []),
      sourceNoteId: link.sourceNoteId !== undefined ? link.sourceNoteId : (existing?.sourceNoteId || null),
      sourceCanvasId: link.sourceCanvasId !== undefined ? link.sourceCanvasId : (existing?.sourceCanvasId || null),
      created_at: existing?.created_at || link.created_at || link.createdAt || now,
      createdAt: existing?.createdAt || link.createdAt || link.created_at || now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    const entity: LocalLinkItem = JSON.parse(JSON.stringify(rawEntity));
    await this.getDb().saveLink(entity);
    await dbManager.recordMutation('link', entity.id, existing ? 'UPDATE' : 'INSERT', entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.getDb().deleteLink(id);
    await dbManager.recordMutation('link', id, 'DELETE', { id });
  }

  async getFolders(): Promise<string[]> {
    const list = await this.getDb().getLinks();
    const set = new Set<string>();
    list.forEach((l) => {
      if (l.folder) set.add(l.folder);
    });
    return Array.from(set);
  }
}

export const linkRepo = new LinkRepository();
