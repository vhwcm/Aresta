# Arquitetura do Leitor & Gerenciamento de Memória

Esta documentação detalha o funcionamento interno do leitor digital do **Aresta**, explicando como arquivos nos formatos **PDF** e **EPUB** são carregados, processados e gerenciados em memória RAM e GPU durante a leitura.

---

## 1. Resumo Executivo: O livro é carregado todo na memória?

* **Arquivo bruto (Binário/Buffer)**: **Sim**. O arquivo do livro (PDF ou EPUB) é baixado por completo e mantido em memória como um `ArrayBuffer` no cliente para viabilizar navegação instantânea, consultas de metadados e suporte a leitura fluida.
* **Renderização visual (Imagens/Texturas 3D)**: **Não**. As páginas **não** são todas rasterizadas ou desenhadas na memória de uma vez. O leitor utiliza uma técnica de **Lazy Loading com Janela Deslizante de Cache**, mantendo em memória visual apenas as páginas atualmente visíveis e suas vizinhas imediatas (máximo de 8 páginas).

---

## 2. Ciclo de Vida do Carregamento

```mermaid
flowchart TD
    A[Usuário abre livro na interface] --> B[ReaderShell.vue faz fetch do binário]
    B --> C[ArrayBuffer criado na RAM do cliente]
    C --> D{Tipo de Documento?}
    
    D -->|PDF| E[PdfDocumentAdapter + pdfjs-dist]
    D -->|EPUB| F[EpubDocumentAdapter + fflate / foliate-js]
    
    E --> G[Documento instanciado no ReaderStore]
    F --> G
    
    G --> H[Engine 3D / useBookPageTurn]
    H --> I[Rasterização sob demanda: MAX 8 páginas em cache]
    I --> J[Texturas Three.js na GPU]
    I --> K[Páginas distantes descartadas via disposeRaster]
```

---

## 3. Detalhamento por Camada

### 3.1. Camada de Transporte e Buffer (`ReaderShell.vue`)
Ao iniciar a leitura (`front/app/components/reader/ReaderShell.vue`), o cliente faz uma requisição HTTP para o endpoint de mídia (`/api/books/:id/file`) e obtém o conteúdo bruto em um `ArrayBuffer`:

```typescript
const res = await fetch(fileUrl)
const arrayBuffer = await res.arrayBuffer()
const doc = createBookDocument(type)
await doc.load(arrayBuffer, title)
store.setDocument(doc, title, bookId)
```

### 3.2. Adaptadores de Documento (`IBookDocument`)

#### A. PDF (`PdfDocumentAdapter.ts`)
* Utiliza a biblioteca `pdfjs-dist` com Web Worker dedicado (`pdf.worker.min.mjs`).
* O PDF.js analisa a árvore de objetos e fontes do documento sem decodificar todas as páginas para bitmap simultaneamente.
* A decodificação de cada página (`pdfPage.render()`) só é disparada sob demanda quando a página entra no raio de visualização do leitor.

#### B. EPUB (`EpubDocumentAdapter.ts`)
* Utiliza a biblioteca `fflate` (`unzipSync`) para descompactar o contêiner ZIP do EPUB na memória do navegador.
* O parser do `foliate-js` mapeia os capítulos e seções lineares (`spine`).
* As seções XHTML são convertidas em canvas/SVG e texturas apenas quando o usuário navega até elas.

---

## 4. Motor de Renderização & Gestão de GPU (`useBookPageTurn.ts`)

A visualização e o efeito de folheamento tridimensional (Page Curl) são executados via **Three.js** e WebGL (com fallback para Canvas 2D). Para garantir consumo estável de memória mesmo em livros com milhares de páginas:

### 4.1. Janela Deslizante de Cache
O leitor define um limite estrito de páginas mantidas na memória gráfica (`MAX_CACHED_PAGES = 8`):

```typescript
const MAX_CACHED_PAGES = 8
const rasterCache = new Map<number, PageRaster>()

function retainRasters() {
    const retainedPages = new Set([
        renderedPage,
        renderedPage + 1,
        store.currentPage - 2,
        store.currentPage - 1,
        store.currentPage,
        store.currentPage + 1,
        store.currentPage + 2,
        store.currentPage + 3,
    ])

    for (const [pageNumber, raster] of rasterCache) {
        if (rasterCache.size <= MAX_CACHED_PAGES || retainedPages.has(pageNumber)) continue
        rasterCache.delete(pageNumber)
        disposeRaster(raster)
    }
}
```

### 4.2. Descarte de Texturas e Liberação de Recursos
Quando uma página sai da janela de leitura ativa, a função `disposeRaster()` limpa os recursos alocados:
* `texture.dispose()` e `backTexture.dispose()` desalocam as texturas da GPU.
* O tamanho do `<canvas>` auxiliar é reduzido para 1x1 pixel (`canvas.width = 1; canvas.height = 1`) para que o Garbage Collector do JavaScript libere a memória imediatamente.

### 4.3. Camada de Texto Invisível (`TextLayer`)
Para permitir seleção de texto com o mouse, anotações e acessibilidade sem onerar a GPU, uma camada HTML invisível com texto posicionado geometricamente sobre o Canvas é montada apenas para a página ativa.

---

## 5. Matriz de Consumo de Recursos

| Componente | Armazenamento | Ciclo de Vida | Impacto de Memória |
| :--- | :--- | :--- | :--- |
| **Binário do Arquivo** | RAM (JavaScript Heap) | Durante toda a sessão de leitura do livro | Proporcional ao arquivo (ex: ~2MB a 30MB) |
| **Estrutura/DOM do Livro** | RAM (Heap) | Durante a sessão | Baixo (~1MB a 5MB) |
| **Texturas WebGL (Three.js)** | VRAM (GPU) | Máx. 8 páginas simultâneas | Constante (~15MB a 40MB na GPU) |
| **Páginas Não Visualizadas** | N/A (Descarregadas) | Não alocadas até serem acessadas | 0 MB adicionais |
