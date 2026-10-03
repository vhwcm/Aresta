# Design Técnico: Navegação por Localizações, Salto de Página e Sumário

## 1. Visão Geral da Arquitetura
A "página global" do EPUB (`_pageMap`, que exige o layout do livro inteiro) é substituída por um **índice de localizações** baseado em caracteres. Ambos os formatos passam a expor uma **`ReadingPosition`** canônica. Os motores (`ReaderScrollEngine`, `PageCurlCanvas`) e a UI de navegação consomem apenas essa abstração (Strategy, ADR-003/ADR-020), sem conhecer o formato.

Todo trabalho proporcional ao tamanho do livro sai do caminho crítico. Ele vai para um **`ChunkScheduler`** que processa blocos de 10 unidades (seções EPUB / páginas PDF) no idle, priorizando o entorno da posição atual.

Diagramas: `diagrams/open-flow.txt`, `diagrams/jump-flow.txt`.

## 2. Módulos novos (apps/web/app)

Arquivos pequenos e com responsabilidade única. Funções puras ficam separadas do DOM para TDD.

```
utils/reader/position/
  readingPosition.ts        # tipos + parsePosition/serializePosition (puro)
  locationIndex.ts          # LocationIndex: prefix-sum de chars por seção (puro)
  legacyPositionResolver.ts # page:N -> epub:s:o via texto citado / proporção (puro + busca injetada)
utils/reader/scheduling/
  chunkScheduler.ts         # fila priorizada de blocos com deadline, cancelável (DI de idle/clock)
utils/reader/epub/
  lazyZip.ts                # diretório central + inflate sob demanda (fflate filter)
  sectionTextCounter.ts     # conta chars via TreeWalker (mesma regra dos offsets)
  sectionChunker.ts         # divide seção em blocos ~10 locs entre elementos de bloco (puro sobre DOM)
  sectionAssetResolver.ts   # blob URLs sob demanda + revoke
  locationIndexCache.ts     # IndexedDB: { bookHash, LOCATION_SIZE, charsPerSection[] }
utils/reader/pdf/
  pdfPageGeometry.ts        # dimensões por página em blocos + cache
  pdfRenderWindow.ts        # janela ±1/±2, LRU(6), cancelamento, prévia 0.2
utils/reader/scroll/
  anchorCompensation.ts     # delta de scrollTop quando itens acima mudam de altura (puro)
  heightEstimator.ts        # px-por-char medido → altura estimada de bloco (puro)
utils/reader/toc/
  tocNormalizer.ts          # foliate toc / pdf outline -> TocEntry[] (puro)
composables/reader/
  useReadingNavigation.ts   # goToPosition, histórico (chip Voltar), parse do "Ir para"
  useLocationProgress.ts    # Loc. X de Y / Pág. X de Y, %, capítulo atual
components/reader/navigation/
  ReaderProgressScrubber.vue  # slider + marcas + balão
  ReaderTocDrawer.vue         # sumário aninhado
  ReaderBackChip.vue          # "Voltar para ..."
  ReaderGoToField.vue         # campo Ir para
```

## 3. Contratos de Dados

### 3.1. Posição e índice
```typescript
// readingPosition.ts
export type ReadingPosition =
  | { kind: 'epub'; sectionIndex: number; charOffset: number }
  | { kind: 'pdf'; page: number }
export const LOCATION_SIZE = 1024 as const // mudar invalida locationIndexCache
export function serializePosition(p: ReadingPosition): string // 'epub:12:4381' | 'page:37'
export function parsePosition(raw: string | null | undefined): ReadingPosition | LegacyEpubPage | null
export interface LegacyEpubPage { kind: 'legacy-page'; page: number }

// locationIndex.ts
export interface LocationIndex {
  readonly isExact: boolean
  readonly totalLocations: number
  toLocation(pos: Extract<ReadingPosition, { kind: 'epub' }>): number // 1-based
  fromLocation(location: number): Extract<ReadingPosition, { kind: 'epub' }>
  sectionStartLocation(sectionIndex: number): number
  withExactSection(sectionIndex: number, chars: number): LocationIndex // imutável
}
export function createEstimatedIndex(uncompressedBytesPerSection: number[], charsPerByte?: number): LocationIndex
export function createExactIndex(charsPerSection: number[]): LocationIndex
```

