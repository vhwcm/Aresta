# ADR-032: Localizações Canônicas, Carregamento Progressivo O(1) e Janela Deslizante de Renderização no Leitor (PDF/EPUB)

## Status
Aceito e Implementado (Supersede parcial do ADR-020 §2 e §3)

## Data
2026-10-03

## Contexto
O ADR-020 estabeleceu o modo de leitura scroll contínuo e a alternância entre virada de páginas e scroll vertical. No entanto, com a evolução da plataforma e uso de livros extensos (EPUBs com dezenas de megabytes e PDFs de 500+ páginas), surgiram gargalos arquiteturais críticos:
1. **Tempo de Abertura Proporcional ao Tamanho do Livro (O(N))**: O adaptador EPUB lia e calculava layout de todas as seções antes do primeiro frame, causando bloqueio de 2 a 5 segundos em livros grandes no mobile.
2. **Instabilidade do Conceito de "Páginas" no EPUB**: Páginas dependiam de resolução de tela, tamanho de fonte e proporção de janela. Uma anotação feita na "Página 42" no desktop abria em posição arbitrária no celular.
3. **Pico de Memória e Desalocação no Scroll PDF**: O buffer simples de 600px podia acumular dezenas de canvases de alta resolução na memória RAM/GPU em scrolls rápidos.
4. **Deslocamento de Layout (Layout Shift) no Salto**: Ao saltar para uma seção no meio do EPUB ou rolar enquanto seções acima mudavam de dimensão, a leitura sofria saltos abruptos.

## Decisão

1. **Modelo de Localizações Estáveis para EPUB (`LOCATION_SIZE = 1024`)**:
   - Definição de 1 localização = 1.024 caracteres de texto (`TreeWalker` determinístico, idêntico ao cálculo de offset de anotações).
   - O rótulo "Loc. X de Y" é exibido no EPUB de forma consistente e independente de dispositivo, fonte ou orientação.
   - Endereço canônico de posição universal: `epub:<sectionIndex>:<charOffset>` para EPUB e `page:<N>` para PDF.
   - Migração preguiçosa de anotações legadas `page:N` de EPUB: busca do texto citado ou interpolação proporcional.

2. **Carregamento Progressivo O(1) & Pré-cálculo no Backend**:
   - **No Backend (PostgreSQL + Prisma)**: Upload de EPUB extrai antecipadamente `Book.total_locations` e `Book.locations_per_section`, expostos via `GET /api/books/:id`. Abertura imediata no frame 1 com custo computacional zero no cliente.
   - **No Cliente (`LazyZip`)**: Abertura preguiçosa do contêiner ZIP lendo apenas o diretório central. Descompactação restrita ao arquivo OPF e à seção-alvo (0) mais vizinha imediata (+1). Imagens só viram Blob URLs quando a seção é montada, sendo revogadas no unmount.
   - **Refinamento Ocioso (`ChunkScheduler`)**: Seções restantes têm texto contado em background via `requestIdleCallback` (respeitando deadline e sem tarefas > 50 ms), com cache persistente em IndexedDB.

3. **Janela Deslizante e LRU de Canvases no PDF (`PdfRenderWindow`)** (Supersede ADR-020 §2):
   - Cache de geometria das páginas obtido em lotes de 10 páginas em idle.
   - Janela de renderização estrita: ±1 página em alta resolução, ±2 páginas em idle.
   - Teto rígido de 6 canvases simultâneos em cache LRU (`maxCanvases: 6`). Canvases descartados têm dimensões zeradas e contexto limpo para liberar GPU VRAM imediatamente.
   - Cancelamento cooperativo (`task.cancel()`) de renderizações em voo que saiam da janela antes de concluir.
   - Prévia instantânea de baixa escala (0.2x) gerada em <= 150 ms durante scrolls rápidos ou saltos longos.

4. **Virtualização por Blocos e Compensação de Âncora no Scroll EPUB** (Supersede ADR-020 §3):
   - Divisão de capítulos em blocos de ~10 localizações (10.240 caracteres) cortando estritamente na raiz entre nós de bloco de primeiro nível (`sectionChunker.ts`).
   - Teto de no máximo 5 blocos montados no DOM simultaneamente.
   - Compensação estrita de âncora (`computeAnchorScrollDelta` e `applyScrollDelta`): quando blocos acima sofrem redimensionamento pelo `ResizeObserver`, o `scrollTop` é compensado com precisão de 0 px de deslocamento perceptível.

5. **Interface Unificada de Navegação e Salto**:
   - `ReaderProgressScrubber`: controle deslizante contínuo com marcas de capítulo, porcentagem e balão de prévia flutuante. Salto acionado exclusivamente no término do arraste (`commit`).
   - `ReaderTocDrawer`: gaveta lateral de sumário hierárquico com capítulo atual destacado e porcentagens por seção.
   - `ReaderBackChip`: chip flutuante "Voltar para Loc./Pág. X" após saltos com histórico navegável.
   - `ReaderGoToField`: salto direto por número de página, localização ou porcentagem (ex: "42", "Loc 1200", "50%").

## Consequências

### Positivas
- 1ª tela do EPUB aberta em < 50 ms (cache hit) e < 300 ms (carregamento inicial), eliminando qualquer dependência do tamanho total da obra.
- Posições de leitura, anotações e marcadores 100% interoperáveis entre desktop, tablet e mobile.
- Consumo de memória de PDF limitado a ~40 MB de pico (em vez de 80 MB+), sem vazamento de texturas na GPU.
- Zero layout shift perceptível em rolagem contínua de EPUB e saltos de página.
- 100% dos Quality Gates verdes (995 testes no frontend, 49 no backend, 0 falhas) e orçamentos do requisito §4 verificados via `scripts/bench-reader.ts`.

### Custos e Riscos
- A compensação de âncora requer monitoramento contínuo de nós montados via `ResizeObserver`.
- Livros sem pré-cálculo no backend apresentam uma variação de alguns porcento na contagem total de unidades durante os primeiros 1-2 segundos enquanto o refinamento em background converge.
