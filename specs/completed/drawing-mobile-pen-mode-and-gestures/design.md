# Design Técnico: Modo Caneta e Gestos de Navegação/Zoom Mobile no Desenho

## 1. Visão Geral da Arquitetura
O módulo de desenho do Aresta (`/canvas/drawing/:id`) opera em arquitetura Local-First no frontend Nuxt 3/Vue 3. Para resolver a necessidade de desenhar exclusivamente com caneta e navegar com 1 dedo no mobile — bem como destravar o pan e zoom com 2 dedos do centro fixo da tela —, a arquitetura é desacoplada em três camadas:

1. **Camada de Estado Reativo (`useDrawing.ts`)**:
   - Mantém o estado `isPenOnlyMode` reativo com sincronização local em `localStorage` (`aresta_drawing_pen_mode`).
   - Expõe `togglePenOnlyMode()`.

2. **Camada de Captura e Traço (`DrawingPageCanvas.vue`)**:
   - Recebe a prop `penMode: boolean`.
   - Se `penMode === true`, filtra e ignora eventos `pointerType === 'touch'` no `pointerdown`, não iniciando traço de caneta nem ativando captura de ponteiro.
   - Eventos `pointerType === 'pen'` continuam desenhando com `perfect-freehand` em alta fidelidade.
   - Se `penMode === false`, o primeiro toque inicia o traço, e a chegada do segundo toque cancela o traço imediatamente e libera o ponteiro para o pan/zoom.

3. **Camada de Viewport e Gestos (`[id].vue`)**:
   - Escuta `touchstart`, `touchmove`, `touchend` e `touchcancel`.
   - Gerencia estado `isTouchInteracting`. Durante o toque, remove o CSS Scroll Snap (`snap-none`) e remove `scroll-smooth`, proporcionando arraste 1:1 sem resistência.
   - **Com Modo Caneta Ativado**:
     - `e.touches.length === 1`: Aciona o pan de 1 dedo (`scrollLeft -= dx`, `scrollTop -= dy`).
   - **Com 2 Dedos (ambos os modos)**:
     - Calcula a distância e o ponto médio focal (`midX`, `midY`).
     - Aplica zoom relativo ao ponto focal ajustando `scrollLeft` e `scrollTop` de forma proporcional à variação de escala `ratio`.
     - Aplica deslocamento diferencial do pan (`panDeltaX`, `panDeltaY`).
   - Ajusta a largura de `.page-slide` no mobile para `Math.max(windowWidth, scaledSheetWidth)` para que a folha ampliada tenha espaço real de rolagem horizontal.

## 2. Diagrama Visual de Fluxo
Consulte o diagrama ASCII detalhado em: `diagrams/pen-and-touch-flow.txt`.

## 3. Contratos de Dados e Interfaces

### 3.1. Tipos e Props em `apps/web/app/interfaces/drawing.ts`
```typescript
export interface DrawingStateSettings {
  isPenOnlyMode: boolean;
}
```

### 3.2. Props e Emits em `DrawingToolbar.vue`
```typescript
interface Props {
  tool: PenToolType;
  selectedShapeType?: CanvasShapeType;
  color: string;
  size: number;
  penMode?: boolean; // Novo prop
}

const emit = defineEmits<{
  (e: 'update:tool', tool: PenToolType): void;
  (e: 'update:selectedShapeType', shape: CanvasShapeType): void;
  (e: 'update:color', color: string): void;
  (e: 'update:size', size: number): void;
  (e: 'update:penMode', enabled: boolean): void; // Novo emit
}>();
```

### 3.3. Props em `DrawingPageCanvas.vue`
```typescript
interface Props {
  page: DrawingPage;
  scale?: number;
  tool: PenToolType;
  selectedShapeType?: CanvasShapeType;
  color: string;
  size: number;
  selectedNodeIds?: string[];
  selectedEdgeId?: string | null;
  palmRejection?: boolean;
  isActive?: boolean;
  isDarkMode?: boolean;
  penMode?: boolean; // Novo prop
}
```

## 4. Algoritmo de Zoom Focal e Pan com 2 Dedos

```typescript
// Ponto focal sob os dedos no espaço da viewport
const rect = viewportRef.value.getBoundingClientRect();
const focalX = currentMid.x - rect.left;
const focalY = currentMid.y - rect.top;

const ratio = newScale / oldScale;

// Nova posição de rolagem compensando o crescimento em torno de (focalX, focalY)
viewportRef.value.scrollLeft = (viewportRef.value.scrollLeft + focalX) * ratio - focalX - panDeltaX;
viewportRef.value.scrollTop = (viewportRef.value.scrollTop + focalY) * ratio - focalY - panDeltaY;
```

## 5. Tratamento de Erros & Fallbacks
- Se o dispositivo não suportar a API TouchEvent (ex: desktop sem touch), os listeners continuam passivos sem emitir erros.
- Se `localStorage` estiver bloqueado no WebView, o composable usa fallback de estado reativo em memória (`false`).
- Se houver perda acidental de ponteiro (`lostpointercapture`), o canvas aborta qualquer traço em andamento e reestabelece a folha limpa.

## 6. Estratégia de Testes
- **DrawingToolbar.test.ts**: Testar a renderização do botão de Modo Caneta e emissão do evento `update:penMode`.
- **DrawingPageCanvas.test.ts**: Testar que, quando `penMode === true`, eventos `pointerdown` com `pointerType === 'touch'` não iniciam traços; enquanto `pointerType === 'pen'` desenha normalmente.
- **useDrawing.test.ts**: Testar alternância de `isPenOnlyMode` e persistência em `localStorage`.
- **drawingPage.test.ts**: Testar integração do modo caneta e lógica de gestos na página principal de desenho.
