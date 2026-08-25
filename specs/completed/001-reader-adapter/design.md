# Design Técnico: Reader Adapter Pattern

## 1. Visão Geral da Arquitetura

O sistema de leitura adota o padrão de projeto **Adapter** para isolar as peculiaridades dos motores de renderização de baixo nível (`foliate-js` e `pdfjs-dist`) atrás de uma interface comum:

```
                  ┌──────────────────────┐
                  │    Reader UI (Vue)   │
                  └──────────┬───────────┘
                             │ consome
                             ▼
                  ┌──────────────────────┐
                  │    IBookDocument     │
                  └──────────┬───────────┘
                             │ implementa
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌──────────────────────┐      ┌──────────────────────┐
   │ EpubDocumentAdapter  │      │  PdfDocumentAdapter  │
   │    (foliate-js)      │      │    (pdfjs-dist)      │
   └──────────────────────┘      └──────────────────────┘
```

## 2. Diagrama de Fluxo
Consulte o arquivo: `diagrams/reader-flow.txt`

## 3. Interfaces e Contratos

### `IBookDocument`
```typescript
export interface IBookDocument {
  readonly totalPages: number
  readonly title: string
  readonly author: string
  readonly coverUrl?: string
  
  getPage(pageNumber: number): Promise<IPageData>
  getTextContent(pageNumber: number): Promise<string>
  renderTextLayer(pageNumber: number, container: HTMLElement, targetWidth?: number, targetHeight?: number): Promise<void>
  destroy(): void
}
```

### `BookDocumentFactory`
- `static async loadDocument(urlOrBuffer: string | ArrayBuffer, format: 'epub' | 'pdf'): Promise<IBookDocument>`

## 4. Gerenciamento de Memória
- Cache LRU / Map de páginas renderizadas.
- Liberação explícita de URLs Blob e instâncias de workers no método `destroy()`.
