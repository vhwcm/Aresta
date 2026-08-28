# Design: Módulo de Quadro Infinito (Canvas) & Anotações Livres com IA (OCR)

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura desacoplada e orientada ao formato aberto **JSON Canvas (v1.0)**, compatível com o Obsidian Canvas.

```
┌────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND                                 │
│  (Nuxt 3 / Vue 3 + Tailwind CSS + Pinia / Composable)                  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Viewport Infinito (CSS Transform Matrix: Translate + Scale)      │  │
│  │                                                                  │  │
│  │  ┌────────────────────────┐        ┌──────────────────────────┐  │  │
│  │  │ Camada SVG (Arestas)   │        │ Camada DOM (Nós/Cards)   │  │  │
│  │  │ - 4 Anchors por nó     │        │ - Text Cards (Markdown)  │  │  │
│  │  │ - Snap Magnético       │        │ - Shapes (Ret, Circ, Los)│  │  │
│  │  │ - Curvas de Bézier     │        │ - Book / Highlight Cards │  │  │
│  │  └───────────▲────────────┘        └─────────────▲────────────┘  │  │
│  │              │                                   │               │  │
│  │  ┌───────────┴───────────────────────────────────┴────────────┐  │  │
│  │  │ Camada Inking / Traçado de Caneta (Canvas 2D Overlay)       │  │  │
│  │  │ - Bounding Box Crop -> PNG Base64 -> AI OCR Trigger        │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────▲──────────────────────────────┘  │
│                                      │                                 │
│                      useCanvas Composable / Store                      │
│             (Undo/Redo Stack, Autosave Debounce 750ms)                 │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │ HTTP REST (JSON Canvas Spec)
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                               BACKEND                                  │
│  (aresta-back-node: Express + Prisma + SQLite / gRPC aresta-ocr)       │
│                                                                        │
│  - Routes: /api/canvases (CRUD + Duplicate + Export)                   │
│  - Controller / Service: CanvasService, OcrController                  │
│  - Prisma Model: Canvas (id, user_id, title, description, data JSON)   │
│  - OCR Service: gRPC -> aresta-ocr (Gemini Vision Multimodal)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Modelo de Dados & Banco de Dados (Prisma)

### Novo Modelo `Canvas` em `prisma/schema.prisma`
```prisma
model Canvas {
  id          String    @id @default(uuid())
  user_id     Int
  title       String    @default("Quadro sem título")
  description String?
  data        String    // JSON Canvas Spec (nodes, edges, viewport)
  created_at  DateTime  @default(now())
  updated_at  DateTime  @default(now()) @updatedAt

  user        User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, updated_at])
  @@map("canvases")
}
```

### Formato do Campo `data` (JSON Canvas Spec v1.0)
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "x": 100,
      "y": 150,
      "width": 260,
      "height": 180,
      "text": "## Minha Anotação\nTexto formatado em markdown...",
      "color": "#E57B55"
    },
    {
      "id": "node-2",
      "type": "shape",
      "shape": "ellipse",
      "x": 450,
      "y": 150,
      "width": 200,
      "height": 120,
      "text": "Conceito Central",
      "color": "#3B82F6"
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "fromNode": "node-1",
      "fromSide": "right",
      "toNode": "node-2",
      "toSide": "left",
      "label": "origina",
      "color": "#E57B55"
    }
  ],
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1.0
  }
}
```

---

## 3. Contratos de API Backend (`aresta-back-node`)

### Rotas REST (`/api/canvases`)
1. `GET /api/canvases`: Lista os quadros do usuário autenticado (id, title, description, updated_at, node_count).
2. `POST /api/canvases`: Cria um novo quadro vazio ou a partir de payload JSON Canvas.
3. `GET /api/canvases/:id`: Retorna o quadro completo com seu `data` JSON.
4. `PUT /api/canvases/:id`: Atualiza metadados (`title`, `description`) e o payload `data` (autosave debounced).
5. `DELETE /api/canvases/:id`: Exclui um quadro.
6. `POST /api/canvases/:id/duplicate`: Duplica um quadro existente.

