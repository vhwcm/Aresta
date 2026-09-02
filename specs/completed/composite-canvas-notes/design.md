# Design Técnico: Módulo de Notas Compostas (Composite Notes) & Canvas Bidirecional

## 1. Visão Geral da Arquitetura

O sistema de **Notas Compostas** adota o padrão estrutural **Composite**, onde tanto documentos lineares em texto (Markdown Notes) quanto documentos espaciais 2D (Quadros Infinitos / Canvas) são tratados como nós de primeira classe que podem conter ou referenciar uns aos outros.

```
                      ┌───────────────────────────┐
                      │    CompositeNode (Base)   │
                      │  - id: string             │
                      │  - title: string          │
                      │  - render(contextStack)   │
                      └─────────────┬─────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌─────────────────────────┐     ┌─────────────────────────┐
       │     MarkdownNoteNode    │     │       CanvasDocNode     │
       │  - content: string (MD) │     │  - nodes: CanvasNode[]  │
       │  - embeds: SubResource[]│     │  - edges: CanvasEdge[]  │
       └─────────────────────────┘     └─────────────────────────┘
```

A renderização é coordenada pelo composable `useCycleDetector` e pelo componente `CompositeRenderer.vue`, que gerenciam a pilha de execução e previnem recursão infinita.

---

## 2. Diagramas Visuais de Fluxo

- Diagrama de Fluxo e Composição: `diagrams/composite-notes-flow.txt`
- Algoritmo de Prevenção de Ciclos: `diagrams/cycle-prevention-flow.txt`

---

## 3. Contratos de Dados e Schemas

### 3.1. Modelo de Banco de Dados (`prisma/schema.prisma`)

```prisma
model Note {
  id          String       @id @default(uuid())
  user_id     Int
  title       String       @default("Nota sem título")
  content     String       @default("") // Conteúdo Markdown com suporte a embeds ![[canvas:id]] e ![[book:id]]
  folder      String?      // Pasta lógica (ex: "Estudos/Biologia")
  tags        String[]     // Array de tags (PostgreSQL array ou JSON string)
  created_at  DateTime     @default(now())
  updated_at  DateTime     @default(now()) @updatedAt

  user        User         @relation(fields: [user_id], references: [id], onDelete: Cascade)
  noteLinks   NoteLink[]   @relation("SourceNote")
  targetLinks NoteLink[]   @relation("TargetNote")

  @@index([user_id, updated_at])
  @@map("notes")
}

model NoteLink {
  id             Int       @id @default(autoincrement())
  source_note_id String
  target_type    String    // 'NOTE' | 'CANVAS' | 'BOOK'
  target_id      String    // UUID da nota/canvas ou string do ID do livro
  created_at     DateTime  @default(now())

  sourceNote     Note      @relation("SourceNote", fields: [source_note_id], references: [id], onDelete: Cascade)

  @@index([source_note_id, target_type, target_id])
  @@map("note_links")
}

// Extensão do modelo Canvas já existente
model Canvas {
  id          String    @id @default(uuid())
  user_id     Int
  title       String    @default("Quadro sem título")
  description String?
  data        String    // JSON Canvas Spec estendido
  created_at  DateTime  @default(now())
  updated_at  DateTime  @default(now()) @updatedAt

  user        User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, updated_at])
  @@map("canvases")
}
```

### 3.2. Schemas Zod de Validação (`src/schemas/note.schema.ts`)

```typescript
import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório').max(255).default('Nota sem título'),
  content: z.string().default(''),
  folder: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  folder: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
});

export const noteQuerySchema = z.object({
  folder: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
```

### 3.3. Extensão da Tipagem do JSON Canvas (`front/app/interfaces/canvas.ts`)

```typescript
export type CanvasNodeType = 
  | 'text' 
  | 'shape' 
  | 'loose_text' 
  | 'book' 
  | 'highlight'
  | 'note_embed'; // Novo nó de nota composta

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  shape?: CanvasShapeType;
  color?: string;
  
  // Metadados para Book Node
  bookId?: number;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
  bookProgress?: number;
  quote?: string;
  chapter?: string;

  // Metadados para Note Embed Node
  noteId?: string;
  noteTitle?: string;
}
```

---

## 4. Endpoints de API REST (Backend)

