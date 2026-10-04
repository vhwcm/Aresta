# Arquitetura do Subsistema de Leitor (Reader Architecture)

O subsistema de leitura do **Aresta** é projetado para oferecer uma experiência de leitura fluida, responsiva e de alta fidelidade para formatos digitais (EPUB e PDF), integrando renderização 2D nativa, anotações interativas e simulação física 3D de virada de páginas (Kindle/Apple Books grade).

---

## 1. Padrão Adapter para Leitor de Documentos (Reader Adapter)

O sistema desacopla as bibliotecas de baixo nível (`foliate-js` para EPUBs e `pdfjs-dist` para PDFs) por meio de uma interface unificada `IBookDocument`, instanciada via `BookDocumentFactory`:

```text
================================================================================
FLUXO DE ADAPTAÇÃO E RENDERIZAÇÃO DO LEITOR (READER ADAPTER FLOW)
================================================================================

                    ┌──────────────────────────────────────┐
                    │       Página do Leitor (Vue 3)       │
                    │      `apps/web/pages/reader/[id]`    │
                    └──────────────────┬───────────────────┘
                                       │
                                       │ 1. BookDocumentFactory.loadDocument(url, format)
                                       ▼
                    ┌──────────────────────────────────────┐
                    │         BookDocumentFactory          │
                    └──────────────────┬───────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │ format === 'epub'                           │ format === 'pdf'
                ▼                                             ▼
     ┌──────────────────────┐                      ┌──────────────────────┐
     │ EpubDocumentAdapter  │                      │  PdfDocumentAdapter  │
     │     (foliate-js)     │                      │     (pdfjs-dist)     │
     └──────────┬───────────┘                      └──────────┬───────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │ 2. Retorna instância unificada
                                       ▼
                    ┌──────────────────────────────────────┐
                    │      Interface `IBookDocument`       │
                    │   - totalPages, title, getPage()     │
                    │   - fontSize, setFontSize()          │
                    │   - getTextContent(), renderText()   │
                    └──────────────────┬───────────────────┘
                                       │
                                       │ 3. getPage(pageNumber)
                                       ▼
                    ┌──────────────────────────────────────┐
                    │     Canvas Engine & Text Layer       │
                    │  - Desenha imagem no <canvas>        │
                    │  - Sobrepõe texto DOM selecionável   │
                    │  - Cache local de páginas em memória │
                    └──────────────────────────────────────┘
================================================================================
```

---

## 2. Motor 3D de Virada de Página Realista (Three.js / WebGL)

O leitor adota uma engine híbrida de alto desempenho:
- **Estado Estacionário (2D Nativo)**: Em repouso, exibe o Canvas 2D e TextLayer DOM nítidos com suporte a seleção de texto nativa, menu de dicionário, grifos e notas contextuais sem sobrecarga de GPU.
- **Transição e Pré-cache 3D**: Ao iniciar um gesto de arraste ou toque (`pointerdown`), as texturas das páginas (frente, verso e próxima) são enviadas à GPU (`THREE.Texture`), ativando o canvas WebGL sobreposto.
- **Deformação Física Contínua**: O shader de vértice (`usePageCurl3D.ts`) deforma a malha contínua 64x64 com base no vetor de tração e física de mola (`usePagePhysics.ts`), aplicando sombras de contato e luz especular fosca.
- **Restauração 2D**: Ao soltar (`pointerup`), o novo spread 2D é renderizado e o WebGL é pausado com zero jitter.

