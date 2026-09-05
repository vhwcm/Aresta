import { v4 as uuidv4 } from 'uuid';
import type { IDatabaseAdapter } from './IDatabaseAdapter';
import { DexieAdapter } from './DexieAdapter';
import { InMemoryAdapter } from './InMemoryAdapter';
import { TauriSqliteAdapter } from './TauriSqliteAdapter';
import type { LocalMutation } from './types';

class DatabaseManager {
  private static instance: DatabaseManager;
  private adapter: IDatabaseAdapter;

  private constructor() {
    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      this.adapter = new TauriSqliteAdapter();
    } else if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
      this.adapter = new DexieAdapter();
    } else {
      this.adapter = new InMemoryAdapter();
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getAdapter(): IDatabaseAdapter {
    return this.adapter;
  }

  public setAdapter(adapter: IDatabaseAdapter): void {
    this.adapter = adapter;
  }

  public async recordMutation(
    entity_type: LocalMutation['entity_type'],
    entity_id: string | number,
    action: LocalMutation['action'],
    payload: any
  ): Promise<void> {
    try {
      const mutation: LocalMutation = {
        id: uuidv4(),
        entity_type,
        entity_id,
        action,
        payload,
        client_timestamp: new Date().toISOString(),
        sync_status: 'pending',
        retry_count: 0
      };
      await this.adapter.enqueueMutation(mutation);
    } catch (e) {
      console.warn('[DatabaseManager] Falha ao enfileirar mutação:', e);
    }
  }
}

export const dbManager = DatabaseManager.getInstance();
export const getDatabase = () => dbManager.getAdapter();
