# Design Técnico: Livros & Livretos Didáticos com IA (Didactic Explainer Booklets)

## 1. Visão Geral da Arquitetura

O sistema de Livretos Didáticos do Aresta é construído com base em 4 pilares:
1. **Padrão Strategy de Leitura (`DidacticDocumentAdapter`)**: Novo adapter implementando a interface canônica `IBookDocument`, responsável por transformar o formato próprio de Markdown estruturado em páginas virtuais com camada de texto e suporte completo a anotações/grifos.
2. **Motor Didático de IA (`DidacticPromptEngine` & `DidacticAIService`)**: Gera explicações com analogias, princípios primeiros, diagramas visuais Mermaid.js e callouts coloridos.
3. **Motor de Composição & Restrição de Append (`DidacticBookletService`)**: Gerencia a criação de livretos e a anexação sequencial de capítulos em livretos existentes, impondo a regra inegociável de que **só é permitido appendar livretos em livretos**.
4. **Camada de Testes Automatizados**: Suíte exaustiva para validação de integridade do Strategy, camadas de seleção/anotação e limites de composição.

---

## 2. Diagrama de Fluxo & Arquitetura Strategy

Consulte o diagrama visual detalhado em [didactic-flow.txt](diagrams/didactic-flow.txt).

---

## 3. Modelo de Dados & Prisma (`schema.prisma`)

```prisma
// Extensão do modelo Book para suportar livretos de formato próprio
model Book {
  id              Int               @id @default(autoincrement())
  title           String
  file_path       String
  cover_path      String?
  format_type     String            @default("EPUB") // "EPUB" | "PDF" | "DIDACTIC"
  is_ai_generated Boolean           @default(false)
  created_at      DateTime          @default(now())
  publicInfo      BookPublicInfo?
  userBooks       UserBook[]
  bookThemes      BookTheme[]
  annotations     Annotation[]
  flashcards      Flashcard[]
  didacticBooklet DidacticBooklet?

  @@map("books")
}

// Modelo de Livreto Didático (Agregador de Capítulos/Artigos)
model DidacticBooklet {
  id              String                   @id @default(uuid())
  user_id         Int
  book_id         Int                      @unique
  title           String
  description     String?
  created_at      DateTime                 @default(now())
  updated_at      DateTime                 @default(now()) @updatedAt
  
  user            User                     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  book            Book                     @relation(fields: [book_id], references: [id], onDelete: Cascade)
  chapters        DidacticBookletChapter[]

  @@index([user_id, updated_at])
  @@map("didactic_booklets")
}

// Capítulos que compõem o livreto didático (gerados ou appendados)
model DidacticBookletChapter {
  id              String          @id @default(uuid())
  booklet_id      String
  order_index     Int             // Posição no livreto (1, 2, 3...)
  title           String
  topic           String
  raw_markdown    String          // Conteúdo em Markdown com Mermaid e Callouts
  flashcard_id    Int?
  annotation_id   Int?
  theme_id        Int?
  diagram_count   Int             @default(0)
  created_at      DateTime        @default(now())

  booklet         DidacticBooklet @relation(fields: [booklet_id], references: [id], onDelete: Cascade)
  flashcard       Flashcard?      @relation(fields: [flashcard_id], references: [id], onDelete: SetNull)
  annotation      Annotation?     @relation(fields: [annotation_id], references: [id], onDelete: SetNull)
  theme           Theme?          @relation(fields: [theme_id], references: [id], onDelete: SetNull)

  @@unique([booklet_id, order_index])
  @@map("didactic_booklet_chapters")
}
```

---

## 4. Frontend: Padrão Strategy (`DidacticDocumentAdapter`)

### Interface `IBookDocument` & `BookDocumentFactory`

O `DidacticDocumentAdapter` implementa rigorosamente a interface `IBookDocument`:

```typescript
export class DidacticDocumentAdapter implements IBookDocument {
  readonly type = 'didactic' as const;
  readonly metadata: BookMetadata;
  readonly isLoaded: boolean;
  
  private chapters: DidacticChapter[];
  private virtualPages: VirtualPage[];

  async load(source: File | ArrayBuffer | string, ...args: any[]): Promise<void> {
    // 1. Faz o parse do JSON do livreto (capítulos e metadados)
    // 2. Executa a quebra de páginas virtual calculando a densidade de texto e blocos Mermaid
    // 3. Monta o índice de capítulos e páginas
  }

  get totalPages(): number {
    return this.virtualPages.length;
  }

  async getPage(pageNumber: number, targetWidth?: number, targetHeight?: number): Promise<PageData> {
    // Renderiza a página virtual em Canvas ou DOM estruturado para o motor de leitura 2D/3D
  }

  async renderTextLayer(pageNumber: number, container: HTMLElement): Promise<void> {
    // Injeta a camada de spans de texto selecionável e grifável
    // Mapeia coordenadas para o sistema de anotações canônico
  }

  destroy(): void {
    // Limpa ouvintes e nós da memória
  }
}
```

