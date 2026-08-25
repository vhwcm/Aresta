# Design Técnico: Leitor 2D Nativo de Alta Performance e Nitidez

## 1. Visão Geral da Arquitetura 2D

O novo leitor 2D abandona a renderização intermediária via textura WebGL / malha tridimensional (`Three.js`), substituindo-a por um pipeline de renderização direto em **Canvas 2D com escala High-DPI nativa** e contêineres DOM com transição CSS / Canvas 2D Slide.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ReaderViewer (Container)                       │
│                                                                        │
│  ┌───────────────────────── Stage Container ─────────────────────────┐  │
│  │                                                                   │  │
│  │  [‹ Nav Prev]                                       [› Nav Next]  │  │
│  │                                                                   │  │
│  │  ┌────────────────── 2D Book Stage Viewport ───────────────────┐  │  │
│  │  │                                                             │  │  │
│  │  │   ┌──────────────── Page Canvas Layer ──────────────────┐   │  │  │
│  │  │   │  - Buffer dimensionado com window.devicePixelRatio   │   │  │  │
│  │  │   │  - Renderização direta de PDF.js / EPUB             │   │  │  │
│  │  │   │  - Modo 1 Página ou 2 Páginas lado a lado           │   │  │  │
│  │  │   └─────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                             │  │  │
│  │  │   ┌────────────── Invisible TextLayer DOM ──────────────┐   │  │  │
│  │  │   │  - Alinhada perfeitamente com as páginas visíveis   │   │  │  │
│  │  │   │  - Seleção nativa de texto para anotações           │   │  │  │
│  │  │   └─────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                             │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [ReaderBottomBar: Sair | % Progresso | Anotar | 1/2 Páginas | Salvas | Grafo]│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes e Composables Afetados

### 2.1. `front/app/composables/reader/useBookPageTurn.ts` (ou `useReader2D.ts`)
- Responsável por:
  - Calcular as dimensões da página (`PageLayoutInfo`: `singlePage`, `leftPage`, `rightPage`) respeitando o aspect ratio do documento e as dimensões da viewport do contêiner.
  - Manter cache em memória das páginas rasterizadas (`PageData` / Canvas 2D) com janela deslizante (páginas atual e vizinhas).
  - Executar a animação 2D de deslizamento (slide) horizontal suave (`transform: translateX(...)` com cubic-bezier ou lerp em `requestAnimationFrame`).
  - Lidar com gestos de toque/mouse nas margens (`getTurnZone`, `beginDrag`, `updateDrag`, `endDrag`).
  - Respeitar `pageAnimationEnabled` do `useSettings()`.

### 2.2. `front/app/components/reader/engine/PageCurlCanvas.vue` -> Refatorado para Leitor 2D
- Mantém o nome ou componente de renderização do leitor (`ReaderEngineCanvas` / `PageCurlCanvas.vue` com template limpo 2D).
- Renderiza diretamente em elemento `<canvas>` 2D com `devicePixelRatio` ou contêiner de páginas 2D com TextLayer.
- Remove qualquer dependência de WebGL ou Three.js.

### 2.3. `front/app/components/reader/Viewer.vue`
- Integração limpa com o motor 2D.
- Ativação do modo de 2 páginas adaptativo.
- Tratamento de eventos de teclado (ArrowLeft, ArrowRight).

### 2.4. `front/app/components/reader/ReaderBottomBar.vue`
- Adiciona botão de alternância de visualização: **Página Única (1x) / Página Dupla (2x)**.
- Desabilitado dinamicamente quando a tela for mobile (<1024px) ou o grafo estiver aberto.

### 2.5. `front/package.json`
- Remoção das dependências: `three` e `@types/three`.

---

## 3. Gestão de Alta Resolução (High-DPI / Retina)

Para garantir máxima nitidez do texto:
```typescript
const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
canvas.width = Math.round(cssWidth * dpr)
canvas.height = Math.round(cssHeight * dpr)
canvas.style.width = `${cssWidth}px`
canvas.style.height = `${cssHeight}px`

const ctx = canvas.getContext('2d')
ctx.scale(dpr, dpr)
```
Ao renderizar o PDF via `PdfDocumentAdapter`, passamos o viewport dimensionado exatamente na escala `(cssWidth / baseWidth) * dpr`, permitindo que o PDF.js desenhe os glifos vetoriais com precisão pixel a pixel.

---

## 4. Transição 2D (Slide Horizontal)

A transição calcula o deslocamento horizontal baseado no progresso $t \in [0, 1]$:
$$\Delta X = (1 - \text{easeOutCubic}(t)) \times \text{direction} \times \text{width}$$

- Se arrastado pelo usuário, $\Delta X$ segue o cursor em tempo real.
- Ao soltar, se ultrapassar o limiar de arrasto (`TURN_THRESHOLD = 0.20` ou velocidade $\ge 0.002$), a virada completa em ~180ms.
- Caso contrário, retorna para a posição original (snap back).
- Se `pageAnimationEnabled` for falso, a troca de página ocorre no frame imediato sem animação.
