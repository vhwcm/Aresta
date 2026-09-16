# 🎨 Arquitetura do Quadro Infinito (Canvas), Grafo & Notas Compostas

O módulo de **Quadro Infinito & Anotações Livres com IA** transforma o Aresta em um ambiente de pensamento visual e não-linear no padrão aberto **JSON Canvas (v1.0)**, permitindo interoperabilidade com o Obsidian (`.canvas`), composição aninhada de notas e visualização relacional em grafos de conhecimento (D3.js).

---

## 1. Arquitetura do Canvas e Inking com IA

```text
================================================================================
                    ARESTA INFINITE CANVAS & AI OCR ARCHITECTURE
================================================================================

                               +-----------------------+
                               |     USER INTERFACE    |
                               | (Mouse, Touch, Stylus)|
                               +-----------+-----------+
                                           |
                                           v
+------------------------------------------------------------------------------+
| NUXT 3 CANVAS VIEWPORT (DOM + SVG HYBRID ENGINE)                             |
|                                                                              |
|  [ CSS Transform Matrix: translate(panX, panY) scale(zoom) ]                 |
|                                                                              |
|  +------------------------+   +------------------------+   +---------------+ |
|  |     SVG EDGE LAYER     |   |     DOM NODE LAYER     |   | INKING OVERLAY| |
|  |                        |   |                        |   | (Handwriting) | |
|  |  [Anchor Snap Engine]  |   | [Selection & Resize]   |   |               | |
|  |   - Top, Right,        |   |   - Text Note (Md)     |   | [Pen Buffer]  | |
|  |     Bottom, Left       |   |   - Shapes (Rect,      |   |  - Mouse/Touch| |
|  |   - Cubic Bézier Path  |   |     Circle, Diamond)   |   |    events     | |
|  |   - Direction Arrows   |   |   - Book / Highlight   |   |  - BoundingBox| |
|  |   - Text Edge Labels   |   |   - Markdown Editor    |   |    Calculator | |
|  +-----------+------------+   +-----------+------------+   +-------+-------+ |
|              |                            |                        |         |
+--------------|----------------------------|------------------------|---------+
               |                            |                        |
               v                            v                        v
+-------------------------------------------------------+ +--------------------+
| useCanvas COMPOSABLE / PINIA STORE                    | | ✨ "Transcrever"   |
|  - Nodes & Edges State (JSON Canvas Spec v1.0)         | | Action Pill Button |
|  - Undo / Redo History Stack (Ctrl+Z / Ctrl+Shift+Z)  | +---------+----------+
|  - Debounced Autosave (750ms)                         |           |
+---------------------------+---------------------------+           | Crop BBox
                            |                                       | to PNG
                            | REST (JSON Canvas Payload)            | Base64
                            v                                       v
+------------------------------------------------------------------------------+
| BACKEND EXPRESS (apps/api)                                                   |
|                                                                              |
|   +--------------------------+               +--------------------------+    |
|   | /api/canvases Controller |               | /api/ocr/transcribe      |    |
|   | - CRUD & Duplicate       |               | - OcrController          |    |
|   +------------+-------------+               +------------+-------------+    |
|                |                                          |                  |
|                v                                          v gRPC             |
|   +--------------------------+               +--------------------------+    |
|   | PostgreSQL (Prisma Model)|               | aresta-ocr Service       |    |
|   | Table: canvases          |               | (Gemini Vision 2.0 Flash)|    |
|   | (id, user_id, title, data|               +--------------------------+    |
|   +--------------------------+                                               |
+------------------------------------------------------------------------------+
================================================================================
```

---

## 2. Padrão de Dados (JSON Canvas Spec v1.0)

