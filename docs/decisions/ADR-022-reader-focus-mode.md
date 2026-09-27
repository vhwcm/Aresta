# ADR-022: Modo de Foco na Leitura (PDF & EPUB) com Bloco Focal Configurável e Bloqueio de Distrações

## Status
Aceito

## Data
2026-09-19

## Contexto
A experiência de leitura no Aresta atende a diferentes estilos cognitivos e graus de imersão. Para leitores que buscam maximizar foco, retenção e ritmo de leitura linear, foi solicitada a criação de um **Modo de Foco (Focus Mode)** para documentos PDF e EPUB.

Os requisitos centrais incluem:
1. Exibir com nitidez apenas um bloco de $X$ linhas por vez (onde $X$ é configurável pelo usuário, por padrão 3 linhas).
2. Todo o restante da página/conteúdo deve permanecer fortemente desfocado (*heavy blur* / *frosted glass*).
3. Avanço contínuo do bloco focal a cada clique no livro ou tecla de atalho (`Espaço`, `Setas`, `J/K`).
4. Tratamento de *edge cases*: se restarem menos de $X$ linhas no final da página, exibir todas as restantes e, no próximo clique, avançar para a próxima página e reiniciar no topo.
5. No modo de leitura vertical (Scroll), o foco deve descer pelas linhas e o scroll deve acompanhar suavemente a posição focalizada.
6. **Bloqueio total de anotações, flashcards, dicionário e IA** exclusivamente no frontend enquanto o modo de foco estiver ativo, para garantir imersão absoluta sem distrações.

## Decisão

### 1. Algoritmo Universal de Agrupamento de Linhas (`useReaderFocus.ts`)
Para operar de forma homogênea tanto no PDF (camada `.textLayer` do PDF.js com `<span>` posicionados) quanto no EPUB (marcação HTML contínua renderizada no Foliate.js):
- Inspeciona os nós de texto do contêiner e utiliza `document.createRange()` / `getClientRects()`.
- O método `extractLinesFromRects()` utiliza ordenação topológica com *strict weak ordering* e agrupa caracteres/palavras apenas quando há sobreposição vertical real positiva ($\ge 35\%$ da menor altura), evitando fusões errôneas de linhas inclinadas ou deslocadas.
- O método `calculateFocusWindow(lines, startIndex, lineCount, containerHeight)` inspeciona o espaçamento entre linhas adjacentes (`gap = curr.top - prev.bottom`). Caso haja uma linha vazia, quebra de cena (`<br>`, margem de parágrafo) onde `gap > maxNormalGap` ($\max(26\text{px}, \text{avgHeight} \times 1.35)$), o bloco é encerrado imediatamente antes da lacuna. Isso impede que a fenda focal engula espaços vazios ou corte linhas ao meio, retomando o próximo parágrafo no avanço seguinte.
- Invalidação dinâmica do cache (`containerLinesCache`): o cache baseado em `WeakMap<HTMLElement>` valida um snippet do conteúdo de texto (`contentSnippet`) e expõe `invalidateContainerLinesCache()`, garantindo que viradas de folha no `PageCurlCanvas` ou carregamento de seções no `ReaderScrollEngine` nunca reutilizem coordenadas defasadas de páginas anteriores.
- Sinaliza `isLastBlock: true` quando as linhas restantes na página/seção são $\le X$.

```
┌────────────────────────────────────────────────────────┐
│  Painel Superior com Desfoque (backdrop-filter: 12px)  │
├────────────────────────────────────────────────────────┤
│  Janela Focal Nítida (X Linhas Ativas)                 │
├────────────────────────────────────────────────────────┤
│  Painel Inferior com Desfoque (backdrop-filter: 12px)  │
└────────────────────────────────────────────────────────┘
```

### 2. Componente de Máscara (`ReaderFocusOverlay.vue`)
- Utiliza dois painéis com `backdrop-filter: blur(12px) saturate(85%)` com transições CSS suaves (`0.22s cubic-bezier(0.16, 1, 0.3, 1)`).
- Captura os eventos de clique na página para chamar `nextBlock()`, impedindo seleções de texto nativas ou cliques acidentais.

### 3. Integração com Modo 2 Páginas e Modo Scroll
- **Modo 2 Páginas (`PageCurlCanvas.vue`)**: O fluxo avança sequencialmente da folha esquerda para a folha direita e, ao término da direita, aciona a virada 3D da página e retorna à esquerda no topo.
- **Modo Scroll (`ReaderScrollEngine.vue`)**: Quando o bloco se desloca para a porção inferior da tela, o contêiner efetua scroll suave (`scrollBy`) mantendo a abertura focal no campo ergonômico ideal de visualização.

### 4. Bloqueio Frontend de IA e Ferramentas
- Enquanto `store.isFocusMode` for verdadeiro:
  - `handleTextSelectionCheck` limpa a seleção e impede abertura de `ReaderSelectionTooltip`, `ReaderDictionaryCard` e `ReaderAiOverlayCard`.
  - Botão de anotação na `ReaderBottomBar` fica desativado.
  - Eventos de clique em anotações existentes no texto são ignorados.

## Consequências

### Positivas
- Experiência de leitura focada e acessível em qualquer tipo de livro (PDF ou EPUB).
- Zero acoplamento com o backend: toda a lógica de medição e bloqueio opera localmente em alta performance (60fps nas animações CSS).
- Compatibilidade total com temas sépia, branco e escuro.

### Negativas / Mitigações
- PDFs escaneados sem OCR não possuem nós de texto nativos no `.textLayer`: mitigado com fallback automático de linhas proporcionais à altura do contêiner.
