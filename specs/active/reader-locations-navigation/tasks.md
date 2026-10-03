# Tarefas de Implementação: Navegação por Localizações, Salto e Sumário

Ordem pensada para TDD: primeiro as fundações puras com teste, depois os adaptadores, depois os motores e a UI. Cada fase = 1 commit atômico.

- [ ] **1. Fundações puras (TDD)** — R1, R2
  - [ ] 1.1 `readingPosition.ts` + testes (parse/serialize/legado/inválidos)
  - [ ] 1.2 `locationIndex.ts` (estimado/exato/`withExactSection`, busca binária) + testes
  - [ ] 1.3 `chunkScheduler.ts` (prioridade por distância, deadline, cancel, reprioritize) + testes com timers falsos
  - [ ] 1.4 `anchorCompensation.ts` e `heightEstimator.ts` + testes
  - [ ] 1.5 `tocNormalizer.ts` (foliate toc + pdf outline) + testes

- [ ] **2. Persistência local** — R9
  - [ ] 2.1 `types.ts` + `TauriSqliteAdapter` (ALTER idempotente) + `DexieAdapter` (nova versão) + `InMemoryAdapter`
  - [ ] 2.2 `BookRepository` + `useSyncEngine` com `readingPosition`; testes de fallback
  - [ ] 2.3 Remover o `PATCH /api/user-books` morto de `persistProgress`; debounce de 1 s

- [ ] **3. EPUB progressivo** — R1, R3
  - [ ] 3.1 `lazyZip.ts` + teste com fixture EPUB mínimo
  - [ ] 3.2 `sectionTextCounter.ts`, `sectionAssetResolver.ts` (blob URL + revoke) + testes
  - [ ] 3.3 `locationIndexCache.ts` (IndexedDB, chave hash + `LOCATION_SIZE`)
  - [ ] 3.4 Refatorar `EpubDocumentAdapter.load` (crítico: alvo + 1; resto via scheduler); LRU de docs de seção; implementar `INavigableDocument`
  - [ ] 3.5 Medir no `readerProfiler` as etapas novas

- [ ] **4. PDF** — R5
  - [ ] 4.1 `pdfPageGeometry.ts` (blocos de 10 + cache) e `getAspectRatio(page)` real
  - [ ] 4.2 `pdfRenderWindow.ts` (±1/±2, LRU 6, cancel, prévia 0,2) + testes com mocks
  - [ ] 4.3 `PdfDocumentAdapter` implementa `INavigableDocument` (`getOutline` → TOC)

- [ ] **5. Store & navegação** — R2, R6
  - [ ] 5.1 `readerStore`: `position`, `currentPage` derivado, `goToPosition`
  - [ ] 5.2 `useReadingNavigation` (histórico, parse do "Ir para") + `useLocationProgress` + testes
  - [ ] 5.3 `legacyPositionResolver` + reescrita preguiçosa das anotações EPUB `page:N`; atualizar `readerHighlight.ts`, `ReaderBookNotesPanel`, `ReaderGraphPanel`, `BookAnnotationsDrawer`, `ReaderAnnotationModal`

- [ ] **6. Motores** — R4, R6, R7
  - [ ] 6.1 `sectionChunker.ts` + testes
  - [ ] 6.2 `ReaderScrollEngine`: itens virtuais (seção, bloco), placeholders estimados, `ResizeObserver` + compensação, salto via `Range`; PDF via `pdfRenderWindow`. Extrair subcomponentes `ScrollPdfFlow.vue` / `ScrollEpubFlow.vue` (o arquivo atual tem 1.172 linhas)
  - [ ] 6.3 `PageCurlCanvas`/`EpubDocumentAdapter`: `getScreens(section)` preguiçoso e rótulo por localização

- [ ] **7. UI de navegação** — R8 (seguir `Design.md`)
  - [ ] 7.1 `ReaderProgressScrubber` (marcas + balão; salto ao soltar)
  - [ ] 7.2 `ReaderTocDrawer` (aninhado, atual destacado, %)
  - [ ] 7.3 `ReaderBackChip` e `ReaderGoToField`
  - [ ] 7.4 Integrar em `ReaderBottomBar` (desktop + mobile) e trocar "Pág." por "Loc." no EPUB

- [ ] **8. Verificação & documentação**
  - [ ] 8.1 `scripts/bench-reader.ts` + fixtures; validar os orçamentos do requirements §4
  - [ ] 8.2 Quality gates: `npm test` + `npm run build` (apps/web)
  - [ ] 8.3 Atualizar `docs/architecture/reader.md` e `docs/leitor_e_gerenciamento_memoria.md`; criar `ADR-031-reader-locations-and-progressive-loading.md` (supersede parcial do ADR-020 §2–3)
  - [ ] 8.4 Skill `review-consistency`; mover a spec para `specs/completed/`