O documento do Canvas é armazenado na tabela `canvases` do PostgreSQL com a seguinte estrutura:

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
      "text": "## Minha Ideia\nTexto em Markdown...",
      "color": "#E57B55"
    },
    {
      "id": "node-2",
      "type": "shape",
      "shape": "diamond",
      "x": 450,
      "y": 150,
      "width": 180,
      "height": 120,
      "text": "Decisão Arquitetural",
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
      "color": "#E57B55",
      "toEnd": "arrow"
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

## 3. Arquitetura de Notas Compostas: Note ↔ Canvas ↔ Book (Composite Pattern)

```text
====================================================================================================
               ARQUITETURA DE NOTAS COMPOSTAS: NOTE ↔ CANVAS ↔ BOOK (COMPOSITE PATTERN)
====================================================================================================

               ┌─────────────────────────────────────────────────────────────┐
               │                     ARESTA FRONTEND (Nuxt 3)                │
               └──────────────────────────────┬──────────────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
     ┌──────────────▼──────────────┐                     ┌──────────────▼──────────────┐
     │      NOTE EDITOR & VIEW     │                     │     INFINITE CANVAS BOARD   │
     │  (Markdown + Embed Parser)  │                     │      (JSON Canvas v1.0)     │
     └──────────────┬──────────────┘                     └──────────────┬──────────────┘
                    │                                                   │
                    │  ! [[canvas:uuid-1]]                              │  Node: type='note_embed'
                    ├────────────────────────┐         ┌────────────────┤        noteId='note-42'
                    │                        │         │                │
                    │                        ▼         ▼                │
                    │         ┌───────────────────────────────┐         │
                    │         │  COMPOSITE RENDER ENGINE      │         │
                    │         │  - Cycle Detector Context     │         │
                    │         │  - Depth Limiter (Max: 3)     │         │
                    │         │  - Lazy Viewport Observer     │         │
                    │         └──────────────┬────────────────┘         │
                    │                        │                          │
                    │                        ├──────────────────────────┤
                    │                        │                          │
     ┌──────────────▼──────────────┐         │           ┌──────────────▼──────────────┐
     │    CANVAS EMBED PREVIEW     │◄────────┘           │       NOTE EMBED CARD       │
     │  - Micro Viewport (Pan/Zoom)│                     │  - Markdown Render Inline   │
     │  - Expand Button (Modal)    │                     │  - 2-Way Sync / Edit Link   │
     │  - Deep Link: /canvas/:id   │                     │  - 4 Magnetic Anchors       │
     └─────────────────────────────┘                     └─────────────────────────────┘
                    │                                                   │
                    │  ! [[book:book-10]]                               │  Node: type='book'
                    └────────────────────────┬──────────────────────────┘        bookId=10
                                             │
                                ┌────────────▼────────────┐
                                │     BOOK CARD NODE      │
                                │  - Cover Image Display  │
                                │  - Title, Author, Prog. │
                                │  - 1-Click to Reader    │
                                └────────────┬────────────┘
                                             │
                                             ▼
                                ┌─────────────────────────┐
                                │   EPUB / PDF READER     │
                                │ (/reader/:id | /livros) │
                                └─────────────────────────┘

====================================================================================================
                                      BACKEND & PERSISTÊNCIA
====================================================================================================

      ┌─────────────────────────┐                     ┌─────────────────────────┐
      │   Prisma Model: Note    │                     │   Prisma Model: Canvas  │
      │  - id: String (UUID)    │                     │  - id: String (UUID)    │
      │  - title: String        │◄───────────────────►│  - title: String        │
      │  - content: String (MD) │   Relacionamento    │  - data: JSON String    │
      │  - user_id: Int         │     de Vínculo      │  - user_id: Int         │
      └────────────┬────────────┘     (Composite)     └────────────┬────────────┘
                   │                                               │
                   └───────────────────────┬───────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │   Prisma Model: Book    │
                              │  - id: Int              │
                              │  - title, cover_path    │
                              └─────────────────────────┘
====================================================================================================
```

---

## 4. Algoritmo de Prevenção de Ciclos e Limite de Profundidade

Ao aninhar quadros dentro de notas e notas dentro de quadros, o motor previne referências circulares e estouro de pilha de renderização através do detector de ancestrais (`ancestorStack`):

```text
====================================================================================================
                        ALGORITMO DE DETECÇÃO DE CICLOS E LIMITE DE PROFUNDIDADE
====================================================================================================

      Cenário de Risco:
      [Nota A] ──(contém)──> [Canvas B] ──(contém)──> [Nota A] ──(contém)──> [Canvas B] ... (LOOP INFINITO)

────────────────────────────────────────────────────────────────────────────────────────────────────
                                      FLUXO DE DECISÃO DO RENDERIZADOR
────────────────────────────────────────────────────────────────────────────────────────────────────

                                   ┌─────────────────────────┐
                                   │ Renderizar Elemento     │
                                   │ (Type: Note | Canvas,   │
                                   │  Id: "UUID-123")        │
                                   └────────────┬────────────┘
                                                │
                                                ▼
                                   ┌─────────────────────────┐
                                   │ Obter ancestorStack     │
                                   │ do Contexto Atual       │
                                   └────────────┬────────────┘
                                                │
                                                ▼
                                    /───────────────────────\
                                   /  (type, id) já existe   \   SIM
                                  <   em ancestorStack?       >───────────┐
                                   \                         /            │
                                    \───────────────────────/             │
                                                │ NÃO                     │
                                                ▼                         │
                                    /───────────────────────\             │
                                   /  Profundidade atual     \   SIM      │
                                  <   >= MAX_DEPTH (ex: 3)?   >─────┐     │
                                   \                         /      │     │
                                    \───────────────────────/       │     │
                                                │ NÃO               │     │
                                                ▼                   │     │
                                  ┌──────────────────────────┐      │     │
                                  │ Adicionar (type, id) ao  │      │     │
                                  │ ancestorStack e          │      │     │
                                  │ incrementar depth        │      │     │
                                  └─────────────┬────────────┘      │     │
                                                │                   │     │
                                                ▼                   │     │
                                  ┌──────────────────────────┐      │     │
                                  │ Renderizar Componente    │      │     │
                                  │ (NoteRenderer /          │      │     │
                                  │  CanvasEmbedPreview)     │      │     │
                                  └──────────────────────────┘      │     │
                                                                    │     │
                                ┌───────────────────────────────────┘     │
                                │                                         │
                                ▼                                         ▼
                  ┌─────────────────────────┐               ┌──────────────────────────┐
                  │ RENDERIZAR FALLBACK:    │               │ RENDERIZAR PLACEHOLDER:  │
                  │ "Profundidade Máxima    │               │ ⚠️ Referência Cíclica    │
                  │  Atingida"              │               │ Prevenida                │
                  │ [Botão Abrir em Janela] │               │ "Loop detectado com      │
                  └─────────────────────────┘               │  entidade UUID-123"      │
                                                            │ [Botão Visualizar Grafo] │
                                                            └──────────────────────────┘
====================================================================================================
```

---

## 5. Fluxo de Dados do Grafo de Conhecimento (Graph & Mental Map)

```text
================================================================================
FLUXO DE DADOS DO GRAFO DE CONHECIMENTO (GRAPH & MENTAL MAP DATA FLOW)
================================================================================

    ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
    │   User Books    │       │     Themes      │       │   Annotations   │
    │  (Obras Lidas)  │       │ (Conceitos/Tags)│       │(Citações/Notas) │
    └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
             │                         │                         │
             │ BookTheme (N:N)         │                         │ AnnotationTheme
             └───────────────► ┌───────┴───────┐ ◄───────────────┘
                               │     THEME     │
                               │  (Nó Central) │
                               └───────┬───────┘
                                       │
                                       │ Source & Target Connections (N:N)
                                       ▼
                               ┌───────────────┐
                               │     THEME     │
                               │  CONNECTION   │
                               └───────┬───────┘
                                       │
                                       │ GET /api/graph (retorna nodes e links)
                                       ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ FRONTEND: D3.js Force Simulation Engine (`useGraph` composable)        │
    │                                                                        │
    │  1. Nodes: Obras (azuis), Temas (laranjas/custom), Notas (amarelas)    │
    │  2. Links: Arestas ponderadas por co-ocorrência e conexões explícitas  │
    │  3. Física de Força: D3 ForceManyBody, ForceCenter, ForceLink          │
    │  4. Interatividade: Drag & Drop, Zoom/Pan, Filtros de nós e links      │
    └────────────────────────────────────────────────────────────────────────┘
================================================================================
```

---

## 6. Endpoints REST Backend (`/api/canvases`)

- `GET /api/canvases`: Lista os quadros do usuário.
- `POST /api/canvases`: Cria um novo quadro ou importa um `.canvas`.
- `GET /api/canvases/:id`: Obtém os dados completos do quadro.
- `PUT /api/canvases/:id`: Atualiza metadados e payload `data` (autosave debounced 750ms).
- `DELETE /api/canvases/:id`: Exclui um quadro.
- `POST /api/canvases/:id/duplicate`: Duplica um quadro existente.

---

## 7. Criação de Anotações e Flashcards por Seleção de Texto em Notas

Ao selecionar qualquer trecho de texto nas notas (seja no editor integrado `NoteEditorPane.vue` com Live Preview Milkdown ou nos nós de nota no canvas `CanvasNodeNote.vue`), uma barra flutuante de ações é exibida com estilo refinado:

- **📝 Anotar**: Aciona o modal de criação de anotações (`ReaderAnnotationModal`) com a caixinha de anotação/reflexão pré-ativada (`initialWantNote = true`), permitindo registrar insights e associar temas do Grafo de Conhecimento vinculados diretamente ao ID da nota (`noteId`).
- **✨ Flashcard**: Aciona o modal com a caixinha de flashcard pré-ativada (`initialWantFlashcard = true`), permitindo geração socrática inteligente de cartões de repetição espaçada com IA associados à nota (`canvas_note`).

