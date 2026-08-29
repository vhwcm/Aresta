import { ref, computed } from 'vue';
import type {
  CanvasNode,
  CanvasEdge,
  CanvasViewport,
  CanvasDocument,
  CanvasSummary,
  CanvasItem,
  CanvasSide,
  CanvasShapeType,
} from '~/interfaces/canvas';
import { useAuth } from '~/composables/useAuth';
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository';

const API_BASE = 'http://localhost:7070/api';

// Shared module-level reactive state across components for current active canvas session
const canvasesList = ref<CanvasSummary[]>([]);
const currentCanvas = ref<CanvasItem | null>(null);
const nodes = ref<CanvasNode[]>([]);
const edges = ref<CanvasEdge[]>([]);
const viewport = ref<CanvasViewport>({ x: 0, y: 0, zoom: 1.0 });

const selectedNodeIds = ref<string[]>([]);
const selectedEdgeId = ref<string | null>(null);
const activeTool = ref<'select' | 'note' | 'shape' | 'loose_text' | 'pen'>('select');
const selectedShapeType = ref<CanvasShapeType>('rectangle');

const connectingState = ref<{
  fromNodeId: string;
  fromSide: CanvasSide;
  currentX: number;
  currentY: number;
} | null>(null);

const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);

// Histórico para Undo / Redo
const undoStack = ref<Array<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>>([]);
const redoStack = ref<Array<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>>([]);
const maxHistory = 40;

let autosaveTimeout: any = null;

