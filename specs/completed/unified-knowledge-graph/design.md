# Design Técnico: Grafo de Conhecimento Unificado

## 1. Visão Geral da Arquitetura

O sistema unifica os dois grafos legados (o grafo de livros/temas e o grafo de notas/quadros) em um pipeline canônico end-to-end:

```
┌────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND                                 │
│  (Nuxt 3 / Vue 3 + D3 Force Simulation + Tailwind CSS)                 │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │     Página /grafo     │  │ Modo Grafo em /canvas │  │  Home Card  │ │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────┬──────┘ │
│              │                          │                     │        │
│              └──────────────────────────┼─────────────────────┘        │
│                                         ▼                              │
│                          ┌───────────────────────────┐                 │
│                          │  useGraph (Composable)    │                 │
│                          │  - fetchGraph()           │                 │
│                          │  - graphFilters (layer)   │                 │
│                          └──────────────┬────────────┘                 │
│                                         │                              │
│                                         ▼                              │
│                          ┌───────────────────────────┐                 │
│                          │ UnifiedKnowledgeGraph.vue │                 │
│                          │ - D3 Force Layout (SVG)   │                 │
│                          │ - Layer Filters Chips     │                 │
│                          │ - Node Click Handler      │                 │
│                          └──────────────┬────────────┘                 │
│                                         │                              │
│              ┌──────────────────────────┼────────────────────────────┐ │
│              ▼                          ▼                            ▼ │
│     BookAnnotationsDrawer       NoteEditorModal / Flyout       ThemeOverlay
└──────────────┼──────────────────────────┼────────────────────────────┼─┘
               │                          │                            │
               │ HTTP GET /api/graph      │                            │
               ▼                          ▼                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                BACKEND                                 │
│  (apps/api: Express + Prisma ORM + PostgreSQL 16)                      │
│                                                                        │
│  - Routes: GET /api/graph (com query params opcionais: ?types=...)     │
│  - Service: GraphService.getGraph(userId)                              │
│    ├── Prisma Queries:                                                 │
│    │   ├── userBooks + book (com bookThemes)                           │
│    │   ├── themes + hierarchies + bookThemes + annotationThemes        │
│    │   ├── annotations (com annotationThemes + book)                   │
│    │   ├── notes (com noteLinks)                                       │
│    │   └── canvases (com tags e dados)                                 │
│    └── Edge Calculation Engine:                                        │
│        ├── theme-hierarchy                                             │
│        ├── book-theme                                                  │
│        ├── annotation-book                                             │
│        ├── annotation-theme                                            │
│        ├── note-book & note-canvas & note-note (NoteLink & embed refs) │
│        ├── canvas-note (JSON embeds)                                   │
│        └── note-theme (semântico por correspondência de tags)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Contratos de Dados & Interfaces

### 2.1. Tipos de Nós (`GraphNodeType`)
```ts
export type GraphNodeType = 'theme' | 'book' | 'annotation' | 'note' | 'canvas'

export interface UnifiedGraphNode {
  id: string // "theme-1", "book-12", "ann-45", "note-uuid", "canvas-uuid"
  rawId: string | number
  type: GraphNodeType
  title: string
  name: string
  description?: string
  color: string
  radius: number
  icon?: string
  // Contexto específico
  bookId?: number
  coverPath?: string | null
  author?: string
  cfi?: string | null
  selectedText?: string | null
  folder?: string | null
  tags?: string[]
  updatedAt?: string
}

export interface UnifiedGraphEdge {
  id: string
  source: string
  target: string
  type: 'theme-hierarchy' | 'book-theme' | 'annotation-book' | 'annotation-theme' | 'note-book' | 'note-canvas' | 'note-note' | 'canvas-note' | 'note-theme'
}

export interface UnifiedGraphResponse {
  nodes: UnifiedGraphNode[]
  edges: UnifiedGraphEdge[]
  counts: {
    themes: number
    books: number
    annotations: number
    notes: number
    canvases: number
  }
}
```

---

## 3. Comportamento Interativo dos Nós

| Tipo de Nó | Representação Visual | Ação no Clique |
| :--- | :--- | :--- |
| **Livro (`book`)** | Capa do livro com sombra e borda acentuada (raio 22) | Abre a gaveta lateral `BookAnnotationsDrawer` exibindo todas as anotações do livro e o botão "Continuar Leitura" para abrir no Leitor. |
| **Anotação (`annotation`)** | Nó âmbar (`#F59E0B`) com marcador (raio 12) | Abre modal/card flutuante com o texto citado, nota pessoal e botão "Ir para a página no Livro" (`/reader/:bookId?cfi=...`). |
| **Nota (`note`)** | Nó índigo (`#6366F1`) com ícone de documento (raio 15) | Abre drawer ou modal do editor da nota (ou redireciona para `/canvas` com nota selecionada). |
| **Quadro (`canvas`)** | Nó acento (`#E57B55`) com ícone de grade (raio 18) | Navega diretamente para `/canvas/:id`. |
| **Tema (`theme`)** | Nó temático circular colorido (raio 20) | Abre `ThemeCanvasOverlay` com livros e notas associadas ao tema. |

---

## 4. Desativação do Grafo no Leitor
- Em `apps/web/app/components/reader/ReaderTopBar.vue` e `ReaderBottomBar.vue`:
  - O botão de alternância do Grafo (`toggleGraph` / ícone de rede) é removido.
  - A gaveta lateral `ReaderGraphPanel.vue` não é invocada durante a sessão de leitura.
