# Tasks: Alteração Dinâmica de Tamanho de Fonte em EPUB

- [x] **Tarefa 1: Interfaces e Adaptadores**
  - [x] 1.1 Atualizar `IBookDocument.ts` com `fontSize?: number` e `setFontSize?(size: number, currentPage?: number): number`.
  - [x] 1.2 Atualizar `EpubDocumentAdapter.ts` com suporte a `_fontSize`, repaginação dinâmica por seção, limpeza de cache, preservação proporcional de posição e renderização em canvas/SVG e textLayer.
  - [x] 1.3 Atualizar `PdfDocumentAdapter.ts` com `setFontSize` no-op.
  - [x] 1.4 Criar/atualizar testes unitários em `front/tests/unit/adapters/BookDocumentAdapters.test.ts`.

- [x] **Tarefa 2: Composables, Store e Engine 2D**
  - [x] 2.1 Atualizar `useSettings.ts` para suportar `epubFontSize` com persistência em `localStorage`.
  - [x] 2.2 Atualizar `readerStore.ts` com estado `fontSize`, ações `setFontSize`, `increaseFontSize`, `decreaseFontSize`, `resetFontSize` e integração com `setDocument`.
  - [x] 2.3 Atualizar `useBookPageTurn.ts` para observar `store.fontSize`, invalidar `rasterCache` e renderizar a nova visão.
  - [x] 2.4 Criar/atualizar testes unitários em `front/tests/unit/composables/useReaderState.test.ts` e `useSettings.test.ts`.

- [x] **Tarefa 3: Interface do Usuário e Controles**
  - [x] 3.1 Adicionar botão tipográfico `Aa` e Popover de ajuste de tamanho de fonte no `ReaderBottomBar.vue` (visível para EPUB).
  - [x] 3.2 Adicionar controle de tamanho de fonte padrão no `SettingsModal.vue`.
  - [x] 3.3 Atualizar testes em `front/tests/unit/components/ReaderComponents.test.ts`.

- [x] **Tarefa 4: Backend UserSettings (Consistência)**
  - [x] 4.1 Atualizar schema do Prisma, Zod schema e Service no `aresta-back-node`.
  - [x] 4.2 Rodar testes do backend.

- [x] **Tarefa 5: Validação, Documentação e Finalização**
  - [x] 5.1 Executar a suíte completa de testes no frontend e backend.
  - [x] 5.2 Atualizar documentação em `docs/domain/reading.md`, `docs/architecture/diagrams/reader-adapter-flow.txt` e `docs/leitor_e_gerenciamento_memoria.md`.
  - [x] 5.3 Mover spec para `specs/completed/epub-font-size/`.
  - [x] 5.4 Fazer commits atômicos descritivos via `git-commit`.
