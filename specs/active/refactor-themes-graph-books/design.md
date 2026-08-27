# Design Técnico: Refatoração de Temas, Anotações e Grafo de Conhecimento

## 1. Visão Geral da Arquitetura

A solução refatora o gerenciamento de temas de um modelo restrito por usuário para um **Catálogo Global Dinâmico de Temas**, integrado a um **Grafo Hierárquico de Subtemas**. 

O enriquecimento de livros é orquestrado pelo backend Node.js chamando o microserviço Go via gRPC (`AnalyzeBook`). O microserviço Go utiliza **Gemini 2.5 Flash** com **Google Search Grounding** para pesquisar o livro na internet e extrair o resumo, seguido de **Gemini Embeddings** e similaridade de cosseno para mapear temas existentes no banco ou propor novos temas e suas relações de subtema (`parent -> child`).

No frontend (Nuxt 4 / Vue 3 + D3.js), o grafo passa a renderizar dois tipos de nós:
1. **Nós de Tema**: Círculos coloridos estilizados no tema da aplicação.
2. **Nós de Livro**: Nós com a miniatura da capa do livro e o título truncado em até 10 caracteres (`title.length > 10 ? title.slice(0, 10) + '...' : title`).

As interações do grafo agora suportam abertura de Canvas Overlay para temas (carrossel de livros + feed de anotações) e abertura de painel lateral para livros (anotações do livro e criação de notas soltas com `cfi` opcional).

---

## 2. Diagrama Visual de Fluxo
Consulte o diagrama em: `diagrams/flow.txt`

---

## 3. Contratos de Dados e Schemas

### 3.1. Modelo de Banco de Dados (`prisma/schema.prisma`)

```prisma
model Theme {
  id                Int               @id @default(autoincrement())
  name              String            @unique
  color             String?           @default("#E57B55")
  description       String?
  embedding         String?           // Vetor de embeddings serializado em JSON (ex: "[0.012, -0.045, ...]")
  created_at        DateTime          @default(now())
  parentHierarchies ThemeHierarchy[]  @relation("ParentTheme")
  childHierarchies  ThemeHierarchy[]  @relation("ChildTheme")
  bookThemes        BookTheme[]
  annotationThemes  AnnotationTheme[]

  @@map("themes")
}

model ThemeHierarchy {
  id              Int      @id @default(autoincrement())
  parent_theme_id Int
  child_theme_id  Int
  created_at      DateTime @default(now())
  parentTheme     Theme    @relation("ParentTheme", fields: [parent_theme_id], references: [id], onDelete: Cascade)
  childTheme      Theme    @relation("ChildTheme", fields: [child_theme_id], references: [id], onDelete: Cascade)

  @@unique([parent_theme_id, child_theme_id])
  @@map("theme_hierarchies")
}

model Book {
  id             Int             @id @default(autoincrement())
  title          String
  file_path      String
  cover_path     String?
  created_at     DateTime        @default(now())
  publicInfo     BookPublicInfo?
  userBooks      UserBook[]
  bookThemes     BookTheme[]
  annotations    Annotation[]

  @@map("books")
}

model BookPublicInfo {
  id          Int      @id @default(autoincrement())
  book_id     Int      @unique
  author      String
  summary     String?
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now()) @updatedAt
  book        Book     @relation(fields: [book_id], references: [id], onDelete: Cascade)

  @@map("book_public_infos")
}

model BookTheme {
  id         Int      @id @default(autoincrement())
  book_id    Int
  theme_id   Int
  created_at DateTime @default(now())
  book       Book     @relation(fields: [book_id], references: [id], onDelete: Cascade)
  theme      Theme    @relation(fields: [theme_id], references: [id], onDelete: Cascade)

  @@unique([book_id, theme_id])
  @@map("book_themes")
}

model Annotation {
  id               Int               @id @default(autoincrement())
  user_id          Int
  book_id          Int
  cfi              String?           // Opcional para suportar anotações soltas
  selected_text    String?
  note             String?
  chapter_title    String?
  progress         Float?            @default(0.0)
  created_at       DateTime          @default(now())
  updated_at       DateTime          @default(now()) @updatedAt
  user             User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  book             Book              @relation(fields: [book_id], references: [id], onDelete: Cascade)
  annotationThemes AnnotationTheme[]

  @@index([user_id, book_id])
  @@map("annotations")
}
```

---

### 3.2. Contrato gRPC (`proto/ai/v1/ai.proto`)

```protobuf
syntax = "proto3";

package ai.v1;
option go_package = "aresta-ocr/gen/ai/v1;aiv1";

service AIService {
  rpc AnalyzeBook (AnalyzeBookRequest) returns (AnalyzeBookResponse);
}

message ThemeItem {
  int32 id = 1;
  string name = 2;
  repeated float embedding = 3;
}

message AnalyzeBookRequest {
  string title = 1;
  string author = 2;
  repeated ThemeItem existing_themes = 3;
}

message NewThemeSuggestion {
  string name = 1;
  string description = 2;
  string color = 3;
  repeated float embedding = 4;
  string parent_theme_name = 5; // Caso seja um subtema
}

message AnalyzeBookResponse {
  string summary = 1;
  repeated int32 matched_theme_ids = 2;
  repeated NewThemeSuggestion new_themes = 3;
}
```

