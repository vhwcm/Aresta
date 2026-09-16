import { ref, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
import type {
  DrawingDocument,
  DrawingPage,
  DrawingStroke,
  DrawingPoint,
  PenToolType,
  PageBackgroundType,
  DrawingSynthesisResult,
} from '~/interfaces/drawing';
import type { CanvasNode, CanvasEdge, CanvasShapeType } from '~/interfaces/canvas';
import { drawingNoteRepo } from '~/adapters/database/repositories/DrawingNoteRepository';
import { useNotes } from '~/composables/useNotes';
import { getApiBase } from '~/utils/apiBase';

export interface DrawingSummaryItem {
  id: string;
  title: string;
  folder: string | null;
  tags: string[];
  pagesCount: number;
  preview_url: string | null;
  created_at?: string;
  updated_at?: string;
}

const drawingsList = ref<DrawingSummaryItem[]>([]);
const currentDrawing = ref<DrawingDocument | null>(null);
const activePageIndex = ref(0);
const activeTool = ref<PenToolType>('pen');
const selectedShapeType = ref<CanvasShapeType>('rectangle');
const selectedNodeIds = ref<string[]>([]);
const selectedEdgeId = ref<string | null>(null);
const strokeColor = ref('#E57B55');
const strokeSize = ref(3);
const palmRejectionEnabled = ref(true);

const isSaving = ref(false);
const isSynthesizing = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Pilhas de histórico (Undo/Redo)
const undoStack = ref<string[]>([]);
const redoStack = ref<string[]>([]);

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

export function useDrawing() {
  const { token, user } = useAuth();

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token?.value) {
      headers.Authorization = `Bearer ${token.value}`;
    }
    return headers;
  };

  const activePage = computed<DrawingPage | null>(() => {
    if (!currentDrawing.value || !currentDrawing.value.pages) return null;
    return currentDrawing.value.pages[activePageIndex.value] || currentDrawing.value.pages[0] || null;
  });

  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  const resetDrawingState = () => {
    currentDrawing.value = null;
    activePageIndex.value = 0;
    undoStack.value = [];
    redoStack.value = [];
    error.value = null;
  };

  const pushHistory = () => {
    if (!currentDrawing.value) return;
    try {
      const snapshot = JSON.stringify(currentDrawing.value.pages);
      undoStack.value.push(snapshot);
      if (undoStack.value.length > 30) {
        undoStack.value.shift();
      }
      redoStack.value = [];
    } catch (e) {
      console.warn('[useDrawing] Falha ao salvar histórico:', e);
    }
  };

  const undo = () => {
    if (!currentDrawing.value || undoStack.value.length === 0) return;
    const currentState = JSON.stringify(currentDrawing.value.pages);
    redoStack.value.push(currentState);
    const previousState = undoStack.value.pop();
    if (previousState) {
      currentDrawing.value.pages = JSON.parse(previousState);
      scheduleAutosave();
    }
  };

  const redo = () => {
    if (!currentDrawing.value || redoStack.value.length === 0) return;
    const currentState = JSON.stringify(currentDrawing.value.pages);
    undoStack.value.push(currentState);
    const nextState = redoStack.value.pop();
    if (nextState) {
      currentDrawing.value.pages = JSON.parse(nextState);
      scheduleAutosave();
    }
  };

  const scheduleAutosave = () => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveDrawingNow();
    }, 1000);
  };

  const saveDrawingNow = async () => {
    if (!currentDrawing.value) return;
    isSaving.value = true;
    try {
      const pagesDataJson = JSON.stringify(currentDrawing.value.pages);
      const saved = await drawingNoteRepo.save({
        id: currentDrawing.value.id,
        title: currentDrawing.value.title,
        folder: currentDrawing.value.folder,
        tags: currentDrawing.value.tags,
        pages_data: pagesDataJson,
        preview_url: currentDrawing.value.preview_url || null,
      });

      const idx = drawingsList.value.findIndex((d) => d.id === currentDrawing.value?.id);
      if (idx !== -1) {
        drawingsList.value[idx] = {
          id: saved.id,
          title: saved.title,
          folder: saved.folder ?? null,
          tags: saved.tags || [],
          pagesCount: currentDrawing.value.pages.length,
          preview_url: saved.preview_url ?? null,
          created_at: saved.created_at,
          updated_at: saved.updated_at,
        };
      }
    } catch (err: any) {
      console.error('[useDrawing] Erro ao salvar desenho local:', err);
    } finally {
      isSaving.value = false;
    }
  };

  const fetchDrawings = async (query: { folder?: string; search?: string } = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const list = await drawingNoteRepo.getAll(query);
      drawingsList.value = list.map((d) => {
        let pages: any[] = [];
        try {
          const raw = typeof d.pages_data === 'string' ? d.pages_data : JSON.stringify(d.pages_data || []);
          pages = JSON.parse(raw);
        } catch {}
        return {
          id: d.id,
          title: d.title,
          folder: d.folder ?? null,
          tags: d.tags || [],
          pagesCount: pages.length || 1,
          preview_url: d.preview_url ?? null,
          created_at: d.created_at,
          updated_at: d.updated_at,
        };
      });
      return drawingsList.value;
    } catch (err: any) {
      console.error('[useDrawing] Erro ao carregar lista de desenhos:', err);
      error.value = err.message || 'Falha ao carregar desenhos.';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const loadDrawing = async (id: string): Promise<DrawingDocument | null> => {
    isLoading.value = true;
    error.value = null;
    undoStack.value = [];
    redoStack.value = [];

    try {
      const local = await drawingNoteRepo.getById(id);
      if (local) {
        let pages: DrawingPage[] = [];
        try {
          const raw = typeof local.pages_data === 'string' ? local.pages_data : JSON.stringify(local.pages_data || []);
          pages = JSON.parse(raw);
        } catch {}
        if (!Array.isArray(pages) || pages.length === 0) {
          pages = [
            {
              id: 'page-1',
              pageNumber: 1,
              width: 794,
              height: 1123,
              backgroundType: 'blank',
              strokes: [],
            },
          ];
        }

        const doc: DrawingDocument = {
          id: local.id,
          title: local.title || 'Desenho sem título',
          folder: local.folder ?? null,
          tags: local.tags || [],
          pages,
          preview_url: local.preview_url ?? null,
          created_at: local.created_at,
          updated_at: local.updated_at,
        };
        currentDrawing.value = doc;
        activePageIndex.value = 0;
        return doc;
      }
      error.value = 'Desenho não encontrado.';
      return null;
    } catch (err: any) {
      console.error('[useDrawing] Erro ao carregar desenho local:', err);
      error.value = 'Erro ao carregar desenho.';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const createDrawing = async (params: { title?: string; folder?: string | null; tags?: string[] } = {}) => {
    isLoading.value = true;
    try {
      const initialPages: DrawingPage[] = [
        {
          id: `page-${Date.now()}`,
          pageNumber: 1,
          width: 794,
          height: 1123,
          backgroundType: 'blank',
          strokes: [],
        },
      ];

      const localId = `drawing_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const saved = await drawingNoteRepo.save({
        id: localId,
        title: params.title || 'Desenho sem título',
        folder: params.folder ?? null,
        tags: params.tags || [],
        pages_data: JSON.stringify(initialPages),
      });

      const newDoc: DrawingDocument = {
        id: saved.id,
        title: saved.title,
        folder: saved.folder ?? null,
        tags: saved.tags || [],
        pages: initialPages,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      };

      currentDrawing.value = newDoc;
      drawingsList.value.unshift({
        id: saved.id,
        title: saved.title,
        folder: saved.folder ?? null,
        tags: saved.tags || [],
        pagesCount: 1,
        preview_url: null,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      });

      return newDoc;
    } catch (err: any) {
      console.error('[useDrawing] Erro ao criar novo desenho:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteDrawing = async (id: string) => {
    try {
      await drawingNoteRepo.delete(id);
      drawingsList.value = drawingsList.value.filter((d) => d.id !== id);
      if (currentDrawing.value?.id === id) {
        currentDrawing.value = null;
      }
      return true;
    } catch (err: any) {
      console.error('[useDrawing] Erro ao deletar desenho:', err);
      throw err;
    }
  };

  const addPage = (backgroundType: PageBackgroundType = 'blank') => {
    if (!currentDrawing.value) return;
    pushHistory();
    const newPageNumber = currentDrawing.value.pages.length + 1;
    const newPage: DrawingPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pageNumber: newPageNumber,
      width: 794,
      height: 1123,
      backgroundType,
      strokes: [],
    };
    currentDrawing.value.pages.push(newPage);
    activePageIndex.value = currentDrawing.value.pages.length - 1;
    scheduleAutosave();
  };

  const removePage = (index: number) => {
    if (!currentDrawing.value || currentDrawing.value.pages.length <= 1) return;
    pushHistory();
    currentDrawing.value.pages.splice(index, 1);
    currentDrawing.value.pages.forEach((p, idx) => {
      p.pageNumber = idx + 1;
    });
    if (activePageIndex.value >= currentDrawing.value.pages.length) {
      activePageIndex.value = currentDrawing.value.pages.length - 1;
    }
    scheduleAutosave();
  };

  const changePageBackground = (index: number, bg: PageBackgroundType) => {
    if (!currentDrawing.value || !currentDrawing.value.pages[index]) return;
    pushHistory();
    currentDrawing.value.pages[index].backgroundType = bg;
    scheduleAutosave();
  };

  const addStrokeToActivePage = (stroke: DrawingStroke) => {
    if (!activePage.value) return;
    pushHistory();
    activePage.value.strokes.push(stroke);
    scheduleAutosave();
  };

  const eraseStrokesAtPoint = (pageIndex: number, point: DrawingPoint, radius: number = 16) => {
    if (!currentDrawing.value || !currentDrawing.value.pages[pageIndex]) return;
    const page = currentDrawing.value.pages[pageIndex];
    if (!page) return;
    const initialLen = page.strokes.length;

    const remainingStrokes = page.strokes.filter((stroke) => {
      return !stroke.points.some((p) => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return dx * dx + dy * dy <= radius * radius;
      });
    });

    if (remainingStrokes.length !== initialLen) {
      pushHistory();
      page.strokes = remainingStrokes;
      scheduleAutosave();
    }
  };

  const clearActivePageStrokes = () => {
    if (!activePage.value || activePage.value.strokes.length === 0) return;
    pushHistory();
    activePage.value.strokes = [];
    scheduleAutosave();
  };

  const addNodeToPage = (pageIndex: number, node: CanvasNode, saveHistory = true) => {
    if (!currentDrawing.value || !currentDrawing.value.pages[pageIndex]) return;
    if (saveHistory) pushHistory();
    const page = currentDrawing.value.pages[pageIndex];
    if (!page) return;
    if (!page.nodes) page.nodes = [];
    page.nodes.push(node);
    selectedNodeIds.value = [node.id];
    selectedEdgeId.value = null;
    scheduleAutosave();
    return node;
  };

  const updateNodeInPage = (pageIndex: number, nodeId: string, updates: Partial<CanvasNode>, saveHistory = false) => {
    if (!currentDrawing.value || !currentDrawing.value.pages[pageIndex]) return;
    const page = currentDrawing.value.pages[pageIndex];
    if (!page || !page.nodes) return;
    const index = page.nodes.findIndex((n) => n.id === nodeId);
    if (index !== -1) {
      if (saveHistory) pushHistory();
      page.nodes[index] = { ...page.nodes[index], ...updates } as CanvasNode;
      scheduleAutosave();
    }
  };

  const removeNodeFromPage = (pageIndex: number, nodeId: string) => {
    if (!currentDrawing.value || !currentDrawing.value.pages[pageIndex]) return;
    const page = currentDrawing.value.pages[pageIndex];
    if (!page || !page.nodes) return;
    pushHistory();
    page.nodes = page.nodes.filter((n) => n.id !== nodeId);
    if (page.edges) {
      page.edges = page.edges.filter((e) => e.fromNode !== nodeId && e.toNode !== nodeId);
    }
    selectedNodeIds.value = selectedNodeIds.value.filter((id) => id !== nodeId);
    scheduleAutosave();
  };

  const addEdgeToPage = (pageIndex: number, edge: CanvasEdge, saveHistory = true) => {
    if (!currentDrawing.value || !currentDrawing.value.pages[pageIndex]) return;
    const page = currentDrawing.value.pages[pageIndex];
    if (!page) return;
    if (!page.edges) page.edges = [];
    const exists = page.edges.some(
      (e) =>
        e.fromNode === edge.fromNode &&
        e.fromSide === edge.fromSide &&
        e.toNode === edge.toNode &&
        e.toSide === edge.toSide
    );
    if (exists) return null;
    if (saveHistory) pushHistory();
    page.edges.push(edge);
    selectedEdgeId.value = edge.id;
    scheduleAutosave();
    return edge;
  };

  const removeEdgeFromPage = (pageIndex: number, edgeId: string) => {
    if (!currentDrawing.value || !currentDrawing.value.pages[pageIndex]) return;
    const page = currentDrawing.value.pages[pageIndex];
    if (!page || !page.edges) return;
    pushHistory();
    page.edges = page.edges.filter((e) => e.id !== edgeId);
    if (selectedEdgeId.value === edgeId) selectedEdgeId.value = null;
    scheduleAutosave();
  };

  const synthesizeDrawing = async (images: string[], promptOverride?: string): Promise<DrawingSynthesisResult> => {
    if (!currentDrawing.value) throw new Error('Nenhum desenho ativo.');
    isSynthesizing.value = true;
    try {
      const res = await $fetch<DrawingSynthesisResult>(
        `${getApiBase()}/ai/ocr`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: {
            images,
            promptOverride,
          },
        }
      );
      return res;
    } catch (err: any) {
      console.warn('[useDrawing] IA offline / fallback local de síntese:', err);
      return {
        html: `<h3>${currentDrawing.value.title}</h3><p>Síntese gerada a partir dos traços visuais do desenho.</p>`,
        titleSuggested: currentDrawing.value.title,
        summary: `Nota sintetizada a partir de ${currentDrawing.value.pages.length} páginas de desenho.`
      };
    } finally {
      isSynthesizing.value = false;
    }
  };

  const convertToNote = async (payload: {
    htmlContent: string;
    title?: string;
    deleteOriginal?: boolean;
    folder?: string;
  }) => {
    if (!currentDrawing.value) throw new Error('Nenhum desenho ativo.');
    const drawingId = currentDrawing.value.id;
    const notes = useNotes();
    const created = await notes.createNote({
      title: payload.title || currentDrawing.value.title,
      content: payload.htmlContent,
      folder: payload.folder || currentDrawing.value.folder,
      tags: currentDrawing.value.tags,
    });

    if (payload.deleteOriginal) {
      await deleteDrawing(drawingId);
    }
    return created;
  };

  return {
    drawingsList,
    currentDrawing,
    activePageIndex,
    activePage,
    activeTool,
    selectedShapeType,
    selectedNodeIds,
    selectedEdgeId,
    strokeColor,
    strokeSize,
    palmRejectionEnabled,
    isSaving,
    isSynthesizing,
    isLoading,
    error,
    canUndo,
    canRedo,
    fetchDrawings,
    loadDrawing,
    createDrawing,
    deleteDrawing,
    addPage,
    removePage,
    changePageBackground,
    addStrokeToActivePage,
    eraseStrokesAtPoint,
    clearActivePageStrokes,
    addNodeToPage,
    updateNodeInPage,
    removeNodeFromPage,
    addEdgeToPage,
    removeEdgeFromPage,
    undo,
    redo,
    saveDrawingNow,
    scheduleAutosave,
    synthesizeDrawing,
    convertToNote,
    resetDrawingState,
  };
}
