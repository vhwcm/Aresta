import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSyncEngine } from '~/composables/useSyncEngine';
import { mutationQueueService } from '~/services/MutationQueueService';

describe('useSyncEngine Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa com estados padrão de conectividade e contadores', () => {
    const { isOnline, isSyncing, pendingCount, syncError } = useSyncEngine();
    expect(isOnline.value).toBe(true);
    expect(isSyncing.value).toBe(false);
    expect(pendingCount.value).toBe(0);
    expect(syncError.value).toBeNull();
  });

  it('atualiza a contagem de mutações pendentes corretamente', async () => {
    vi.spyOn(mutationQueueService, 'getPendingCount').mockResolvedValue(3);
    const { pendingCount, updatePendingCount } = useSyncEngine();
    await updatePendingCount();
    expect(pendingCount.value).toBe(3);
  });
});
