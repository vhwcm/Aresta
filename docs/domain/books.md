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
   - Os arquivos de livros são salvos em `apps/api/storage/epubs/` e `apps/api/storage/pdfs/`.
   - As imagens de capa extraídas ou carregadas são salvas em `apps/api/storage/covers/`.
   - O campo `file_path` armazena o caminho relativo ao root do backend para portabilidade.
3. **Disponibilização e Streaming**:
   - O endpoint `GET /api/books/:id/download` serve o binário com cabeçalhos adequados de `Content-Type` e `Content-Disposition`.
   - O endpoint `GET /api/books/:id/cover` serve a imagem de capa em cache.
4. **Vínculo com Nós/Temas do Grafo (`BookTheme`)**:
   - Livros na estante do usuário (`UserBookItem`) podem ser associados a múltiplos nós do Grafo de Conhecimento (`Theme`).
   - Na interface de estante (`/library`), as tags de temas são exibidas com as cores configuradas nos nós e permitem filtragem instantânea combinada com o status de leitura.
5. **Estratégia de Sincronização Híbrida (ADR-007)**:
   - Para usuários com múltiplos dispositivos, os metadados (posição, destaques, notas) são sincronizados via `/api/sync` ou pelo `DriveSyncService` com a pasta privada do Google Drive.
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
- **Backend (`apps/api`)**:
  - Módulo Reader: `apps/api/src/modules/reader/controllers/book.controller.ts`
  - Services: `apps/api/src/modules/reader/services/book.service.ts`
  - Routes: `apps/api/src/modules/reader/routes/book.routes.ts`
  - Schemas: `apps/api/src/modules/reader/schemas/book.schema.ts`
- **Frontend (`apps/web`)**:
  - Repositories: `apps/web/app/adapters/database/repositories/BookRepository.ts`
  - Composables: `apps/web/app/composables/useUserBooks.ts`, `apps/web/app/composables/useLocalBookUpload.ts`
  - Páginas e Componentes: `apps/web/app/pages/library.vue`, `apps/web/app/components/graph/BookAnnotationsDrawer.vue`
