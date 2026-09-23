import { ref, computed } from 'vue';
import { journalRepo } from '~/adapters/database/repositories/JournalRepository';
import type { LocalJournalEntry } from '~/adapters/database/types';

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatJournalDateLong(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  
  const todayStr = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const dayOfWeek = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayOfWeekCapitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
  const formattedDate = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (dateStr === todayStr) {
    return `Hoje • ${dayOfWeekCapitalized}, ${formattedDate}`;
  }
  if (dateStr === yesterdayStr) {
    return `Ontem • ${dayOfWeekCapitalized}, ${formattedDate}`;
  }
  return `${dayOfWeekCapitalized}, ${formattedDate}`;
}

const selectedDate = ref<string>(getTodayString());
const selectedDateContent = ref<string>('');
const timelineEntries = ref<LocalJournalEntry[]>([]);
const datesWithEntries = ref<string[]>([]);
const isLoading = ref<boolean>(false);
const isSaving = ref<boolean>(false);
const lastSaved = ref<Date | null>(null);

export function resetJournalMemory() {
  selectedDate.value = getTodayString();
  selectedDateContent.value = '';
  timelineEntries.value = [];
  datesWithEntries.value = [];
  isLoading.value = false;
  isSaving.value = false;
  lastSaved.value = null;
}

export function useJournal() {
  const isTodaySelected = computed(() => selectedDate.value === getTodayString());

  const loadTimeline = async () => {
    isLoading.value = true;
    try {
      const all = await journalRepo.getAllChronological();
      timelineEntries.value = all;
      datesWithEntries.value = all.map((e) => e.date);

      // Sincroniza o conteúdo da data atualmente selecionada
      const currentEntry = await journalRepo.getByDate(selectedDate.value);
      selectedDateContent.value = currentEntry?.content || '';
    } catch (err) {
      console.error('[useJournal] Falha ao carregar timeline do diário:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const selectDate = async (date: string) => {
    selectedDate.value = date;
    isLoading.value = true;
    try {
      const entry = await journalRepo.getByDate(date);
      selectedDateContent.value = entry?.content || '';
    } catch (err) {
      console.error(`[useJournal] Falha ao carregar entrada de ${date}:`, err);
      selectedDateContent.value = '';
    } finally {
      isLoading.value = false;
    }
  };

  const saveEntry = async (date: string, content: string): Promise<LocalJournalEntry> => {
    isSaving.value = true;
    try {
      const saved = await journalRepo.save({ date, content });
      lastSaved.value = new Date();
      if (selectedDate.value === date) {
        selectedDateContent.value = content;
      }
      // Atualiza timeline em memória
      const existingIdx = timelineEntries.value.findIndex((e) => e.date === date);
      if (content.trim().length > 0) {
        if (existingIdx >= 0) {
          timelineEntries.value[existingIdx] = saved;
        } else {
          timelineEntries.value.push(saved);
          timelineEntries.value.sort((a, b) => b.date.localeCompare(a.date));
        }
        if (!datesWithEntries.value.includes(date)) {
          datesWithEntries.value.push(date);
        }
      } else {
        // Se ficou vazio, remove da timeline
        if (existingIdx >= 0) {
          timelineEntries.value.splice(existingIdx, 1);
        }
        datesWithEntries.value = datesWithEntries.value.filter((d) => d !== date);
      }
      return saved;
    } finally {
      isSaving.value = false;
    }
  };

  const deleteEntry = async (date: string) => {
    isLoading.value = true;
    try {
      await journalRepo.delete(date);
      if (selectedDate.value === date) {
        selectedDateContent.value = '';
      }
      timelineEntries.value = timelineEntries.value.filter((e) => e.date !== date);
      datesWithEntries.value = datesWithEntries.value.filter((d) => d !== date);
    } catch (err) {
      console.error(`[useJournal] Falha ao deletar entrada do dia ${date}:`, err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    selectedDate,
    selectedDateContent,
    timelineEntries,
    datesWithEntries,
    isLoading,
    isSaving,
    lastSaved,
    isTodaySelected,
    getTodayString,
    formatJournalDateLong,
    loadTimeline,
    selectDate,
    saveEntry,
    deleteEntry,
  };
}