```text
================================================================================
                    FLUXO DO MOTOR 3D DE VIRADA DE PÁGINA (KINDLE GRADE)
================================================================================

+------------------------------------------------------------------------------+
|                             ESTADO ESTACIONÁRIO                              |
|                          (Modo Leitura Nativo 2D)                            |
+------------------------------------------------------------------------------+
|  [ Página Esquerda 2D ]                 [ Página Direita 2D ]                |
|  - Canvas Nítido Base                   - Canvas Nítido Base                 |
|  - TextLayer DOM Nativo                 - TextLayer DOM Nativo               |
|  - Seleção de Texto Ativa               - Seleção de Texto Ativa             |
|  - Menu de Dicionário & Grifos          - Menu de Dicionário & Grifos        |
|  - Zero uso de GPU 3D                   - Zero uso de GPU 3D                 |
+------------------------------------------------------------------------------+
                                       |
                   EVENTO: pointerdown / drag / tap
                                       v
+------------------------------------------------------------------------------+
|                     PRÉ-CACHE & TRANSIÇÃO INSTANTÂNEA                        |
+------------------------------------------------------------------------------+
|  1. Captura Texturas Offscreen (Página Atual + Verso + Próxima)              |
|  2. Passa Texturas para THREE.Texture (WebGL / GPU VRAM)                     |
|  3. Oculta camada DOM da folha ativa e Exibe Canvas WebGL Sobreposto         |
+------------------------------------------------------------------------------+
                                       |
                                       v
+------------------------------------------------------------------------------+
|                       MOTOR 3D EM TEMPO REAL (60/120 FPS)                    |
+------------------------------------------------------------------------------+
|                                                                              |
|       (x0, y0)                                                               |
|        +-----\ (Ponto de Contato do Dedo/Mouse)                              |
|        |      \                                                              |
|        |       \====== Cresta da Dobra (Curvatura Cônica/Cilíndrica)         |
|        |        \                                                            |
|        |         \                                                           |
|        +----------+                                                          |
|                                                                              |
|   - usePagePhysics.ts: Vetor de tração, velocidade angular & Spring Physics  |
|   - usePageCurl3D.ts: Vertex Shader (Deforma malha 64x64 contínua)           |
|   - Fragment Shader: Sombras de Contato + Luz Especular Fosca + Translucidez |
+------------------------------------------------------------------------------+
                                       |
                   EVENTO: pointerup / finalização da animação
                                       v
+------------------------------------------------------------------------------+
|                         FINALIZAÇÃO E RESTAURAÇÃO 2D                         |
+------------------------------------------------------------------------------+
|  1. Atualiza página atual no Pinia Reader Store (Next / Prev)                |
|  2. Renderiza novo spread de base 2D nativo                                  |
|  3. Desativa Canvas WebGL e pausa RequestAnimationFrame                      |
|  4. Reativa seleção de texto nativa (Zero jitter / Sem piscar)               |
+------------------------------------------------------------------------------+
================================================================================
```

---

## 3. Pilha de Páginas Virtuais (Page Stack Edges) & Preferências

Para proporcionar a sensação física de volume e espessura do livro, bordas volumétricas de páginas (Page Stacks) são calculadas dinamicamente com base no progresso de leitura atual:

```text
========================================================================================
                          PAGE STACK EDGES & 3D BOOK FLOW
========================================================================================

  +----------------------------------------------------------------------------------+
  |                                   SETTINGS LAYER                                 |
  +----------------------------------------------------------------------------------+
         |
         |  pageAnimationEnabled: true / false
         |  pageCreaseEnabled: true / false
         v
  +----------------------------------------------------------------------------------+
  |                     FRONTEND: useSettings.ts / conta.vue                         |
  |  - Desabilita pageCreaseEnabled quando pageAnimationEnabled = false               |
  |  - Valida antes de persistir no servidor                                         |
  +----------------------------------------------------------------------------------+
         |
         | HTTP PUT /api/user/settings
         v
  +----------------------------------------------------------------------------------+
  |                     BACKEND: userSettings.schema.ts & service                    |
  |  - Zod Refine: Rejeita 400 se { pageAnimation: false, pageCrease: true }        |
  |  - Service Normalization: força pageCrease = false se pageAnimation = false     |
  +----------------------------------------------------------------------------------+

========================================================================================
                     BOOK CANVAS RUNTIME RENDERING (PageCurlCanvas)
========================================================================================

                  (Páginas Lidas)                            (Páginas Restantes)
                  LEFT PAGE STACK                             RIGHT PAGE STACK
                  width: 0..14px                              width: 14..0px
                  [CLIQUE: Prev]                             [CLIQUE: Next]
                        |                                          |
                        v                                          v
                 +--------------+  +--------------------+  +---------------+
                 |  ||||||||||  |  |                    |  |  ||||||||||   |
                 |  ||||||||||  |  |                    |  |  ||||||||||   |
                 |  ||||||||||  |  |    VINCO CENTRAL   |  |  ||||||||||   |
                 |  ||||||||||  |  |   (Lombada 32px)   |  |  ||||||||||   |
                 |  ||||||||||  |  |                    |  |  ||||||||||   |
                 |  PÁGINA ESQ  |  |                    |  |  PÁGINA DIR   |
                 +--------------+  +--------------------+  +---------------+
                        ^                                          ^
                        |                                          |
                 Progresso: 30%                             Restante: 70%
                 (Ex: 4px pilha)                            (Ex: 10px pilha)

========================================================================================
```

