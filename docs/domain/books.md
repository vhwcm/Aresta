# Domínio: Catálogo de Livros & Armazenamento (`Book`)

## 1. Propósito
O domínio de livros gerencia o catálogo global de obras digitais disponíveis no ecossistema Aresta, incluindo o armazenamento de arquivos binários (EPUB e PDF) e imagens de capa.

---

## 2. Entidades e Modelo de Dados

### Modelo Prisma (`prisma/schema.prisma`)
```prisma
model Book {
  id          Int          @id @default(autoincrement())
  title       String
  file_path   String
  cover_path  String?
  created_at  DateTime     @default(now())
  userBooks   UserBook[]
  annotations Annotation[]

  @@map("books")
}
```

---

## 3. Regras de Negócio

1. **Formatos Suportados**:
   - `.epub`: Padrão aberto de livro eletrônico com layout reflowable ou fixed.
   - `.pdf`: Documento de layout fixo renderizado página a página.
2. **Armazenamento de Arquivos (`storage/`)**:
   - Os arquivos de livros são salvos em `aresta-back-node/storage/epubs/` e `storage/pdfs/`.
   - As imagens de capa extraídas ou carregadas são salvas em `storage/covers/`.
   - O campo `file_path` armazena o caminho relativo ao root do backend para portabilidade.
3. **Disponibilização e Streaming**:
   - O endpoint `GET /api/books/:id/download` serve o binário com cabeçalhos adequados de `Content-Type` e `Content-Disposition`.
   - O endpoint `GET /api/books/:id/cover` serve a imagem de capa em cache.
4. **Vínculo com Nós/Temas do Grafo (`BookTheme`)**:
   - Livros na estante do usuário (`UserBook`) podem ser associados a múltiplos nós do Grafo de Conhecimento (`Theme`).
   - Os endpoints `PUT /api/user-books/:id/themes`, `POST /api/user-books/:id/themes` e `DELETE /api/user-books/:id/themes/:themeId` gerenciam esses vínculos.
   - Na interface de estante (`/library`), as tags de temas são exibidas com as cores configuradas nos nós e permitem filtragem instantânea combinada com o status de leitura.

---

## 4. Código Relacionado
- **Backend**:
  - Controllers: `aresta-back-node/src/controllers/book.controller.ts`, `aresta-back-node/src/controllers/userBook.controller.ts`
  - Services: `aresta-back-node/src/services/book.service.ts`, `aresta-back-node/src/services/userBook.service.ts`
  - Routes: `aresta-back-node/src/routes/book.routes.ts`, `aresta-back-node/src/routes/userBook.routes.ts`
  - Schemas: `aresta-back-node/src/schemas/book.schema.ts`, `aresta-back-node/src/schemas/userBook.schema.ts`
- **Frontend**:
  - Composables: `front/app/composables/useCatalog.ts`, `front/app/composables/useUserBooks.ts`, `front/app/composables/useGraph.ts`
  - Páginas e Componentes: `front/app/pages/library.vue`, `front/app/components/NodeDrawer.vue`