### 4.1. Módulo de Notas (`/api/notes`)
- `GET /api/notes`: Lista notas do usuário autenticado com filtros de busca, tags e paginação.
- `POST /api/notes`: Cria uma nova nota.
- `GET /api/notes/:id`: Retorna uma nota completa com links de saída e metadados.
- `PUT /api/notes/:id`: Atualiza título, conteúdo, tags ou pasta da nota.
- `DELETE /api/notes/:id`: Remove a nota e limpa vínculos de `note_links`.

### 4.2. Módulo de Canvases (`/api/canvases`)
- `GET /api/canvases`: Lista resumos de quadros.
- `POST /api/canvases`: Cria um novo quadro.
- `GET /api/canvases/:id`: Retorna o documento JSON Canvas completo.
- `PUT /api/canvases/:id`: Atualiza dados (`nodes`, `edges`, `viewport`) e título.
- `DELETE /api/canvases/:id`: Exclui o quadro.

---

## 5. Algoritmo de Prevenção de Ciclos e Controle de Profundidade

O mecanismo de segurança opera em tempo de renderização no Frontend através da injeção de dependência e gerenciamento de contexto:

```typescript
// front/app/composables/useCycleDetector.ts
export interface RenderContextItem {
  type: 'note' | 'canvas';
  id: string;
  title?: string;
}

export const MAX_COMPOSITE_DEPTH = 3;

export function useCycleDetector(currentStack: RenderContextItem[] = []) {
  const checkCycle = (targetType: 'note' | 'canvas', targetId: string): { hasCycle: boolean; maxDepthReached: boolean } => {
    if (currentStack.length >= MAX_COMPOSITE_DEPTH) {
      return { hasCycle: false, maxDepthReached: true };
    }

    const hasCycle = currentStack.some(
      item => item.type === targetType && item.id === targetId
    );

    return { hasCycle, maxDepthReached: false };
  };

  const createNextStack = (item: RenderContextItem): RenderContextItem[] => {
    return [...currentStack, item];
  };

  return {
    currentStack,
    checkCycle,
    createNextStack,
  };
}
```

### Componentes Frontend Chave:

1. **`CanvasEmbedPreview.vue`**:
   - Renderiza uma janela restrita (micro-viewport) do canvas embutido no Markdown.
   - Suporta controles inline de zoom in/out, pan suave e botão "*Abrir em Tela Cheia*".
   - Utiliza `IntersectionObserver` para carregar nós sob demanda.

2. **`CanvasNodeNote.vue`**:
   - Renderiza um nó do tipo `note_embed` no canvas.
   - Consulta o conteúdo da nota via store ou cache local.
   - Aplica `useCycleDetector` para não renderizar notas que chamam o próprio canvas em loop.

3. **`CanvasNodeBook.vue`**:
   - Exibe a capa do livro (`cover_path`), título, autor e badge de progresso.
   - Implementa clique direto para navegar a `/reader/:id` com preservação da posição de leitura.

4. **`CycleWarningPlaceholder.vue`**:
   - Componente visual com alerta `⚠️ Referência Cíclica Detectada` e link para o documento original.

---

## 6. Tratamento de Erros & Fallbacks

- **Entidade Inexistente**: Caso uma nota ou canvas referenciado em `![[canvas:id]]` seja deletado, renderiza um card de fallback: "*Documento não encontrado ou excluído*".
- **Falha de Rede / Offline**: O cache local do IndexedDB/Pinia restaura a última versão conhecida dos documentos compostos.
- **Payload Corrompido**: Se o JSON Canvas contiver dados inválidos, a engine recupera os nós válidos e ignora elementos malformados com log em `WARN`.

---

## 7. Estratégia de Testes

- **Backend Unit & Integration**:
  - Testes de CRUD em `tests/notes.test.ts` e `tests/canvas.test.ts` com Supertest e SQLite/PostgreSQL de teste.
  - Validação de isolamento entre usuários e integridade referencial ao deletar notas.
- **Frontend Unit & Component**:
  - Testes do composable `useCycleDetector.test.ts` validando cenários de ciclo direto, ciclo indireto e profundidade máxima.
  - Testes de renderização de `CanvasEmbedPreview.vue` e `CanvasNodeBook.vue` com Vitest e `@vue/test-utils`.