### Âncora Canônica de Anotação no Formato Próprio
Para persistir destaques e notas na tabela `annotations` do PostgreSQL/SQLite:
- O campo `cfi` recebe a âncora canônica: `didactic://c<chapterIndex>/p<pageIndex>#b<blockIndex>:<startOffset>-<endOffset>`.
- Ao abrir a página, o `DidacticDocumentAdapter` lê as anotações do livro e destaca os blocos correspondentes com as cores configuradas pelo usuário.

---

## 5. Regras de Negócio e Restrições de Append (`DidacticBookletService`)

### Algoritmo de Validação de Append

```typescript
export async function appendChapterToBooklet(userId: number, targetBookId: number, dto: AppendChapterDTO) {
  // 1. Busca o livro de destino
  const book = await prisma.book.findUnique({
    where: { id: targetBookId },
    include: { didacticBooklet: true }
  });

  if (!book) {
    throw new NotFoundError('Livro de destino não encontrado');
  }

  // 2. RESTRIÇÃO INEGOCIÁVEL: Só podemos appendar livreto em livreto
  if (!book.is_ai_generated || book.format_type !== 'DIDACTIC' || !book.didacticBooklet) {
    throw new BusinessRuleError(
      'CANNOT_APPEND_TO_NON_BOOKLET',
      'Não é permitido anexar explicações a livros convencionais (EPUB/PDF). A anexação é permitida exclusivamente em livretos didáticos gerados por IA.'
    );
  }

  // 3. Calcula o próximo order_index
  const maxChapter = await prisma.didacticBookletChapter.findFirst({
    where: { booklet_id: book.didacticBooklet.id },
    orderBy: { order_index: 'desc' }
  });
  const nextOrderIndex = (maxChapter?.order_index ?? 0) + 1;

  // 4. Cria o novo capítulo anexado
  const chapter = await prisma.didacticBookletChapter.create({
    data: {
      booklet_id: book.didacticBooklet.id,
      order_index: nextOrderIndex,
      title: dto.title,
      topic: dto.topic,
      raw_markdown: dto.markdown,
      flashcard_id: dto.flashcard_id,
      annotation_id: dto.annotation_id,
      theme_id: dto.theme_id,
      diagram_count: dto.diagram_count ?? 0,
    }
  });

  return { book, chapter };
}
```

---

## 6. Schemas Zod de Validação (`didactic.schema.ts`)

```typescript
import { z } from 'zod';

export const CreateBookletSchema = z.object({
  title: z.string().min(2).max(200),
  topic: z.string().min(3).max(300),
  theme_id: z.number().int().positive().optional(),
  flashcard_id: z.number().int().positive().optional(),
  annotation_id: z.number().int().positive().optional(),
  depth_level: z.enum(['quick_summary', 'standard', 'deep_dive']).default('standard'),
});

export const AppendChapterSchema = z.object({
  target_book_id: z.number().int().positive(),
  title: z.string().min(2).max(200).optional(),
  topic: z.string().min(3).max(300),
  theme_id: z.number().int().positive().optional(),
  flashcard_id: z.number().int().positive().optional(),
  annotation_id: z.number().int().positive().optional(),
  depth_level: z.enum(['quick_summary', 'standard', 'deep_dive']).default('standard'),
});

export type CreateBookletDTO = z.infer<typeof CreateBookletSchema>;
export type AppendChapterDTO = z.infer<typeof AppendChapterSchema>;
```

---

## 7. Estratégia de Testes Automatizados

### 1. Testes Unitários de Backend (`tests/unit/didacticBooklet.service.spec.ts`):
- `deve criar um livreto didático standalone com sucesso`: valida criação de `Book`, `UserBook`, `DidacticBooklet` e capítulo 1.
- `deve appendar um novo capítulo com sucesso em um livreto didático`: valida incremento sequencial de `order_index`.
- `deve REJEITAR anexação quando o livro alvo for um EPUB ou PDF tradicional`: verifica lançamento de erro `CANNOT_APPEND_TO_NON_BOOKLET` com código 422.
- `deve REJEITAR anexação se o livro pertencer a outro usuário ou não existir`.

### 2. Testes Unitários de Frontend (`front/tests/unit/adapters/DidacticDocumentAdapter.spec.ts`):
- `deve carregar documento didático e calcular totalPages corretamente`.
- `deve renderizar a camada de texto selecionável (renderTextLayer) com spans indexados`.
- `deve aplicar grifos e destaques canônicos no formato próprio de forma consistente`.
- `deve re-paginar corretamente ao alterar fontSize ou fontFamily`.

### 3. Testes de Integração de API (`tests/integration/didactic.routes.spec.ts`):
- `POST /api/v1/didactic/booklets` ➔ Status 201 e retorno do `book_id`.
- `POST /api/v1/didactic/booklets/:id/append` ➔ Status 200 com novo capítulo ou 422 para livro convencional.
