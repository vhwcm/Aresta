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

import { getApiBase } from '~/utils/apiBase';

const getDrawingApiUrl = () => {
  return `${getApiBase()}/drawings`;
};

const LOCAL_STORAGE_KEY_PREFIX = 'aresta_drawing_';

const drawingsList = ref<Array<{
  id: string;
  title: string;
  folder: string | null;
  tags: string[];
  pagesCount: number;
  preview_url: string | null;
  created_at?: string;
  updated_at?: string;
}>>([]);

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
  const { token } = useAuth();

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

    // Salva cópia local no localStorage imediatamente para resiliência offline
    if (currentDrawing.value && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `${LOCAL_STORAGE_KEY_PREFIX}${currentDrawing.value.id}`,
          JSON.stringify(currentDrawing.value)
        );
      } catch (e) {
        console.warn('[useDrawing] Falha no backup local:', e);
      }
    }

    autosaveTimer = setTimeout(() => {
      saveDrawingNow();
    }, 1500);
  };

  const saveDrawingNow = async () => {
    if (!currentDrawing.value) return;
    isSaving.value = true;
    try {
      const pagesDataJson = JSON.stringify(currentDrawing.value.pages);
      const payload = {
        title: currentDrawing.value.title,
        folder: currentDrawing.value.folder,
        tags: currentDrawing.value.tags,
        pages_data: pagesDataJson,
        preview_url: currentDrawing.value.preview_url || null,
      };

      await $fetch(`${getDrawingApiUrl()}/${currentDrawing.value.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: payload,
      });

      // Atualiza na listagem
      const idx = drawingsList.value.findIndex((d) => d.id === currentDrawing.value?.id);
      if (idx !== -1) {
        drawingsList.value[idx] = {
          ...drawingsList.value[idx],
          title: currentDrawing.value.title,
          folder: currentDrawing.value.folder,
          tags: currentDrawing.value.tags,
          pagesCount: currentDrawing.value.pages.length,
          preview_url: currentDrawing.value.preview_url || null,
          updated_at: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.error('[useDrawing] Erro ao sincronizar desenho:', err);
    } finally {
      isSaving.value = false;
    }
  };

  const fetchDrawings = async (query: { folder?: string; search?: string } = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (query.folder) params.append('folder', query.folder);
      if (query.search) params.append('search', query.search);

      const url = `${getDrawingApiUrl()}${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await $fetch<{ drawings: any[] }>(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      drawingsList.value = res?.drawings || [];
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

    // Tenta primeiro carregar do backup local se disponível para render instantâneo
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`);
        if (local) {
          currentDrawing.value = JSON.parse(local);
        }
      } catch {
        // Fallback
      }
    }

    try {
      const res = await $fetch<any>(`${getDrawingApiUrl()}/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      const pages: DrawingPage[] = Array.isArray(res.pages) && res.pages.length > 0
        ? res.pages
        : [
            {
              id: 'page-1',
              pageNumber: 1,
              width: 794,
              height: 1123,
              backgroundType: 'blank',
              strokes: [],
            },
          ];

      const doc: DrawingDocument = {
        id: res.id,
        title: res.title || 'Desenho sem título',
        folder: res.folder || null,
        tags: res.tags || [],
        pages,
        preview_url: res.preview_url || null,
        created_at: res.created_at,
        updated_at: res.updated_at,
      };

      currentDrawing.value = doc;
      activePageIndex.value = 0;
      return doc;
    } catch (err: any) {
      console.error('[useDrawing] Erro ao carregar desenho:', err);
      error.value = err.message || 'Erro ao carregar desenho.';
      return currentDrawing.value;
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

      const res = await $fetch<any>(getDrawingApiUrl(), {
        method: 'POST',
        headers: getHeaders(),
        body: {
          title: params.title || 'Desenho sem título',
          folder: params.folder || null,
          tags: params.tags || [],
          pages_data: JSON.stringify(initialPages),
        },
      });

      const newDoc: DrawingDocument = {
        id: res.id,
        title: res.title,
        folder: res.folder,
        tags: params.tags || [],
        pages: initialPages,
      };

      currentDrawing.value = newDoc;
      drawingsList.value.unshift({
        id: res.id,
        title: res.title,
        folder: res.folder,
        tags: params.tags || [],
        pagesCount: 1,
        preview_url: null,
        created_at: res.created_at,
        updated_at: res.updated_at,
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
      await $fetch(`${getDrawingApiUrl()}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      drawingsList.value = drawingsList.value.filter((d) => d.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`);
      }
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
    const initialLen = page.strokes.length;

    const remainingStrokes = page.strokes.filter((stroke) => {
      // Verifica se algum ponto do traço está no raio da borracha
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
    if (!page.nodes) return;
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
    if (!page.nodes) return;
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
    if (!page.edges) return;
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
        `${getDrawingApiUrl()}/${currentDrawing.value.id}/synthesize`,
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
      console.error('[useDrawing] Erro ao sintetizar com IA:', err);
      throw err;
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
    try {
      const res = await $fetch<any>(`${getDrawingApiUrl()}/${drawingId}/convert-to-note`, {
        method: 'POST',
        headers: getHeaders(),
        body: payload,
      });

      if (payload.deleteOriginal) {
        drawingsList.value = drawingsList.value.filter((d) => d.id !== drawingId);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${drawingId}`);
        }
      }
      return res;
    } catch (err: any) {
      console.error('[useDrawing] Erro ao converter para nota:', err);
      throw err;
    }
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