---

## 4. Sistema de Destaques e Anotações Visuais (Reader Highlights)

O leitor integra um mecanismo robusto e reativo de busca e marcação visual de anotações no DOM das páginas (`apps/web/app/utils/readerHighlight.ts`):

- **Seleção Contínua & Alças Nativas Touch (Android/Mobile)**:
  - O leitor preserva o `Range` nativo do DOM em `window.getSelection()` sem destruição prematura por `removeAllRanges()`. Isso mantém as alças nativas do sistema operacional (gotas/selection handles) ativas e totalmente interativas para expansão ou retração de múltiplas palavras e parágrafos.
  - A camada de texto (`.page-text-layer`) utiliza `touch-action: auto !important;` e `-webkit-touch-callout: default !important;`, liberando o motor touch do WebView para gerenciar o arraste das alças sem bloqueio.
  - O motor de virada de página (`PageCurlCanvas`) detecta `hasSelection` e `isTextTarget`, inibindo qualquer sequestro de ponteiro (`setPointerCapture`) ou início de animação 3D enquanto o usuário estiver interagindo com o texto ou ajustando alças de seleção.
  - O `ReaderSelectionTooltip` adota posicionamento ergonômico mobile (abaixo do trecho selecionado com proteção de margens) para nunca sobrepor o menu de contexto nativo do Android (Action Mode) nem cobrir o texto.
- **Normalização e Extração de Texto**: Utiliza `TreeWalker` sobre nós de texto ignorando scripts/estilos e inserindo espaçadores virtuais entre blocos para garantir correspondência contínua entre múltiplos parágrafos, quebras de linha e nós divididos (como spans gerados pelo PDF.js ou marcações semânticas do EPUB).
- **Estilização com Cor Personalizada**: Cada anotação é envolvida em `<mark class="reader-highlight">` recebendo a cor selecionada pelo usuário convertida para canal RGBA suave (`rgba(r, g, b, 0.38)`), com borda inferior sólida de `2px solid {color}` e `box-decoration-break: clone` para quebras de linha estéticas.
- **Persistência de Cores Resiliente**: A paleta de cores (`#F59E0B` Amarelo Ouro, `#E57B55` Coral Aresta, `#10B981` Verde Menta, `#3B82F6` Azul Celeste, `#8B5CF6` Roxo Lavanda, `#EC4899` Rosa Carmim) é persistida de forma híbrida: (1) no IndexedDB local com sincronização retroativa, (2) embutida de forma compatível no identificador de localização `cfi` (`#color={hex}`), e (3) preservada durante o ciclo de normalização de requisições à API, garantindo que recarregamentos ou reinícios da aplicação mantenham sempre a cor exata escolhida pelo leitor.
- **Sincronização Reativa**: O `PageCurlCanvas` observa o array reativo `annotations` do `useAnnotations()` e reaplica imediatamente os destaques na página ativa quando novas notas são salvas, editadas ou excluídas, além de restaurar os nós com `clearPageHighlights` e `normalize()`.
- **Interatividade & Foco**: O clique em um destaque na página emite `select-annotation`, abrindo a gaveta de notas do livro e focando suavemente no card correspondente com animação de realce.

---

## 5. Arquitetura Local-First e Offline do PDF.js (`pdfjs-dist`)

Para assegurar funcionamento **100% offline**, conformidade com empacotamento desktop/mobile (Tauri v2, Android APK, PWA) e eliminar qualquer dependência de redes externas (CDNs como `jsdelivr` ou `unpkg`), o Aresta gerencia os assets do PDF.js de forma estritamente local:

