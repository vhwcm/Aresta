import { ref, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface InkingStroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

const API_BASE = 'http://localhost:7070/api';

export function useCanvasInking() {
  const { token } = useAuth();

  const isDrawing = ref(false);
  const strokes = ref<InkingStroke[]>([]);
  const currentStroke = ref<StrokePoint[]>([]);
  const strokeColor = ref('#E57B55');
  const strokeWidth = ref(3);
  const isTranscribing = ref(false);
  const ocrError = ref<string | null>(null);

  const hasStrokes = computed(() => strokes.value.length > 0 || currentStroke.value.length > 0);

  const boundingBox = computed<BoundingBox | null>(() => {
    const allStrokes = [...strokes.value];
    if (currentStroke.value.length > 0) {
      allStrokes.push({
        points: currentStroke.value,
        color: strokeColor.value,
        width: strokeWidth.value,
      });
    }

    if (allStrokes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const stroke of allStrokes) {
      for (const pt of stroke.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    if (!isFinite(minX) || !isFinite(minY)) return null;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(maxX - minX, 40),
      height: Math.max(maxY - minY, 30),
    };
  });

  const startStroke = (point: StrokePoint) => {
    isDrawing.value = true;
    currentStroke.value = [point];
  };

  const addPoint = (point: StrokePoint) => {
    if (!isDrawing.value) return;
    currentStroke.value.push(point);
  };

  const endStroke = () => {
    if (!isDrawing.value) return;
    if (currentStroke.value.length > 1) {
      strokes.value.push({
        points: [...currentStroke.value],
        color: strokeColor.value,
        width: strokeWidth.value,
      });
    }
    currentStroke.value = [];
    isDrawing.value = false;
  };

  const clearStrokes = () => {
    strokes.value = [];
    currentStroke.value = [];
    ocrError.value = null;
  };

  const exportStrokesToPngBase64 = (): {
    base64: string;
    bbox: BoundingBox;
  } | null => {
    const bbox = boundingBox.value;
    if (!bbox || strokes.value.length === 0) return null;

    const padding = 24;
    const canvas = document.createElement('canvas');
    const exportWidth = Math.ceil(bbox.width + padding * 2);
    const exportHeight = Math.ceil(bbox.height + padding * 2);

    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fundo branco sólido para máxima acurácia do OCR
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    // Traçado escuro com cantos arredondados
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes.value) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = '#18181B'; // Preto/escuro ideal para IA
      ctx.lineWidth = Math.max(stroke.width * 1.5, 3);
      ctx.beginPath();

      const offsetX = bbox.minX - padding;
      const offsetY = bbox.minY - padding;

      const firstPoint = stroke.points[0];
      if (!firstPoint) continue;
      ctx.moveTo(firstPoint.x - offsetX, firstPoint.y - offsetY);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        if (pt) {
          ctx.lineTo(pt.x - offsetX, pt.y - offsetY);
        }
      }
      ctx.stroke();
    }

    const dataUrl = canvas.toDataURL('image/png');
    return {
      base64: dataUrl,
      bbox,
    };
  };

  const transcribeCurrentStrokes = async (): Promise<{
    text: string;
    bbox: BoundingBox;
  } | null> => {
    const exported = exportStrokesToPngBase64();
    if (!exported) return null;

    isTranscribing.value = true;
    ocrError.value = null;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token?.value) {
        headers.Authorization = `Bearer ${token.value}`;
      }

      const response = await $fetch<{ text: string }>(`${API_BASE}/ocr/transcribe`, {
        method: 'POST',
        headers,
        body: {
          imageBase64: exported.base64,
          mimeType: 'image/png',
          promptHint: 'Transcreva todo o texto e anotações manuscritas na imagem mantendo formatação em Markdown limpo.',
        },
      });

      clearStrokes();
      return {
        text: response.text || '',
        bbox: exported.bbox,
      };
    } catch (err: any) {
      console.error('Erro na transcrição OCR do canvas:', err);
      ocrError.value = err.message || 'Falha ao transcrever caligrafia.';
      return null;
    } finally {
      isTranscribing.value = false;
    }
  };

  return {
    isDrawing,
    strokes,
    currentStroke,
    strokeColor,
    strokeWidth,
    isTranscribing,
    ocrError,
    hasStrokes,
    boundingBox,
    startStroke,
    addPoint,
    endStroke,
    clearStrokes,
    exportStrokesToPngBase64,
    transcribeCurrentStrokes,
  };
}
