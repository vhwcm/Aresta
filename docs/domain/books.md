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
5. **Estratégia de Sincronização Híbrida (ADR-007)**:
   - Para usuários com múltiplos dispositivos, os metadados (posição, destaques, notas) são sincronizados via `/api/sync` com o PostgreSQL central.
   - Os arquivos binários (`.epub` e `.pdf`) são sincronizados diretamente com o Google Drive privado do usuário (`AppDataFolder`), com cache local em OPFS/FS. Ver `docs/decisions/ADR-007-hybrid-sync-storage.md`.
6. **Exclusão em Cascata, Limpeza no Drive e Prevenção de Ressuscitação**:
   - Ao deletar um livro da estante (`UserBookItem`), todas as anotações (`Annotation`) e flashcards (`Flashcard`) gerados a partir do livro são automaticamente excluídos em cascata no armazenamento local (IndexedDB/SQLite).
   - **Remoção no Google Drive / Cloud Provider**: Se o usuário estiver autenticado ou com o Google Drive conectado, a pasta remota correspondente (`Aresta/[Título]/`) é excluída via API, e o arquivo binário local é purgado de `bookCache` e `getBinaryStorage()`.
   - **Prevenção de Ressuscitação por Sync**:
     - O método `fetchUserBooks()` consulta `bookRepo.getRawAll()` e rejeita a reimportação de qualquer pasta do Drive cujo título conste como excluído (`deleted_at`).
     - O serviço `DriveSyncService` carrega livros via `db.getBooksRaw()` para preservar e propagar o tombstone `deleted_at` no arquivo `library.json`, impedindo que downloads de snapshots antigos da nuvem restaurem livros apagados.
   - Na interface (`/library`), ao solicitar a exclusão de uma obra que possui anotações ou flashcards vinculados, o modal de confirmação exibe um alerta proeminente (`book-notes-warning-box`) quantificando o número de anotações e flashcards que serão permanentemente apagados junto com o livro.

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