### 3.2. Contrato do documento (extensão de `IBookDocument`)
```typescript
export interface INavigableDocument {
  getToc(): Promise<TocEntry[]>
  getTotalUnits(): number               // localizações (EPUB) ou páginas (PDF)
  positionToUnit(p: ReadingPosition): number
  unitToPosition(unit: number): ReadingPosition
  onIndexRefined(cb: () => void): () => void // EPUB: total convergiu; PDF: geometria nova
}
export interface TocEntry { label: string; position: ReadingPosition; unit: number; depth: number; children: TocEntry[] }
```
O `EpubDocumentAdapter` deixa de manter `_pageMap` e `_sectionDocs` de todas as seções. Ele passa a usar um LRU de documentos de seção (≤ 6) carregados sob demanda via `lazyZip`. `getPageForSection`/`getSectionForPage` são removidos e os chamadores migram para `ReadingPosition`.

### 3.3. Store (`readerStore.ts`)
- Novo estado `position: ReadingPosition`. `currentPage` vira **getter derivado** (`positionToUnit`) para manter compatibilidade com Home, cards e bookmarks.
- `goToPage(n)` vira um wrapper de `goToPosition(unitToPosition(n))`.
- `persistProgress` grava `readingPosition` + `currentPage` no `bookRepo`, com debounce de 1 s. O `fetch PATCH /api/user-books` (410 Gone) é removido.

### 3.4. Persistência local (sem Prisma)
- `TauriSqliteAdapter`: `ALTER TABLE books ADD COLUMN reading_position TEXT` idempotente (verifica via `PRAGMA table_info`), mais mapeamento nos SELECT/UPSERT.
- `DexieAdapter`: nova versão de schema (campo não indexado, upgrade sem transformação).
- `types.ts`: `readingPosition?: string | null`. `useSyncEngine`: incluir o campo no payload do Drive.
- **Postgres não muda**: `user_books` foi removida (migration `20260916140000`), portanto a regra 3.2 não se aplica.

## 4. Fluxos

### 4.1. Abertura EPUB (R3)
1. `lazyZip.open(buffer)`: `unzipSync(data, { filter: f => (sizes.set(f.name, f.originalSize), false) })` lê só o diretório central.
2. `epub.init()` com loader preguiçoso (inflate por arquivo via `filter: f => f.name === path`).
3. Consulta `locationIndexCache` por hash (SHA-1 dos primeiros 64 KB + tamanho). Hit → índice exato. Miss → `createEstimatedIndex(sizes da spine)`.
4. Resolve a posição salva → carrega a seção-alvo + 1 vizinha → **1ª tela**.
5. `ChunkScheduler` enfileira contagem exata em blocos de 10 seções, a partir da seção-alvo para fora. Cada seção concluída gera `withExactSection` e um `onIndexRefined` com throttle de 250 ms. No fim, grava o cache.

### 4.2. Abertura PDF (R5)
1. `getDocument` → página-alvo e seguinte rasterizadas na hora.
2. `pdfPageGeometry` em blocos de 10 no idle (só `getViewport`, sem raster). Slots corrigidos com `anchorCompensation`. Cache por hash.

### 4.3. Scroll EPUB por blocos (R4)
- `sectionChunker` divide os filhos de 1º nível do `<body>` em blocos de ~10.240 chars. Um elemento isolado maior que isso vira um bloco próprio.
- Itens virtuais = (seção, bloco). Altura do placeholder = `heightEstimator(chars, pxPerChar)`. `pxPerChar` é medido no 1º bloco real e recalibrado ao mudar fonte, tamanho ou largura.
- Ao montar ou redimensionar um item acima da âncora (1º item visível), aplica `scrollTop += delta` no mesmo frame (`ResizeObserver` → rAF).