### OCR Endpoint Existente (`/api/ocr/transcribe`)
- Entrada: `{ imageBase64: string, mimeType: "image/png", promptHint?: string }`
- Saída: `{ text: string, confidence: number }`

---

## 4. Componentes Frontend (`front/app/`)

### Estrutura de Arquivos
- `pages/canvas/index.vue`: Listagem de quadros com cards de visualização prévia, busca, botão de criar e importar `.canvas`.
- `pages/canvas/[id].vue`: Tela do editor de quadro infinito com barra de ferramentas e área expansiva.
- `components/canvas/`:
  - `CanvasBoard.vue`: Contêiner principal com listeners de Pan/Zoom, viewport transform e renderização das camadas.
  - `CanvasNode.vue`: Wrapper de nós com posicionamento `transform: translate3d(x, y, 0)`, seleção, handles de redimensionamento e 4 pontos de ancoragem (`top`, `right`, `bottom`, `left`).
  - `CanvasNodeText.vue`: Card de nota com suporte a edição markdown inline e renderização rica com `marked`.
  - `CanvasNodeShape.vue`: Formas geométricas SVG/CSS (retângulo, elipse, losango, triângulo) com texto centralizado.
  - `CanvasNodeBook.vue`: Card de livro com capa, autor e progresso de leitura.
  - `CanvasEdgeLayer.vue`: Camada SVG com cálculo de caminhos cúbicos de Bézier entre nós, marcadores de seta `marker-end` e snap visual.
  - `CanvasInkingOverlay.vue`: Camada de desenho livre com caneta para escrita manual, cálculo de *bounding box* e botão flutuante `"✨ Transcrever"`.
  - `CanvasToolbar.vue`: Barra flutuante com ferramentas: Seleção (`V`), Bloco de Nota (`N`), Formas (`S`), Texto Livre (`T`), Caneta IA (`P`), Desfazer/Refazer, Zoom e Exportação.
  - `CanvasInsertDrawer.vue`: Gaveta lateral para buscar e inserir livros ou citações da estante.

---

## 5. Algoritmos e Detalhes de Interação

### Cálculo do Viewport (Pan & Zoom focal)
Para o zoom centrado no cursor do mouse:
```typescript
const zoomFactor = deltaY < 0 ? 1.1 : 0.9;
const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.1), 3.0);
const mouseCanvasX = (mouseX - panX) / currentZoom;
const mouseCanvasY = (mouseY - panY) / currentZoom;

panX = mouseX - mouseCanvasX * newZoom;
panY = mouseY - mouseCanvasY * newZoom;
zoom = newZoom;
```

### Conexão e Rotas de Setas (Anchor Snap)
Cada nó possui 4 âncoras relativas à sua posição `(x, y, width, height)`:
- `top`: `(x + width/2, y)`
- `right`: `(x + width, y + height/2)`
- `bottom`: `(x + width/2, y + height)`
- `left`: `(x, y + height/2)`

A curvatura de Bézier cúbica calcula os pontos de controle baseando-se no vetor de saída e entrada de cada lado, garantindo que as setas saiam perpendicularmente ao nó antes de curvarem até o destino.

### Pipeline de Transcrição IA
1. Ao desenhar com a Caneta, os pontos `(x, y)` são armazenados em um buffer de traços e a *bounding box* `[minX, minY, maxX, maxY]` é atualizada.
2. Ao soltar a caneta, surge o botão flutuante `"✨ Transcrever"` na coordenada `(maxX, maxY + 10)`.
3. Ao clicar, o canvas extrai o retângulo delimitador com padding de 16px em canvas temporário, exporta para PNG em base64 e envia para `POST /api/ocr/transcribe`.
4. O texto retornado é inserido como um novo nó `text` posicionado exatamente em `(minX, minY)` com largura calculada, e os traços temporários são limpos.