---

### 3.3. Schemas Zod (`aresta-back-node/src/schemas/`)

#### `book.schema.ts`
```typescript
export const adminUploadBookSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    author: z.string().min(1, 'Autor é obrigatório'),
  }),
});
```

#### `annotation.schema.ts`
```typescript
export const createAnnotationSchema = z.object({
  body: z.object({
    bookId: z.number().int().positive(),
    cfi: z.string().optional().nullable(),
    selectedText: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
    chapterTitle: z.string().optional().nullable(),
    progress: z.number().min(0).max(100).optional().default(0),
    themeIds: z.array(z.number().int().positive()).optional().default([]),
  }),
});
```

#### `graph.schema.ts`
```typescript
export interface GraphResponse {
  nodes: Array<{
    id: number | string;
    type: 'theme' | 'book';
    name: string;
    color?: string;
    description?: string;
    coverPath?: string;
    author?: string;
    isRoot?: boolean;
  }>;
  edges: Array<{
    id: string;
    source: number | string;
    target: number | string;
    type: 'root' | 'theme-hierarchy' | 'book-theme';
  }>;
}
```

---

## 4. Endpoints de API (Backend Node.js)

| Rota | Método | Descrição | Permissão |
| :--- | :--- | :--- | :--- |
| `/api/books/admin-upload` | `POST` | Upload multipart de PDF/EPUB por Viktor + Título e Autor + Disparo de IA | `ADMIN` |
| `/api/books/:id/enrich` | `POST` | Reexecuta a análise de IA para um livro existente | `ADMIN` |
| `/api/books/:id/annotations` | `GET` | Lista todas as anotações do livro para o usuário logado | `USER` |
| `/api/themes/:id/books` | `GET` | Lista todos os livros vinculados a um tema | `USER` |
| `/api/themes/:id/annotations` | `GET` | Lista anotações do usuário vinculadas ao tema | `USER` |
| `/api/graph` | `GET` | Retorna o grafo unificado contendo nós de temas, nós de livros e arestas | `USER` |

---

## 5. Componentes Frontend & Estado

- **`front/app/pages/admin/upload.vue`**: Interface exclusiva de Viktor para upload de livros com formulário de título, autor e dropzone.
- **`front/app/components/GraphCanvas.vue`**:
  - Renderiza nós de Livros com SVG `<image>` da capa e `<text>` truncado em 10 caracteres (`...`).
  - Renderiza nós de Temas com círculos SVG estilizados.
  - Emite eventos `@select-theme` e `@select-book`.
- **`front/app/components/graph/ThemeCanvasOverlay.vue`**:
  - Modal/Sheet deslizante sobre o grafo.
  - Topo: Carrossel com scroll horizontal de capas dos livros daquele tema.
  - Corpo: Feed das anotações daquele tema com autor e livro.
  - Ao clicar em um livro do carrossel: Abre o drawer do livro filtrado.
- **`front/app/components/graph/BookAnnotationsDrawer.vue`**:
  - Lista de todas as anotações daquele livro.
  - Formulário para criação rápida de "Anotações Soltas" (sem CFI) com seleção dos temas do livro.

---

## 6. Tratamento de Erros & Fallbacks

1. **Falha na Chamada de IA / Gemini API**:
   - Caso a busca externa ou IA demore ou retorne erro, o livro é salvo normalmente no catálogo público com capa e dados básicos. O backend registra log de warning e permite reprocessamento via `/api/books/:id/enrich`.
2. **Capas Inexistentes**:
   - Se o EPUB/PDF não possuir imagem de capa, o backend gera um cover estilizado em SVG contendo as iniciais e o título do livro.
3. **Validação de Temas nas Anotações**:
   - Se o usuário tentar vincular um tema que não pertence aos `BookTheme` daquele livro, o backend rejeita com erro `400 Bad Request: O tema informado não pertence a este livro`.

---

## 7. Estratégia de Testes

- **Backend (`aresta-back-node`)**:
  - Testes unitários e de integração com Vitest e Supertest para:
    - Upload administrativo e permissões (`role === 'ADMIN'`).
    - Validação de anotações soltas e regra de temas pertencentes ao livro.
    - Estrutura retornada pelo endpoint `/api/graph`.
- **Microserviço Go (`aresta-ocr`)**:
  - Testes unitários com mock do Gemini para `AnalyzeBook` e cálculo de similaridade de cosseno.
- **Frontend (`front`)**:
  - Testes unitários de renderização de nós e truncamento de títulos (`<= 10` caracteres).