```text
================================================================================
ARQUITETURA DE ASSETS LOCAIS E WORKER DO PDF.JS (OFFLINE & TAURI READY)
================================================================================

 [pdfjs-dist (NPM)] ──(postinstall / copy-pdfjs-assets.mjs)──> [apps/web/public/pdfjs/]
                                                                      ├─ pdf.worker.min.mjs
                                                                      ├─ cmaps/ (*.bcmap)
                                                                      └─ standard_fonts/

 [PdfDocumentAdapter / PdfCoverExtractor]
                    │
                    ▼
         [apps/web/app/utils/pdfjsSetup.ts]
                    │
   ┌────────────────┴────────────────────────┐
   │ 1. GlobalWorkerOptions.workerSrc        │ 2. getPdfDocumentParams()
   │    = Vite Bundled URL (`?url`)          │    = cMapUrl: '/pdfjs/cmaps/'
   │    || '/pdfjs/pdf.worker.min.mjs'       │    = standardFontDataUrl: '/pdfjs/standard_fonts/'
   └─────────────────────────────────────────┘
================================================================================
```

### Regras Inegociáveis do PDF.js:
1. **Zero CDNs**: Nunca utilizar URLs externas como `https://cdn.jsdelivr.net/...` ou `https://unpkg.com/...` para `workerSrc`, `cMapUrl` ou `standardFontDataUrl`.
2. **Centralização em `pdfjsSetup.ts`**: Toda inicialização do PDF.js deve passar obrigatoriamente por `setupPdfJs()` e `getPdfDocumentParams()`.
3. **Cópia de Assets no Build**: O script `scripts/copy-pdfjs-assets.mjs` é executado no `postinstall` garantindo que os binários do worker e fontes estejam sempre sincronizados em `public/pdfjs/`.

---

## 6. Modos de Largura e Enquadramento de Leitura (`readerWidthMode`)

O leitor oferece alternância de largura para documentos EPUB via `store.readerWidthMode` ('centered' | 'wide'):

- **Modo Centralizado (`centered`)**:
  - **Paginado (2 Páginas)**: Aplica a proporção clássica de livro (`aspectRatio ~ 0.72`) baseada na altura da janela (`maxPageHeight * aspectRatio`), mantendo margens ergonômicas simétricas nas laterais da tela para uma leitura confortável em monitores largos.
  - **Paginado (1 Página)**: Enquadra a folha única centralizada com largura clássica de livro (limitada a 55% da tela ou proporção áurea) sem distorcer o espaçamento textual.
  - **Modo Scroll Contínuo**: Restringe o bloco de leitura a `max-width: 860px`.
- **Modo 100% Largo (`wide`)**:
  - **Paginado**: Expande as páginas para ocupar 100% da área útil disponível (`hostWidth - 32px`), maximizando o espaço de leitura em notebooks e monitores compactos.
  - **Modo Scroll Contínuo**: Expande o bloco de leitura para `max-width: 1180px` (96%).

---

## 7. Barra de Leitura Dual: Lateral no Desktop e Inferior no Mobile (`Viewer.vue` & `ReaderBottomBar.vue`)

A barra de controle do leitor adapta sua orientação ergonomicamente ao tipo de dispositivo e orientação de tela:

- **Desktop e Telas Horizontais (`isHorizontalScreen`)**: A barra é posicionada na **lateral esquerda** (`aside.reader-lateral-bar`). O topo da barra exibe a capa do livro com proporção natural, e a base contém o grid de 6 botões (Voltar, A-, A+, Modo Zen, Anotações e Configurações). O popover de configurações abre flutuante ao lado da barra lateral. A área central do livro ganha 100% da altura da tela sem footer roubando espaço vertical.
- **Mobile e Telas Verticais (`!isHorizontalScreen`)**: A barra é posicionada na **base inferior** (`footer.reader-unified-bottom-bar`) com a capa pequena alinhada à esquerda e os 6 botões dispostos confortavelmente para o polegar.
- **Modo Zen (`store.isZenMode`)**: Ambas as barras (lateral no desktop e inferior no mobile) são ocultadas com transição suave, permitindo imersão total e tela cheia.

