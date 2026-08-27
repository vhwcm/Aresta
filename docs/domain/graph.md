# Domínio: Grafo de Conhecimento, Temas & Livros (`Theme`)

## 1. Propósito
O Grafo de Conhecimento do Aresta organiza e interconecta ideias, livros e anotações a partir de um **Catálogo Global Dinâmico de Temas** e **Hierarquia de Subtemas**, gerados e enriquecidos com auxílio de IA (Gemini Grounding + Embeddings).

---

## 2. Entidades e Modelo de Dados

### Modelos Prisma (`prisma/schema.prisma`)
```prisma
model Theme {
  id                Int               @id @default(autoincrement())
  name              String            @unique
  color             String?           @default("#E57B55")
  description       String?
  embedding         String?           // Vetor de embeddings JSON
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
```

---

## 3. Regras de Negócio e Interações

1. **Nós de Livros no Grafo**:
   - Cada livro no catálogo é renderizado como um nó individual no grafo com miniatura de capa.
   - O título é truncado em até 10 caracteres (`nome.length > 10 ? nome.slice(0, 10) + '...' : nome`).
2. **Nós de Temas e Subtemas**:
   - Temas principais conectam-se ao nó de conhecimento central ou a outros temas superiores através da tabela `ThemeHierarchy`.
3. **Interações do Usuário**:
   - **Clique no Nó do Livro**: Abre o painel lateral com resumo do livro, todas as suas anotações e formulário para cadastrar **Anotações Soltas** (sem CFI).
   - **Clique no Nó de Tema**: Abre o **Canvas Overlay** contendo um carrossel horizontal de livros no topo e a lista de anotações relacionadas abaixo.
   - **Vínculo Restrito de Anotações**: Anotações só podem ser vinculadas a temas que façam parte do conjunto de temas associados ao respectivo livro.

---

## 4. Código Relacionado
- **Backend**:
  - `src/controllers/graph.controller.ts`, `src/services/graph.service.ts`, `src/schemas/graph.schema.ts`, `src/services/ai.client.ts`
- **Frontend**:
  - `front/app/composables/useGraph.ts`, `front/app/components/GraphCanvas.vue`, `front/app/components/graph/ThemeCanvasOverlay.vue`, `front/app/components/graph/BookAnnotationsDrawer.vue`, `front/app/pages/grafo.vue`
