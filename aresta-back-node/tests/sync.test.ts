import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncService } from '../src/services/sync.service.js';
import { prisma } from '../src/config/prisma.js';

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(async (cb) => cb(prisma)),
    userBook: {
      upsert: vi.fn().mockResolvedValue({ id: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([])
    },
    annotation: {
      create: vi.fn().mockResolvedValue({ id: 10 }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([])
    },
    flashcard: {
      findFirst: vi.fn().mockResolvedValue({ id: 20, repetition_level: 1, next_review_at: new Date() }),
      update: vi.fn().mockResolvedValue({ id: 20 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([])
    },
    canvas: {
      upsert: vi.fn().mockResolvedValue({ id: 'c1' }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([])
    },
    dailyActivity: {
      upsert: vi.fn().mockResolvedValue({ id: 1 })
    },
    user: {
      update: vi.fn().mockResolvedValue({ id: 1 })
    }
  }
}));

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(() => {
    syncService = new SyncService();
    vi.clearAllMocks();
  });

  it('processa mutações locais de livro e retorna deltas vazios quando atualizado', async () => {
    const res = await syncService.processSync(1, {
      last_sync_timestamp: new Date().toISOString(),
      mutations: [
        {
          id: 'mut_1',
          entity_type: 'book',
          entity_id: 100,
          action: 'INSERT',
          payload: { bookId: 100, status: 'LENDO', currentPage: 5 },
          client_timestamp: new Date().toISOString(),
          sync_status: 'pending'
        }
      ]
    });

    expect(res.processed_mutation_ids).toContain('mut_1');
    expect(res.conflicts).toHaveLength(0);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('processa mutações de anotações e canvas com sucesso', async () => {
    const res = await syncService.processSync(1, {
      last_sync_timestamp: null,
      mutations: [
        {
          id: 'mut_2',
          entity_type: 'annotation',
          entity_id: 200,
          action: 'INSERT',
          payload: { bookId: 1, cfi: '/6/2', note: 'Nota de teste' },
          client_timestamp: new Date().toISOString(),
          sync_status: 'pending'
        },
        {
          id: 'mut_3',
          entity_type: 'canvas',
          entity_id: 'canvas_123',
          action: 'INSERT',
          payload: { name: 'Grafo 1', document: { nodes: [], edges: [] } },
          client_timestamp: new Date().toISOString(),
          sync_status: 'pending'
        }
      ]
    });

    expect(res.processed_mutation_ids).toEqual(['mut_2', 'mut_3']);
  });
});
