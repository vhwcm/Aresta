import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useJournal, resetJournalMemory, getTodayString } from '~/composables/useJournal';
import { dbManager } from '~/adapters/database/DatabaseManager';
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter';

describe('useJournal composable', () => {
  let inMemoryAdapter: InMemoryAdapter;

  beforeEach(() => {
    inMemoryAdapter = new InMemoryAdapter();
    dbManager.setAdapter(inMemoryAdapter);
    resetJournalMemory();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with today as selectedDate and load entries', async () => {
    const { selectedDate, loadTimeline, timelineEntries, selectedDateContent } = useJournal();
    const todayStr = getTodayString();
    expect(selectedDate.value).toBe(todayStr);

    await loadTimeline();
    expect(timelineEntries.value).toEqual([]);
    expect(selectedDateContent.value).toBe('');
  });

  it('should save and update today entry with autosave', async () => {
    const { selectedDate, saveEntry, selectedDateContent, timelineEntries, loadTimeline } = useJournal();
    const todayStr = getTodayString();

    await saveEntry(todayStr, '# Hoje\nEstudos intensivos de Nuxt.');
    expect(selectedDateContent.value).toBe('# Hoje\nEstudos intensivos de Nuxt.');

    await loadTimeline();
    expect(timelineEntries.value.length).toBe(1);
    expect(timelineEntries.value[0].date).toBe(todayStr);
  });

  it('should switch selectedDate and load previous content', async () => {
    const { selectDate, saveEntry, selectedDateContent } = useJournal();

    await saveEntry('2026-09-20', 'Nota do dia 20');
    await selectDate('2026-09-20');

    expect(selectedDateContent.value).toBe('Nota do dia 20');

    await selectDate('2026-09-21');
    expect(selectedDateContent.value).toBe('');
  });

  it('should delete an entry and refresh the timeline', async () => {
    const { saveEntry, deleteEntry, timelineEntries, loadTimeline } = useJournal();

    await saveEntry('2026-09-21', 'Para apagar');
    await loadTimeline();
    expect(timelineEntries.value.length).toBe(1);

    await deleteEntry('2026-09-21');
    expect(timelineEntries.value.length).toBe(0);
  });
});
