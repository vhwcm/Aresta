# Design da Spec: Alteração Dinâmica de Tamanho de Fonte em EPUB

## 1. Arquitetura e Estrutura de Componentes

```
┌────────────────────────────────────────────────────────┐
│               ReaderBottomBar (Aa Button)              │
│                           │                            │
│                  (Pop-over Tipográfico)                │
└───────────────────────────┬────────────────────────────┘
                            │ readerStore.setFontSize(size)
                            ▼
┌────────────────────────────────────────────────────────┐
│                      readerStore                       │
│    - fontSize: ref<number>(18)                         │
│    - setFontSize(size: number)                         │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌───────────────────────────┐   ┌────────────────────────┐
│    EpubDocumentAdapter    │   │    useBookPageTurn     │
│ - _fontSize = size        │   │ - watch(fontSize)      │
│ - Limpa _pageCanvases     │   │ - rasterCache.clear()  │
│ - Recalcula _pageMap      │   │ - renderCurrentView()  │
│ - Retorna newPage         │   └────────────────────────┘
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│        useSettings        │
│ - epubFontSize: ref(18)   │
│ - localStorage & API sync │
└───────────────────────────┘
```

---

## 2. Contratos e Interfaces

### `IBookDocument`
```typescript
export interface IBookDocument {
  readonly type: 'pdf' | 'epub'
  readonly metadata: BookMetadata
  readonly totalPages: number
  readonly isLoaded: boolean
  readonly fontSize?: number
  setFontSize?(fontSize: number, currentPage?: number): number
  load(source: File | ArrayBuffer, fileName?: string): Promise<void>
  getPage(pageNumber: number, targetWidth?: number, targetHeight?: number): Promise<PageData>
  getTextContent?(pageNumber: number): Promise<string>
  renderTextLayer?(pageNumber: number, container: HTMLElement, targetWidth?: number, targetHeight?: number): Promise<void>
  destroy(): void
}
```

---

## 3. Algoritmo de Preservação de Posição de Leitura

Quando `setFontSize(newSize, currentPage)` é executado:
1. Obter o mapeamento antigo `oldMapping = this._pageMap[currentPage - 1]`.
2. Extrair `targetSection = oldMapping.sectionIndex` e a fração de progresso na seção:
   `fraction = oldMapping.totalPagesInSection > 0 ? (oldMapping.pageIndexInSection / oldMapping.totalPagesInSection) : 0`.
3. Limpar `this._pageCanvases.clear()`.
4. Atualizar `this._fontSize = Math.max(12, Math.min(36, newSize))`.
5. Recomputar `_pageMap` com `calculateSectionPages(doc, this._fontSize)` para todas as seções.
6. Encontrar todas as entradas de página na nova `_pageMap` para `targetSection`.
7. Selecionar o novo índice `targetPageIndex = Math.min(newSectionPages - 1, Math.floor(fraction * newSectionPages))`.
8. Obter a `globalPage` correspondente e retornar para a store.

---

## 4. Persistência de Configurações

- **Local**: `localStorage.getItem('aresta_settings')` com a chave `epubFontSize`.
- **Global / Backend**: `/api/user-settings` com campo `epubFontSize`.
