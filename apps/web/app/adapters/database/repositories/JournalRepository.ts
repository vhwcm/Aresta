import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalJournalEntry } from '../types';

export class JournalRepository {
  private getDb() {
    return getDatabase();
  }

  async getByDate(date: string): Promise<LocalJournalEntry | null> {
    return this.getDb().getJournalEntryByDate(date);
  }

  async getAllChronological(params?: { search?: string }): Promise<LocalJournalEntry[]> {
    const list = await this.getDb().getJournalEntries();
    let filtered = list;
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((j) => j.content && j.content.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }

  async save(data: { date: string; content: string }): Promise<LocalJournalEntry> {
    const existing = await this.getDb().getJournalEntryByDate(data.date);
    const now = new Date().toISOString();
    const rawEntity: LocalJournalEntry = {
      id: data.date,
      date: data.date,
      content: data.content,
      created_at: existing?.created_at || now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    const entity: LocalJournalEntry = JSON.parse(JSON.stringify(rawEntity));
    await this.getDb().saveJournalEntry(entity);
    await dbManager.recordMutation('journal', entity.id, existing ? 'UPDATE' : 'INSERT', entity);
    return entity;
  }

  async delete(date: string): Promise<void> {
    await this.getDb().deleteJournalEntry(date);
    await dbManager.recordMutation('journal', date, 'DELETE', { date, id: date });
  }

  async getDatesWithEntries(): Promise<string[]> {
    const list = await this.getDb().getJournalEntries();
    return list
      .filter((j) => !j.deleted_at && j.content && j.content.trim().length > 0)
      .map((j) => j.date);
  }
}

export const journalRepo = new JournalRepository();
