import { describe, it, expect, beforeEach } from 'vitest';
import { JournalRepository } from '~/adapters/database/repositories/JournalRepository';
import { dbManager } from '~/adapters/database/DatabaseManager';
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter';

describe('JournalRepository', () => {
  let repo: JournalRepository;
  let inMemoryAdapter: InMemoryAdapter;

  beforeEach(async () => {
    inMemoryAdapter = new InMemoryAdapter();
    dbManager.setAdapter(inMemoryAdapter);
    repo = new JournalRepository();
  });

  it('should save a journal entry for a given date', async () => {
    const saved = await repo.save({
      date: '2026-09-23',
      content: '# Reflexão de hoje\nDia muito produtivo.'
    });

    expect(saved.id).toBe('2026-09-23');
    expect(saved.date).toBe('2026-09-23');
    expect(saved.content).toContain('Reflexão de hoje');
    expect(saved.sync_status).toBe('pending');

    const retrieved = await repo.getByDate('2026-09-23');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.content).toBe('# Reflexão de hoje\nDia muito produtivo.');
  });

  it('should update an existing journal entry for the same date', async () => {
    await repo.save({
      date: '2026-09-23',
      content: 'Primeira versão'
    });

    const updated = await repo.save({
      date: '2026-09-23',
      content: 'Versão atualizada com mais detalhes'
    });

    expect(updated.id).toBe('2026-09-23');
    expect(updated.content).toBe('Versão atualizada com mais detalhes');

    const all = await repo.getAllChronological();
    expect(all.length).toBe(1);
    expect(all[0].content).toBe('Versão atualizada com mais detalhes');
  });

  it('should return all entries ordered chronologically descending (newest first)', async () => {
    await repo.save({ date: '2026-09-20', content: 'Entrada dia 20' });
    await repo.save({ date: '2026-09-23', content: 'Entrada dia 23' });
    await repo.save({ date: '2026-09-21', content: 'Entrada dia 21' });

    const list = await repo.getAllChronological();
    expect(list.length).toBe(3);
    expect(list[0].date).toBe('2026-09-23');
    expect(list[1].date).toBe('2026-09-21');
    expect(list[2].date).toBe('2026-09-20');
  });

  it('should filter out empty content or deleted entries', async () => {
    await repo.save({ date: '2026-09-20', content: 'Entrada dia 20' });
    await repo.save({ date: '2026-09-21', content: '   ' }); // vazio

    const list = await repo.getAllChronological();
    expect(list.length).toBe(1);
    expect(list[0].date).toBe('2026-09-20');
  });

  it('should delete a journal entry by date', async () => {
    await repo.save({ date: '2026-09-23', content: 'Conteúdo para deletar' });
    await repo.delete('2026-09-23');

    const retrieved = await repo.getByDate('2026-09-23');
    expect(retrieved).toBeNull();

    const list = await repo.getAllChronological();
    expect(list.length).toBe(0);
  });

  it('should return list of dates that have active entries', async () => {
    await repo.save({ date: '2026-09-20', content: 'Dia 20' });
    await repo.save({ date: '2026-09-23', content: 'Dia 23' });

    const dates = await repo.getDatesWithEntries();
    expect(dates).toContain('2026-09-20');
    expect(dates).toContain('2026-09-23');
    expect(dates.length).toBe(2);
  });
});