export function useCanvas() {
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

  const pushHistory = () => {
    redoStack.value = [];
    undoStack.value.push({
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    });
    if (undoStack.value.length > maxHistory) {
      undoStack.value.shift();
    }
  };

  const undo = () => {
    if (undoStack.value.length === 0) return;
    const previousState = undoStack.value.pop()!;
    redoStack.value.push({
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    });
    nodes.value = previousState.nodes;
    edges.value = previousState.edges;
    triggerAutosave();
  };

  const redo = () => {
    if (redoStack.value.length === 0) return;
    const nextState = redoStack.value.pop()!;
    undoStack.value.push({
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    });
    nodes.value = nextState.nodes;
    edges.value = nextState.edges;
    triggerAutosave();
  };

  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  // Operações de Nós
  const addNode = (node: CanvasNode, saveHistory = true) => {
    if (saveHistory) pushHistory();
    nodes.value.push(node);
    selectedNodeIds.value = [node.id];
    selectedEdgeId.value = null;
    triggerAutosave();
    return node;
  };

  const updateNode = (id: string, updates: Partial<CanvasNode>, saveHistory = false) => {
    if (saveHistory) pushHistory();
    const index = nodes.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      const current = nodes.value[index]!;
      nodes.value[index] = { ...current, ...updates } as CanvasNode;
      triggerAutosave();
    }
  };

  const removeNode = (id: string) => {
    pushHistory();
    nodes.value = nodes.value.filter((n) => n.id !== id);
    edges.value = edges.value.filter((e) => e.fromNode !== id && e.toNode !== id);
    selectedNodeIds.value = selectedNodeIds.value.filter((i) => i !== id);
    triggerAutosave();
  };

  const removeSelected = () => {
    if (selectedNodeIds.value.length === 0 && !selectedEdgeId.value) return;
    pushHistory();
    if (selectedNodeIds.value.length > 0) {
      const idsToRemove = new Set(selectedNodeIds.value);
      nodes.value = nodes.value.filter((n) => !idsToRemove.has(n.id));
      edges.value = edges.value.filter(
        (e) => !idsToRemove.has(e.fromNode) && !idsToRemove.has(e.toNode)
      );
      selectedNodeIds.value = [];
    }
    if (selectedEdgeId.value) {
      edges.value = edges.value.filter((e) => e.id !== selectedEdgeId.value);
      selectedEdgeId.value = null;
    }
    triggerAutosave();
  };

  // Operações de Arestas (Conexões)
  const addEdge = (edge: CanvasEdge) => {
    // Evitar conexões duplicadas exatas
    const exists = edges.value.some(
      (e) =>
        e.fromNode === edge.fromNode &&
        e.fromSide === edge.fromSide &&
        e.toNode === edge.toNode &&
        e.toSide === edge.toSide
    );
    if (exists) return null;

    pushHistory();
    edges.value.push(edge);
    selectedEdgeId.value = edge.id;
    selectedNodeIds.value = [];
    triggerAutosave();
    return edge;
  };

  const removeEdge = (id: string) => {
    pushHistory();
    edges.value = edges.value.filter((e) => e.id !== id);
    if (selectedEdgeId.value === id) selectedEdgeId.value = null;
    triggerAutosave();
  };

  // Viewport & Navegação
  const setViewport = (newViewport: CanvasViewport) => {
    viewport.value = {
      x: newViewport.x,
      y: newViewport.y,
      zoom: Math.min(Math.max(newViewport.zoom, 0.1), 3.0),
    };
    triggerAutosave();
  };

  const panBy = (dx: number, dy: number) => {
    viewport.value.x += dx;
    viewport.value.y += dy;
  };

  const zoomAt = (focalX: number, focalY: number, factor: number) => {
    const oldZoom = viewport.value.zoom;
    const newZoom = Math.min(Math.max(oldZoom * factor, 0.1), 3.0);
    if (newZoom === oldZoom) return;

    const canvasX = (focalX - viewport.value.x) / oldZoom;
    const canvasY = (focalY - viewport.value.y) / oldZoom;

    viewport.value.x = focalX - canvasX * newZoom;
    viewport.value.y = focalY - canvasY * newZoom;
    viewport.value.zoom = newZoom;
    triggerAutosave();
  };

  const resetViewport = () => {
    viewport.value = { x: 0, y: 0, zoom: 1.0 };
    triggerAutosave();
  };

  const resetCanvasState = () => {
    nodes.value = [];
    edges.value = [];
    selectedNodeIds.value = [];
    selectedEdgeId.value = null;
    activeTool.value = 'select';
    viewport.value = { x: 0, y: 0, zoom: 1.0 };
    undoStack.value = [];
    redoStack.value = [];
    currentCanvas.value = null;
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
      autosaveTimeout = null;
    }
  };

  // Serialização e Persistência
  const serializeDocument = (): string => {
    const doc: CanvasDocument = {
      nodes: nodes.value,
      edges: edges.value,
      viewport: viewport.value,
    };
    return JSON.stringify(doc);
  };

  const deserializeDocument = (dataStr: string) => {
    try {
      const parsed: CanvasDocument = JSON.parse(dataStr);
      nodes.value = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      edges.value = Array.isArray(parsed.edges) ? parsed.edges : [];
      if (parsed.viewport) {
        viewport.value = {
          x: Number(parsed.viewport.x) || 0,
          y: Number(parsed.viewport.y) || 0,
          zoom: Number(parsed.viewport.zoom) || 1.0,
        };
      }
      undoStack.value = [];
      redoStack.value = [];
    } catch (e) {
      console.error('Erro ao desserializar CanvasDocument:', e);
    }
  };

  const triggerAutosave = () => {
    if (!currentCanvas.value) return;
    if (autosaveTimeout) clearTimeout(autosaveTimeout);

    autosaveTimeout = setTimeout(() => {
      saveCanvasNow();
    }, 750);
  };

  const saveCanvasNow = async () => {
    if (!currentCanvas.value) return;
    isSaving.value = true;
    const payloadData = serializeDocument();
    try {
      let parsedDoc: any = {};
      try {
        parsedDoc = JSON.parse(payloadData);
      } catch (e) {
        parsedDoc = { nodes: nodes.value, edges: edges.value, viewport: viewport.value };
      }

      // 1. Salva localmente primeiro (Local-First)
      await canvasRepo.save({
        id: currentCanvas.value.id,
        name: currentCanvas.value.title,
        description: currentCanvas.value.description,
        document: parsedDoc,
      });

      // 2. Se online, envia para a API
      await $fetch(`${API_BASE}/canvases/${currentCanvas.value.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: {
          title: currentCanvas.value.title,
          description: currentCanvas.value.description,
          data: payloadData,
        },
      });
      if (currentCanvas.value) {
        currentCanvas.value.data = payloadData;
      }
    } catch (err: any) {
      console.warn('Canvas salvo localmente (offline mode):', err);
    } finally {
      isSaving.value = false;
    }
  };

  const fetchCanvases = async () => {
    isLoading.value = true;
    error.value = null;

    // 1. Carrega do banco local
    try {
      const localCanvases = await canvasRepo.getAll();
      if (localCanvases && localCanvases.length > 0) {
        canvasesList.value = localCanvases.map((c) => ({
          id: c.id,
          title: c.name,
          description: c.description || null,
          nodeCount: c.nodeCount || 0,
          edgeCount: c.edgeCount || 0,
          updatedAt: c.updated_at,
        }));
      }
    } catch (e) {
      console.warn('[useCanvas] Falha ao ler banco local:', e);
    }

    // 2. Sincroniza se online
    try {
      const list = await $fetch<CanvasSummary[]>(`${API_BASE}/canvases`, {
        headers: getHeaders(),
      });
      if (Array.isArray(list)) {
        canvasesList.value = list;
      }
      return canvasesList.value;
    } catch (err: any) {
      if (canvasesList.value.length === 0) {
        error.value = 'Falha ao carregar lista de quadros.';
      }
      return canvasesList.value;
    } finally {
      isLoading.value = false;
    }
  };

  const loadCanvas = async (id: string) => {
    isLoading.value = true;
    error.value = null;

    // 1. Carrega primeiro do banco local
    try {
      const local = await canvasRepo.getById(id);
      if (local) {
        const item: CanvasItem = {
          id: local.id,
          title: local.name,
          description: local.description || null,
          data: JSON.stringify(local.document || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }),
          createdAt: local.updated_at,
          updatedAt: local.updated_at,
        };
        currentCanvas.value = item;
        deserializeDocument(item.data);
      }
    } catch (e) {
      console.warn('[useCanvas] Falha ao carregar canvas local:', e);
    }

    // 2. Busca da API se online
    try {
      const item = await $fetch<CanvasItem>(`${API_BASE}/canvases/${id}`, {
        headers: getHeaders(),
      });
      currentCanvas.value = item;
      deserializeDocument(item.data);

      let parsedDoc: any = {};
      try {
        parsedDoc = JSON.parse(item.data);
      } catch (e) {
        parsedDoc = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
      }
      await canvasRepo.save({
        id: item.id,
        name: item.title,
        description: item.description,
        document: parsedDoc,
      });

      return item;
    } catch (err: any) {
      if (!currentCanvas.value) {
        error.value = 'Quadro não encontrado.';
      }
      return currentCanvas.value;
    } finally {
      isLoading.value = false;
    }
  };

  const createCanvas = async (title = 'Quadro sem título', initialData?: string) => {
    isLoading.value = true;
    const localId = `canvas_${Date.now()}`;
    const defaultData = initialData || '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}';

    let parsedDoc: any = {};
    try {
      parsedDoc = JSON.parse(defaultData);
    } catch (e) {
      parsedDoc = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
    }

    // Salva localmente primeiro
    await canvasRepo.save({
      id: localId,
      name: title,
      document: parsedDoc,
    });

    const localItem: CanvasItem = {
      id: localId,
      title,
      description: null,
      data: defaultData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    canvasesList.value.unshift({
      id: localId,
      title,
      description: null,
      nodeCount: parsedDoc.nodes?.length || 0,
      edgeCount: parsedDoc.edges?.length || 0,
      updatedAt: localItem.updatedAt,
    });
    currentCanvas.value = localItem;

    try {
      const created = await $fetch<CanvasItem>(`${API_BASE}/canvases`, {
        method: 'POST',
        headers: getHeaders(),
        body: {
          title,
          data: defaultData,
        },
      });
      if (created) {
        await canvasRepo.delete(localId);
        await canvasRepo.save({
          id: created.id,
          name: created.title,
          description: created.description,
          document: parsedDoc,
        });
        canvasesList.value = canvasesList.value.map((c) => (c.id === localId ? { ...c, id: created.id } : c));
        currentCanvas.value = created;
        return created;
      }
      return localItem;
    } catch (err: any) {
      console.warn('Quadro criado localmente (offline mode):', err);
      return localItem;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteCanvas = async (id: string) => {
    await canvasRepo.delete(id);
    canvasesList.value = canvasesList.value.filter((c) => c.id !== id);
    if (currentCanvas.value?.id === id) {
      currentCanvas.value = null;
      nodes.value = [];
      edges.value = [];
    }

    try {
      await $fetch(`${API_BASE}/canvases/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (err: any) {
      console.warn('Exclusão persistida localmente para sincronização:', err);
    }
  };

  const duplicateCanvas = async (id: string) => {
    try {
      const dup = await $fetch<CanvasItem>(`${API_BASE}/canvases/${id}/duplicate`, {
        method: 'POST',
        headers: getHeaders(),
      });
      await fetchCanvases();
      return dup;
    } catch (err: any) {
      console.error('Erro ao duplicar quadro:', err);
      throw err;
    }
  };

  const exportAsJsonCanvas = () => {
    if (!currentCanvas.value) return;
    const jsonStr = serializeDocument();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCanvas.value.title.replace(/[^a-z0-9_ -]/gi, '_')}.canvas`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importJsonCanvas = async (file: File) => {
    const text = await file.text();
    const title = file.name.replace(/\.canvas$/i, '').replace(/\.json$/i, '') || 'Quadro Importado';
    return await createCanvas(title, text);
  };

  return {
    canvasesList,
    currentCanvas,
    nodes,
    edges,
    viewport,
    selectedNodeIds,
    selectedEdgeId,
    activeTool,
    selectedShapeType,
    connectingState,
    isLoading,
    isSaving,
    error,
    canUndo,
    canRedo,
    pushHistory,
    undo,
    redo,
    addNode,
    updateNode,
    removeNode,
    removeSelected,
    addEdge,
    removeEdge,
    setViewport,
    panBy,
    zoomAt,
    resetViewport,
    resetCanvasState,
    serializeDocument,
    deserializeDocument,
    triggerAutosave,
    saveCanvasNow,
    fetchCanvases,
    loadCanvas,
    createCanvas,
    deleteCanvas,
    duplicateCanvas,
    exportAsJsonCanvas,
    importJsonCanvas,
  };
}