```text
========================================================================================
                          LAYOUT DESKTOP / MODO HORIZONTAL
========================================================================================
┌───────────────────────────────────────────────────────────────────┬──────────────────┐
│  BARRA LATERAL ESQUERDA    ÁREA CENTRAL DO LIVRO (Book Stage)     │ PAINEL DE NOTAS  │
│  ┌──────────────┐          ┌─────────────────┬──────────────────┐ │ (Drawer Lateral  │
│  │ Capa Livro   │          │ Página Esquerda │  Página Direita  │ │  não sobreposto) │
│  └──────────────┘          │ (2D / WebGL 3D) │  (2D / WebGL 3D) │ │ - Criar reflexão │
│  ┌──────┬──────┐           └─────────────────┴──────────────────┘ │ - Feed de notas  │
│  │Voltar│  A-  │                                                  │ - Marcadores     │
│  ├──────┼──────┤           - Altura 100% livre sem footer         │ (w: 420-500px)   │
│  │  A+  │ Zen  │                                                  │                  │
│  ├──────┼──────┤                                                  │                  │
│  │Notas │Config│ -> [Popover Lateral]                             │                  │
│  └──────┴──────┘                                                  │                  │
└───────────────────────────────────────────────────────────────────┴──────────────────┘

========================================================================================
                          LAYOUT MOBILE / MODO VERTICAL
========================================================================================
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                           ÁREA DO LIVRO (Folha Única)                                │
│                     - Renderização 2D nítida com seleção ativa                       │
│                     - Gestos touch com transição WebGL 3D                            │
│                     - Tooltips de Seleção e Dicionário Offline                       │
│                                                                                      │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  BARRA INFERIOR UNIFICADA (Compacta)                                                 │
│  ┌───────────┐  [Voltar] [A-] [A+]                                                   │
│  │ Capa Livro│  [Zen] [Notas -> Modal Full] [Configurações]                          │
│  └───────────┘                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Sistema de Localizações Estáveis, Carregamento O(1) e Navegação Canônica (ADR-032)

O leitor implementa o padrão industrial de localizações estáveis independentes de dispositivo (estilo Google Play Livros / Kindle) e carregamento O(1) em relação ao volume do livro:

```text
========================================================================================
           ARQUITETURA DE LOCALIZAÇÕES, AGENDAMENTO E SCROLL VIRTUALIZADO
========================================================================================

 [ Arquivo EPUB / PDF ]
           │
           ├─► Backend (Upload): Extração de `total_locations` e `locations_per_section`
           │                     no Postgres via Prisma.
           │
           ▼
 [ Cliente Aresta: Leitura ]
           │
           ├─► Metadados Imediatos: GET /api/books/:id traz Locations pré-calculadas.
           │                        Custo zero de inicialização no frame 1.
           │
           ├─► LazyZip: Lê apenas o diretório central do ZIP. Descompacta somente OPF
           │            e a seção-alvo (0) + vizinha (+1) para a 1ª tela (< 300ms).
           │
           ├─► ChunkScheduler (Idle Worker): Processa contagem das seções restantes em
           │                                 fatias ociosas (requestIdleCallback) sem
           │                                 tarefas > 50ms. Persiste no IndexedDB.
           │
           ├─► PdfRenderWindow: Janela deslizante de páginas PDF (±1 alta res, ±2 idle)
           │                    com LRU de 6 canvases e cancelamento de tarefas em voo.
           │
           ├─► Virtualização de Scroll por Blocos: Seções cortadas a cada ~10.240 caracteres
           │                                       (sectionChunker.ts). Limite <= 5 blocos no DOM.
           │                                       Compensação de âncora com 0 px de layout shift.
           │
           └─► UI de Navegação:
                 - ReaderProgressScrubber: marcas de capítulo + balão de prévia flutuante.
                 - ReaderTocDrawer: gaveta de sumário hierárquico com porcentagens.
                 - ReaderBackChip: botão voltar dinâmico após saltos de leitura.
                 - ReaderGoToField: salto por página, localização ("Loc 1200") ou percentual ("50%").
========================================================================================
```

### 8.1. Endereço Canônico de Leitura (`readingPosition.ts`)
- **EPUB**: `epub:<sectionIndex>:<charOffset>` (ex: `epub:4:1024`).
- **PDF**: `page:<N>` (ex: `page:42`).
- As anotações e marcadores utilizam a posição canônica para sincronização multidispositivo. Anotações legadas `page:N` de EPUB são migradas preguiçosamente com base no texto citado.

### 8.2. Interface `INavigableDocument`
Implementada por `EpubDocumentAdapter` e `PdfDocumentAdapter`:
- `getToc(): Promise<TocEntry[]>`
- `getTotalUnits(): number` (localizações no EPUB, páginas no PDF)
- `positionToUnit(pos: ReadingPosition): number`
- `unitToPosition(unit: number): ReadingPosition`
- `onIndexRefined(callback: () => void): () => void`




