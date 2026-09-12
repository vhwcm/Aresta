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

- **Normalização e Extração de Texto**: Utiliza `TreeWalker` sobre nós de texto ignorando scripts/estilos e inserindo espaçadores virtuais entre blocos para garantir correspondência contínua entre múltiplos parágrafos, quebras de linha e nós divididos (como spans gerados pelo PDF.js ou marcações semânticas do EPUB).
- **Estilização com Cor Personalizada**: Cada anotação é envolvida em `<mark class="reader-highlight">` recebendo a cor selecionada pelo usuário convertida para canal RGBA suave (`rgba(r, g, b, 0.38)`), com borda inferior sólida de `2px solid {color}` e `box-decoration-break: clone` para quebras de linha estéticas.
- **Persistência de Cores Resiliente**: A paleta de cores (`#F59E0B` Amarelo Ouro, `#E57B55` Coral Aresta, `#10B981` Verde Menta, `#3B82F6` Azul Celeste, `#8B5CF6` Roxo Lavanda, `#EC4899` Rosa Carmim) é persistida de forma híbrida: (1) no IndexedDB local com sincronização retroativa, (2) embutida de forma compatível no identificador de localização `cfi` (`#color={hex}`), e (3) preservada durante o ciclo de normalização de requisições à API, garantindo que recarregamentos ou reinícios da aplicação mantenham sempre a cor exata escolhida pelo leitor.
- **Sincronização Reativa**: O `PageCurlCanvas` observa o array reativo `annotations` do `useAnnotations()` e reaplica imediatamente os destaques na página ativa quando novas notas são salvas, editadas ou excluídas, além de restaurar os nós com `clearPageHighlights` e `normalize()`.
- **Interatividade & Foco**: O clique em um destaque na página emite `select-annotation`, abrindo a gaveta de notas do livro e focando suavemente no card correspondente com animação de realce.

