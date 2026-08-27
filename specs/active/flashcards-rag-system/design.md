# Design Técnico: Sistema de Flashcards com RAG e Repetição Espaçada

## 1. Visão Geral da Arquitetura
O sistema de flashcards do Aresta conecta anotações de leitura do usuário, recuperação semântica via embeddings (RAG local com cosine similarity), microsserviço de IA gRPC (Gemini com small-shot de 3 arquétipos pedagógicos), persistência 1:1 no SQLite/Prisma, agendamento de jobs (22:00 e 00:00) e interface moderna no Nuxt 4 (Home + Central de Revisão) integrada ao motor de Ofensiva (Streak).

---

## 2. Diagrama Visual de Fluxo
Consulte o diagrama ASCII completo em: `diagrams/flow.txt`

---

## 3. Modelo de Banco de Dados (`prisma/schema.prisma`)

### 3.1. Alterações no modelo `Annotation`
Adição do campo `embedding` e da relação com `Flashcard`:
```prisma
model Annotation {
  id               Int               @id @default(autoincrement())
  user_id          Int
  book_id          Int
  cfi              String?
  selected_text    String?
  note             String?
  chapter_title    String?
  progress         Float?            @default(0.0)
  embedding        String?           // JSON array string com vetor float[]
  created_at       DateTime          @default(now())
  updated_at       DateTime          @default(now()) @updatedAt
  user             User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  book             Book              @relation(fields: [book_id], references: [id], onDelete: Cascade)
  annotationThemes AnnotationTheme[]
  flashcard        Flashcard?

  @@index([user_id, book_id])
  @@map("annotations")
}
```

### 3.2. Novos Modelos: `Flashcard` e `DailyDeckCard`
```prisma
model Flashcard {
  id                Int             @id @default(autoincrement())
  user_id           Int
  annotation_id     Int             @unique
  book_id           Int
  card_type         String          @default("CONCEPT_RECALL") // REAL_SITUATION | CONCEPT_RECALL | CONCEPT_UNION
  question          String
  answer            String
  context_summary   String?
  repetition_level  Int             @default(1)
  next_review_at    DateTime        @default(now())
  last_reviewed_at  DateTime?
  review_count      Int             @default(0)
  difficulty        Float           @default(2.5)
  created_at        DateTime        @default(now())
  updated_at        DateTime        @default(now()) @updatedAt

  user              User            @relation(fields: [user_id], references: [id], onDelete: Cascade)
  annotation        Annotation      @relation(fields: [annotation_id], references: [id], onDelete: Cascade)
  book              Book            @relation(fields: [book_id], references: [id], onDelete: Cascade)
  dailyDeckCards    DailyDeckCard[]

  @@index([user_id, next_review_at])
  @@map("flashcards")
}

model DailyDeckCard {
  id           Int        @id @default(autoincrement())
  user_id      Int
  deck_date    String     // Formato YYYY-MM-DD
  flashcard_id Int
  position     Int
  is_reviewed  Boolean    @default(false)
  rating       String?    // 'hard' | 'good' | 'easy'
  reviewed_at  DateTime?
  created_at   DateTime   @default(now())
  updated_at   DateTime   @default(now()) @updatedAt

  user         User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  flashcard    Flashcard  @relation(fields: [flashcard_id], references: [id], onDelete: Cascade)

  @@unique([user_id, deck_date, flashcard_id])
  @@index([user_id, deck_date, position])
  @@map("daily_deck_cards")
}
```

---

## 4. Contratos gRPC (`proto/ai/v1/ai.proto`)
Extensão dos serviços de IA para suportar embeddings de anotações e geração de flashcards com RAG:

```protobuf
syntax = "proto3";

package ai.v1;

option go_package = "aresta-ocr/gen/ai/v1;aiv1";

service AIService {
  rpc AnalyzeBook(AnalyzeBookRequest) returns (AnalyzeBookResponse);
  rpc GenerateEmbedding(GenerateEmbeddingRequest) returns (GenerateEmbeddingResponse);
  rpc GenerateFlashcard(GenerateFlashcardRequest) returns (GenerateFlashcardResponse);
}

message GenerateEmbeddingRequest {
  string text = 1;
}

message GenerateEmbeddingResponse {
  repeated float embedding = 1;
}

message ContextAnnotation {
  string note = 1;
  string quote = 2;
  string chapter = 3;
}

message GenerateFlashcardRequest {
  string book_title = 1;
  string target_quote = 2;
  string target_note = 3;
  string chapter_title = 4;
  repeated string themes = 5;
  repeated ContextAnnotation context_notes = 6;
}

message GenerateFlashcardResponse {
  string question = 1;
  string answer = 2;
  string card_type = 3; // REAL_SITUATION | CONCEPT_RECALL | CONCEPT_UNION
  string context_summary = 4;
}
```

