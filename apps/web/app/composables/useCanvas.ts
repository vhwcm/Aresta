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
  InkingStroke,
  CanvasTool,
} from '~/interfaces/canvas';
import { useAuth } from '~/composables/useAuth';
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository';
import { computeVectorStrokePath } from '~/utils/vectorDrawing';

// Shared module-level reactive state across components for current active canvas session
const canvasesList = ref<CanvasSummary[]>([]);
const canvasFolders = ref<string[]>([]);
const currentCanvas = ref<CanvasItem | null>(null);
const nodes = ref<CanvasNode[]>([]);
const edges = ref<CanvasEdge[]>([]);
const strokes = ref<InkingStroke[]>([]);
const viewport = ref<CanvasViewport>({ x: 0, y: 0, zoom: 1.0 });

const selectedNodeIds = ref<string[]>([]);
const selectedEdgeId = ref<string | null>(null);
const activeTool = ref<CanvasTool>('select');
const selectedShapeType = ref<CanvasShapeType>('rectangle');
const activePenColor = ref<string>('#E57B55');
const activePenWidth = ref<number>(3);

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
const undoStack = ref<Array<{ nodes: CanvasNode[]; edges: CanvasEdge[]; strokes: InkingStroke[] }>>([]);
const redoStack = ref<Array<{ nodes: CanvasNode[]; edges: CanvasEdge[]; strokes: InkingStroke[] }>>([]);
const maxHistory = 40;

let autosaveTimeout: any = null;

