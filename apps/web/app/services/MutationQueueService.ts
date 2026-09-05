import { getDatabase } from '~/adapters/database/DatabaseManager';
import type { LocalMutation } from '~/adapters/database/types';

export class MutationQueueService {
  private db = getDatabase();

  async getPending(): Promise<LocalMutation[]> {
    return this.db.getPendingMutations();
  }

  async markSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    return this.db.markMutationsSynced(ids);
  }

  async getPendingCount(): Promise<number> {
    const list = await this.db.getPendingMutations();
    return list.length;
  }

  async clear(): Promise<void> {
    return this.db.clearPendingMutations();
  }
}

export const mutationQueueService = new MutationQueueService();