---

## 5. Schemas Zod (`aresta-back-node/src/schemas/flashcard.schema.ts`)

```typescript
import { z } from 'zod';

export const reviewFlashcardSchema = z.object({
  rating: z.enum(['hard', 'good', 'easy']),
});

export const getDailyDeckQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardSchema>;
```

---

## 6. Endpoints de API REST (`aresta-back-node/src/routes/flashcard.routes.ts`)

- `GET /api/v1/flashcards/daily`: Retorna o deck de até 50 flashcards do dia para o usuário logado (com trigger sob demanda se ainda não existir).
- `GET /api/v1/flashcards/daily/first`: Retorna especificamente o primeiro flashcard do deck diário para exibição no card da Home.
- `POST /api/v1/flashcards/:id/review`: Registra a autoavaliação (`hard`, `good`, `easy`), atualiza o agendamento de repetição espaçada, marca o card do deck e incrementa a ofensiva (`streak`).
- `POST /api/v1/flashcards/generate-batch`: Endpoint administrativo/trigger manual para gerar flashcards das anotações pendentes.

---

## 7. Serviços de Backend

### 7.1. `FlashcardRAGService` (`src/services/flashcardRAG.service.ts`)
- Calcula similaridade de cosseno entre embeddings vetoriais.
- Encontra os k-vizinhos mais próximos da anotação no pool de anotações do usuário.
- Comunica com o `aiClient.generateFlashcard` para criar os cards nos 3 arquétipos pedagógicos.

### 7.2. `FlashcardService` (`src/services/flashcard.service.ts`)
- Gerencia o ciclo de vida dos flashcards 1:1 com anotações.
- Monta e garante o deck diário de 50 cards (priorizando `next_review_at <= hoje` + sorteio balanceado de temas).
- Executa a lógica de autoavaliação (SuperMemo / Curva do Esquecimento):
  - `hard`: Nível 1, próxima revisão em 1 dia.
  - `good`: Nível + 1, próxima revisão em 3 dias.
  - `easy`: Nível + 2, próxima revisão em 7 dias.
- Notifica o `StreakService.recordActivity` com `{ flashcards_reviewed: 1 }`.

### 7.3. `FlashcardSchedulerService` (`src/services/flashcardScheduler.service.ts`)
- Cron às **22:00**: Varre usuários ativos e gera flashcards para anotações sem card.
- Cron às **00:00**: Prepara antecipadamente os decks diários de 50 cards para todos os usuários.

---

## 8. Integração Frontend (Nuxt 4 / Vue 3)

- **`front/app/composables/useFlashcards.ts`**:
  - Encapsula chamadas a `GET /api/v1/flashcards/daily`, `GET /api/v1/flashcards/daily/first` e `POST /api/v1/flashcards/:id/review`.
  - Mantém estado reativo do deck do dia, progresso e card atual.
- **`front/app/pages/index.vue`**:
  - Consome o 1º card do deck via `useFlashcards()`.
  - Exibe título, capítulo e pergunta instigante com botão direto "Fazer Flashcard" que navega para `/revisao`.
- **`front/app/pages/revisao.vue`**:
  - Consome o deck de 50 cards do dia.
  - Flip 3D interativo, visualização de arquétipo/tema e botões de avaliação (Difícil, Bom, Fácil).
  - Feedback visual de conclusão de deck e atualização imediata do streak.

---

## 9. Tratamento de Erros & Fallbacks
- Se o serviço gRPC do Gemini estiver indisponível no job das 22h, as anotações permanecem na fila para tentativa posterior ou fallback on-demand.
- Se o usuário não tiver anotações, a UI exibe mensagens de incentivo ("Comece a destacar trechos nos seus livros para gerar flashcards inteligentes").
- Se o usuário tiver menos de 50 flashcards no total, o deck diário é composto por 100% dos cards disponíveis sem erros.