### 4.4. Salto (R6)
`useReadingNavigation.goToPosition(p, { pushHistory: true })`:
1. empilha a posição atual (para o chip Voltar);
2. EPUB: garante a seção carregada → localiza o bloco do offset → monta bloco ±1 → `Range(textNode, offset).getBoundingClientRect()` → `scrollTop` exato. PDF: slot → prévia 0,2 → nítida;
3. trava a atualização do observador de baseline até o fim do scroll programático (o mecanismo `isScrollingProgrammatically` já existe).

### 4.5. Paginado EPUB (R7)
- O motor pede `getScreens(sectionIndex)`. A medição de colunas acontece só para a seção pedida (cache por seção + fonte + dimensões); as vizinhas são medidas no idle.
- Cada tela expõe `startOffset`. O rótulo mostra a localização desse offset. Avanço na última tela → seção seguinte, tela 0.

## 5. Componentes Frontend (R8) — seguir `Design.md`
- `ReaderProgressScrubber`: `input` só atualiza o balão (consulta O(log n) ao índice + TOC); `change`/`pointerup` chama `goToPosition`. Marcas de capítulo de profundidade 0, posicionadas por `unit / totalUnits`.
- `ReaderTocDrawer`: lista virtualizada se houver > 200 entradas; capítulo atual = maior entrada com `unit ≤ unitAtual`.
- `ReaderBackChip`: aparece 6 s após um salto ou até o próximo scroll manual > 1 tela; clicar faz `goToPosition(pop())`.
- `ReaderGoToField`: aceita `37`, `37%` e `Loc 1200`; valida e limita aos limites.

## 6. Erros & Fallbacks
- Seção com XHTML inválido: conta 0 chars, mostra placeholder de erro e `logWarn` com o índice da seção.
- IndexedDB indisponível: segue só com a estimativa e a contagem em memória.
- `requestIdleCallback` ausente (Safari): `setTimeout(16)` com deadline sintético de 8 ms.
- Render PDF cancelado: `RenderingCancelledException` é ignorada; outros erros mostram placeholder e o slot é tentado de novo uma vez.
- Legado não resolvido pelo texto: proporção. A anotação é marcada `approximate` (sem reescrever) para nova tentativa quando o índice ficar exato.

## 7. Trade-offs aceitos
| Decisão | Ganho | Custo |
|---|---|---|
| Localizações em vez de páginas | Abertura O(1), números estáveis entre dispositivos, salto exato | "Loc." não corresponde a uma tela; menos familiar que "página" |
| Estimativa + refinamento | Slider usável no frame 1 | O "de Y" varia alguns % na 1ª abertura (1–2 s) |
| Blocos ~10 locs no scroll | DOM limitado (≤ 5 blocos) mesmo em capítulos gigantes | Complexidade de compensação de âncora; CSS de seletor irmão (`p + p`) pode diferir na fronteira do bloco |
| PDF janela ±1/±2 + LRU 6 | ~40 MB de pico em vez de ~65 MB+ por bloco de 10 | Scroll muito rápido mostra a prévia 0,2 por ~100 ms |
| Blob URL para imagens | −33% de memória, sem strings gigantes | Precisa revogar ao desmontar (vazamento se esquecido, coberto por teste) |

## 8. Estratégia de Testes (Vitest, jsdom)
Unit puros: `readingPosition`, `locationIndex`, `legacyPositionResolver`, `chunkScheduler` (timers falsos + idle injetado), `sectionChunker`, `sectionTextCounter`, `anchorCompensation`, `heightEstimator`, `tocNormalizer`, `pdfRenderWindow` (mocks pdf.js), `lazyZip` (fixture EPUB mínimo).
Integração: `EpubDocumentAdapter` com fixture → 1ª seção disponível antes da contagem total; `readerStore` → persistência `readingPosition` com fallback.
Benchmark: `apps/web/scripts/bench-reader.ts` com fixtures (EPUB 1 MB, PDF 500 págs.) lendo `window.__ARESTA_READER_PROFILE__`.
