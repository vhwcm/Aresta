# Domínio: Livretos Didáticos com IA (`DidacticBooklet`)

## 1. Propósito
O domínio de livretos didáticos permite gerar livros e cadernos pedagógicos estruturados sob demanda com IA generativa (Gemini), integrando analogias, princípios primeiros, diagramas Mermaid.js e callouts com suporte completo ao leitor imersivo e ao sistema de anotações do Aresta.

---

## 2. Entidades e Modelo de Dados

### Modelo Prisma (`prisma/schema.prisma`)
```prisma
model DidacticBooklet {
  id              Int                      @id @default(autoincrement())
  user_id         Int
  book_id         Int
  theme_id        Int?
  title           String
  description     String?
  target_audience String                   @default("student")
  created_at      DateTime                 @default(now())
  updated_at      DateTime                 @default(now()) @updatedAt
  user            User                     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  book            Book                     @relation(fields: [book_id], references: [id], onDelete: Cascade)
  theme           Theme?                   @relation(fields: [theme_id], references: [id], onDelete: SetNull)
  chapters        DidacticBookletChapter[]

  @@index([user_id])
  @@map("didactic_booklets")
}

model DidacticBookletChapter {
  id             Int             @id @default(autoincrement())
  booklet_id     Int
  order_index    Int
  title          String
  topic          String
  flashcard_id   Int?
  annotation_id  Int?
  raw_markdown   String          @db.Text
  diagram_count  Int             @default(0)
  depth_level    String          @default("standard")
  created_at     DateTime        @default(now())
  booklet        DidacticBooklet @relation(fields: [booklet_id], references: [id], onDelete: Cascade)
  flashcard      Flashcard?      @relation(fields: [flashcard_id], references: [id], onDelete: SetNull)
  annotation     Annotation?     @relation(fields: [annotation_id], references: [id], onDelete: SetNull)

  @@unique([booklet_id, order_index])
  @@index([booklet_id])
  @@map("didactic_booklet_chapters")
}
```

---

## 3. Regras de Negócio

1. **Criação e Persistência Híbrida**:
   - Cada livreto criado gera um registro correspondente na tabela `books` (`file_type: 'didactic'`) e na estante do usuário (`user_books`), permitindo acesso direto, controle de progresso e abertura no leitor.
2. **Entrega de Arquivo no Leitor**:
   - A rota `GET /api/books/:id/file` detecta livretos didáticos e devolve diretamente o payload JSON com metadados e capítulos ordenados (`application/json`).
   - O frontend utiliza o `DidacticDocumentAdapter` via padrão Strategy, paginando o conteúdo virtualmente para o motor de virada de página 2D/3D.
3. **Restrição de Append**:
   - Apenas livretos didáticos existentes podem receber novos capítulos (`POST /api/didactic/booklets/:id/append`). Tentativas de anexar capítulos a livros regulares (.epub/.pdf) retornam erro 422 com código `CANNOT_APPEND_TO_NON_BOOKLET`.
4. **Layout Dedicado no Frontend**:
   - As páginas de leitura utilizam o layout `reader` (`apps/web/app/layouts/reader.vue`) para garantir viewport total sem paddings da navbar global.
5. **Arquitetura de Páginas Físicas Estritas & Zero Scroll**:
   - Livretos didáticos simulam folhas de um livro físico no motor 2D/3D (`PageCurlCanvas`). Rolagem vertical interna é terminantemente proibida (`overflow: hidden !important`).
   - A IA é orientada por um contrato editorial rígido com arquétipos estruturados (`cover`, `foundation`, `mechanism`, `analogy`, `nuances`, `subtopics`, `flashcards`) e orçamento restrito de palavras (~100 a 160 palavras por folha).
   - O `DidacticDocumentAdapter` realiza particionamento inteligente preventivo de seções longas para evitar quebra de layout mesmo com fontes ampliadas.

