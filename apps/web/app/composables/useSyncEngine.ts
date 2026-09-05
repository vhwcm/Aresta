import { ref, onMounted, onUnmounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { mutationQueueService } from '~/services/MutationQueueService';
import { bookRepo } from '~/adapters/database/repositories/BookRepository';
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository';
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository';
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository';

const API_BASE = 'http://localhost:7070/api';

// Shared state across the application
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const isSyncing = ref(false);
const pendingCount = ref(0);
const lastSyncAt = ref<string | null>(null);
const syncError = ref<string | null>(null);

let syncInterval: any = null;

export function useSyncEngine() {
  const auth = useAuth();

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth.token?.value) {
      headers.Authorization = `Bearer ${auth.token.value}`;
    }
    return headers;
  };

  const updatePendingCount = async () => {
    try {
      pendingCount.value = await mutationQueueService.getPendingCount();
    } catch (e) {
      // safe fallback
    }
  };

  const syncNow = async () => {
    if (isSyncing.value || !isOnline.value) return;
    isSyncing.value = true;
    syncError.value = null;

    try {
      // 1. Obter mutações locais pendentes
      const mutations = await mutationQueueService.getPending();
      const lastTimestamp = typeof localStorage !== 'undefined' ? localStorage.getItem('aresta_last_sync_timestamp') : null;

      // 2. Enviar lote para o backend
      const response = await $fetch<any>(`${API_BASE}/sync`, {
        method: 'POST',
        headers: getHeaders(),
        body: {
          last_sync_timestamp: lastTimestamp,
          mutations,
        },
      });

      // 3. Marcar mutações processadas como sincronizadas
      if (response?.processed_mutation_ids && response.processed_mutation_ids.length > 0) {
        await mutationQueueService.markSynced(response.processed_mutation_ids);
      }

      // 4. Aplicar deltas remotos no banco local
      if (response?.deltas) {
        // Books
        if (Array.isArray(response.deltas.books)) {
          for (const b of response.deltas.books) {
            await bookRepo.save({
              id: b.userBookId,
              bookId: b.bookId,
              title: b.title,
              coverPath: b.coverPath,
              filePath: b.filePath,
              status: b.status,
              currentPage: b.currentPage,
              lastAccessedAt: b.lastAccessedAt,
            });
          }
        }

        // Annotations
        if (Array.isArray(response.deltas.annotations)) {
          for (const a of response.deltas.annotations) {
            await annotationRepo.save({
              id: a.id,
              userId: a.userId,
              bookId: a.bookId,
              bookTitle: a.bookTitle,
              bookCover: a.bookCover,
              cfi: a.cfi,
              selectedText: a.selectedText,
              note: a.note,
              chapterTitle: a.chapterTitle,
              progress: a.progress,
              themes: a.themes,
              createdAt: a.createdAt,
            });
          }
        }

        // Flashcards
        if (Array.isArray(response.deltas.flashcards)) {
          for (const f of response.deltas.flashcards) {
            await flashcardRepo.save({
              id: f.id,
              userId: f.userId,
              annotationId: f.annotationId,
              bookId: f.bookId,
              bookTitle: f.bookTitle,
              bookCover: f.bookCover,
              chapterTitle: f.chapterTitle,
              selectedText: f.selectedText,
              note: f.note,
              cardType: f.cardType,
              question: f.question,
              answer: f.answer,
              contextSummary: f.contextSummary,
              repetitionLevel: f.repetitionLevel,
              nextReviewAt: f.nextReviewAt,
              lastReviewedAt: f.lastReviewedAt,
              reviewCount: f.reviewCount,
              difficulty: f.difficulty,
            });
          }
        }

        // Canvases
        if (Array.isArray(response.deltas.canvases)) {
          for (const c of response.deltas.canvases) {
            let doc = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
            try {
              doc = typeof c.data === 'string' ? JSON.parse(c.data) : c.data;
            } catch {
              // fallback para objeto vazio
            }
            await canvasRepo.save({
              id: c.id,
              name: c.title,
              description: c.description,
              document: doc,
            });
          }
        }
      }

      // 5. Atualizar timestamp de último sync
      if (response?.server_timestamp) {
        lastSyncAt.value = response.server_timestamp;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('aresta_last_sync_timestamp', response.server_timestamp);
        }
      }

      await updatePendingCount();
    } catch (e: any) {
      console.warn('[useSyncEngine] Erro durante sincronização:', e);
      syncError.value = e.message || 'Falha ao sincronizar com servidor.';
    } finally {
      isSyncing.value = false;
    }
  };

  const handleOnline = () => {
    isOnline.value = true;
    syncNow();
  };

  const handleOffline = () => {
    isOnline.value = false;
  };

  const initListeners = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      updatePendingCount();

      // Intervalo de auto-sync a cada 60s
      if (!syncInterval) {
        syncInterval = setInterval(() => {
          if (isOnline.value && !isSyncing.value) {
            syncNow();
          }
        }, 60000);
      }
    }
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    syncError,
    syncNow,
    updatePendingCount,
    initListeners,
  };
}