export function useCanvas() {
  const { token, user } = useAuth();

  const pushHistory = () => {
    redoStack.value = [];
    undoStack.value.push({
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      strokes: JSON.parse(JSON.stringify(strokes.value)),
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
      strokes: JSON.parse(JSON.stringify(strokes.value)),
    });
    nodes.value = previousState.nodes;
    edges.value = previousState.edges;
    strokes.value = previousState.strokes || [];
    triggerAutosave();
  };

  const redo = () => {
    if (redoStack.value.length === 0) return;
    const nextState = redoStack.value.pop()!;
    undoStack.value.push({
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      strokes: JSON.parse(JSON.stringify(strokes.value)),
    });
    nodes.value = nextState.nodes;
    edges.value = nextState.edges;
    strokes.value = nextState.strokes || [];
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

  // Operações de Traços (Caneta & Borracha)
  const addStroke = (stroke: InkingStroke, saveHistory = true): InkingStroke => {
    if (saveHistory) pushHistory();
    const path = stroke.path || computeVectorStrokePath(stroke.points, stroke.tool || 'pen', stroke.width || 3);
    const finalStroke: InkingStroke = {
      ...stroke,
      id: stroke.id || `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      path,
    };
    strokes.value.push(finalStroke);
    triggerAutosave();
    return finalStroke;
  };

  const eraseStrokesAt = (coords: { x: number; y: number }, radius = 18): boolean => {
    const initialLen = strokes.value.length;
    if (initialLen === 0) return false;

    const r2 = radius * radius;
    const remaining = strokes.value.filter((stroke) => {
      return !stroke.points.some((pt) => {
        const dx = pt.x - coords.x;
        const dy = pt.y - coords.y;
        return dx * dx + dy * dy <= r2;
      });
    });

    if (remaining.length !== initialLen) {
      pushHistory();
      strokes.value = remaining;
      triggerAutosave();
      return true;
    }
    return false;
  };

  const clearAllStrokes = () => {
    if (strokes.value.length === 0) return;
    pushHistory();
    strokes.value = [];
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
    strokes.value = [];
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
      strokes: strokes.value,
    };
    return JSON.stringify(doc);
  };

  const deserializeDocument = (dataStr: string) => {
    try {
      const parsed: CanvasDocument = JSON.parse(dataStr);
      nodes.value = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      edges.value = Array.isArray(parsed.edges) ? parsed.edges : [];
      strokes.value = Array.isArray(parsed.strokes) ? parsed.strokes : [];
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

      await canvasRepo.save({
        id: currentCanvas.value.id,
        name: currentCanvas.value.title,
        description: currentCanvas.value.description,
        document: parsedDoc,
      });

      if (currentCanvas.value) {
        currentCanvas.value.data = payloadData;
      }
    } catch (err: any) {
      console.warn('Erro ao salvar canvas localmente:', err);
    } finally {
      isSaving.value = false;
    }
  };

  const fetchCanvases = async (params: { folder?: string; tag?: string; search?: string } = {}) => {
    isLoading.value = true;
    error.value = null;

    try {
      const localCanvases = await canvasRepo.getAll();
      let list = localCanvases || [];
      if (params.folder !== undefined && params.folder !== '') {
        list = list.filter((c: any) => c.folder === params.folder);
      }
      if (params.tag) {
        list = list.filter((c: any) => c.tags?.includes(params.tag));
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter((c: any) => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
      }

      canvasesList.value = list.map((c: any) => ({
        id: c.id,
        title: c.name,
        description: c.description || null,
        folder: c.folder || null,
        tags: c.tags || [],
        nodeCount: c.nodeCount || c.document?.nodes?.length || 0,
        edgeCount: c.edgeCount || c.document?.edges?.length || 0,
        noteIds: Array.isArray(c.document?.nodes)
          ? c.document.nodes
              .filter((n: any) => n && n.type === 'note_embed' && n.noteId)
              .map((n: any) => n.noteId)
          : [],
        updatedAt: c.updated_at,
      }));

      return canvasesList.value;
    } catch (err: any) {
      console.warn('[useCanvas] Erro ao carregar quadros locais:', err);
      return canvasesList.value;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCanvasFolders = async (): Promise<string[]> => {
    try {
      const all = await canvasRepo.getAll();
      const set = new Set<string>();
      all.forEach((c: any) => {
        if (c.folder) set.add(c.folder);
      });
      canvasFolders.value = Array.from(set);
      return canvasFolders.value;
    } catch (e) {
      return [];
    }
  };

  const loadCanvas = async (id: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const local = await canvasRepo.getById(id);
      if (local) {
        const item: CanvasItem = {
          id: local.id,
          title: local.name,
          description: local.description || null,
          folder: (local as any).folder || null,
          tags: (local as any).tags || [],
          data: JSON.stringify(local.document || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }),
          createdAt: local.updated_at,
          updatedAt: local.updated_at,
        };
        currentCanvas.value = item;
        deserializeDocument(item.data);
        return item;
      }
      error.value = 'Quadro não encontrado.';
      return null;
    } catch (err: any) {
      error.value = 'Quadro não encontrado.';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const createCanvas = async (
    optionsOrTitle: { title?: string; description?: string | null; folder?: string | null; tags?: string[]; initialData?: string } | string = 'Quadro sem título',
    initialData?: string
  ) => {
    isLoading.value = true;
    const localId = `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const title = typeof optionsOrTitle === 'string' ? optionsOrTitle : (optionsOrTitle.title || 'Quadro sem título');
    const description = typeof optionsOrTitle === 'string' ? null : (optionsOrTitle.description || null);
    const folder = typeof optionsOrTitle === 'string' ? null : (optionsOrTitle.folder || null);
    const tags = typeof optionsOrTitle === 'string' ? [] : (optionsOrTitle.tags || []);
    const defaultData = (typeof optionsOrTitle === 'object' && optionsOrTitle.initialData)
      ? optionsOrTitle.initialData
      : (initialData || '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}');

    let parsedDoc: any = {};
    try {
      parsedDoc = JSON.parse(defaultData);
    } catch (e) {
      parsedDoc = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
    }

    await canvasRepo.save({
      id: localId,
      name: title,
      description,
      document: parsedDoc,
    });

    const localItem: CanvasItem = {
      id: localId,
      title,
      description,
      folder,
      tags,
      data: defaultData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    canvasesList.value.unshift({
      id: localId,
      title,
      description,
      folder,
      tags,
      nodeCount: parsedDoc.nodes?.length || 0,
      edgeCount: parsedDoc.edges?.length || 0,
      updatedAt: localItem.updatedAt,
    });
    currentCanvas.value = localItem;
    deserializeDocument(defaultData);
    isLoading.value = false;
    return localItem;
  };

  const updateCanvasMetadata = async (
    id: string,
    metadata: { title?: string; description?: string | null; folder?: string | null; tags?: string[] }
  ) => {
    const existing = await canvasRepo.getById(id);
    if (existing) {
      await canvasRepo.save({
        id,
        name: metadata.title !== undefined ? metadata.title : existing.name,
        description: metadata.description !== undefined ? metadata.description : existing.description,
        document: existing.document,
      });
    }

    if (currentCanvas.value?.id === id) {
      if (metadata.title !== undefined) currentCanvas.value.title = metadata.title;
      if (metadata.description !== undefined) currentCanvas.value.description = metadata.description;
      if (metadata.folder !== undefined) currentCanvas.value.folder = metadata.folder;
      if (metadata.tags !== undefined) currentCanvas.value.tags = metadata.tags;
    }

    canvasesList.value = canvasesList.value.map((c) =>
      c.id === id
        ? {
            ...c,
            ...(metadata.title !== undefined ? { title: metadata.title } : {}),
            ...(metadata.description !== undefined ? { description: metadata.description } : {}),
            ...(metadata.folder !== undefined ? { folder: metadata.folder } : {}),
            ...(metadata.tags !== undefined ? { tags: metadata.tags } : {}),
          }
        : c
    );
    return currentCanvas.value;
  };

  const deleteCanvas = async (id: string) => {
    await canvasRepo.delete(id);
    canvasesList.value = canvasesList.value.filter((c) => c.id !== id);
    if (currentCanvas.value?.id === id) {
      currentCanvas.value = null;
      nodes.value = [];
      edges.value = [];
    }
  };

  const duplicateCanvas = async (id: string) => {
    const orig = await canvasRepo.getById(id);
    if (!orig) throw new Error('Quadro original não encontrado.');
    const newDoc = JSON.stringify(orig.document || {});
    return createCanvas({
      title: `${orig.name} (Cópia)`,
      description: orig.description,
      initialData: newDoc,
    });
  };

  const exportAsSvg = () => {
    if (!currentCanvas.value) return;

    let minX = 0;
    let minY = 0;
    let maxX = 1200;
    let maxY = 800;

    const allX: number[] = [];
    const allY: number[] = [];

    nodes.value.forEach((n) => {
      allX.push(n.x, n.x + n.width);
      allY.push(n.y, n.y + n.height);
    });

    strokes.value.forEach((s) => {
      s.points.forEach((p) => {
        allX.push(p.x);
        allY.push(p.y);
      });
    });

    if (allX.length > 0 && allY.length > 0) {
      minX = Math.min(...allX) - 50;
      minY = Math.min(...allY) - 50;
      maxX = Math.max(...allX) + 50;
      maxY = Math.max(...allY) + 50;
    }

    const width = Math.max(200, maxX - minX);
    const height = Math.max(200, maxY - minY);

    const strokesSvg = strokes.value
      .map((s) => {
        const path = s.path || computeVectorStrokePath(s.points, s.tool || 'pen', s.width || 3);
        const opacity = s.opacity ?? (s.tool === 'highlighter' ? 0.4 : 1);
        const style = s.tool === 'highlighter' ? 'style="mix-blend-mode: multiply;"' : '';
        return `    <path d="${path}" fill="${s.color || '#E57B55'}" opacity="${opacity}" ${style} />`;
      })
      .join('\n');

    const escapeXml = (str: string): string => {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const nodesSvg = nodes.value
      .map((n) => {
        if (n.type === 'image' && n.imageUrl) {
          const safeUrl = escapeXml(n.imageUrl);
          return `    <g id="node-${n.id}">
      <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="12" fill="#FAFAF9" stroke="${n.color || '#E57B55'}" stroke-width="2" />
      <image x="${n.x + 2}" y="${n.y + 2}" width="${n.width - 4}" height="${n.height - 4}" href="${safeUrl}" xlink:href="${safeUrl}" preserveAspectRatio="xMidYMid meet" />
    </g>`;
        }
        const safeText = escapeXml(n.text || '');
        return `    <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="12" fill="#FFFFFF" stroke="${n.color || '#E57B55'}" stroke-width="2" />
    <text x="${n.x + 12}" y="${n.y + 24}" font-family="sans-serif" font-size="14" fill="#18181B">${safeText}</text>`;
      })
      .join('\n');

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" shape-rendering="geometricPrecision">
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#FAFAF9" />
  <g id="strokes">
${strokesSvg}
  </g>
  <g id="nodes">
${nodesSvg}
  </g>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCanvas.value.title.replace(/[^a-z0-9_ -]/gi, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    canvasFolders,
    currentCanvas,
    nodes,
    edges,
    strokes,
    viewport,
    selectedNodeIds,
    selectedEdgeId,
    activeTool,
    activePenColor,
    activePenWidth,
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
    addStroke,
    eraseStrokesAt,
    clearAllStrokes,
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
    fetchCanvasFolders,
    loadCanvas,
    createCanvas,
    updateCanvasMetadata,
    deleteCanvas,
    duplicateCanvas,
    exportAsJsonCanvas,
    exportAsSvg,
    importJsonCanvas,
  };
}
