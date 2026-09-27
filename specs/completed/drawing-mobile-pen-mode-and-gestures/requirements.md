# Requisitos: Modo Caneta e Gestos de Navegação/Zoom Mobile no Desenho

## 1. Objetivo Geral
Permitir que usuários em dispositivos móveis e tablets alternem entre o **Modo Caneta (Stylus Mode)** e o **Modo Toque Livre (Touch Drawing Mode)** no editor de desenhos (`/canvas/drawing/:id`). No Modo Caneta, apenas a caneta/stylus realiza traços ou apaga, enquanto o toque de 1 dedo navega e faz pan livremente pela página. No Modo Toque, o dedo desenha normalmente e o deslocamento/navegação pela página ocorre com 2 dedos, com pinch-to-zoom fluido centrado no ponto focal (midpoint) e pan bidirecional sem travamento no centro da tela.

## 2. Escopo
- **Incluído**:
  - Novo estado reativo `isPenOnlyMode` / `penMode` gerenciado em `useDrawing.ts` e persistido em `localStorage`.
  - Botão alternador do Modo Caneta no `DrawingToolbar.vue` e indicador de estado no cabeçalho de `[id].vue`.
  - Tratamento diferenciado em `DrawingPageCanvas.vue`: quando `penMode === true`, eventos `pointerType === 'touch'` não iniciam traços e não capturam o ponteiro, permitindo que o toque de 1 dedo deslize e navegue pela folha.
  - Implementação de navegação e pan com 1 dedo no viewport quando o Modo Caneta estiver ativo.
  - Correção e refinamento do pan e pinch-to-zoom de 2 dedos:
    - Eliminar o travamento do zoom no centro da tela (focal-point pinch zoom acompanhando o midpoint dos toques).
    - Desativar temporariamente o CSS Scroll Snap (`snap-x snap-mandatory`) e animações de scroll (`scroll-smooth`) durante gestos de toque (`touchstart`/`touchmove`).
    - Expandir dinamicamente a largura do slide da página (`.page-slide`) no mobile para acompanhar a folha com zoom (`Math.max(windowWidth, scaledSheetWidth)`), permitindo navegar por toda a extensão horizontal e vertical da página.
  - Testes unitários para `DrawingToolbar`, `DrawingPageCanvas`, `useDrawing` e `drawingPage`.
- **Não Incluído**:
  - Modificações no leitor de livros (EPUB/PDF) ou no Grafo de Conhecimento (já estabilizados).
  - Alterações no schema Prisma ou banco de dados PostgreSQL (recurso puramente local-first e client-side).

## 3. Requisitos Funcionais

### RF01. Alternância do Modo Caneta (Pen-Only Mode)
- **Descrição**: O usuário pode ativar e desativar o "Modo Caneta" a qualquer momento através da barra de ferramentas (`DrawingToolbar.vue`) e do cabeçalho da página de desenho (`[id].vue`).
- **Atores**: Usuário em dispositivo móvel, tablet ou desktop com tela touch/caneta.
- **Regra de Validação**:
  - O estado inicial deve respeitar o valor previamente salvo no `localStorage` (padrão: `false` caso não definido).
  - A interface deve exibir feedback visual claro quando o modo estiver ativado (destaque com cor primária, badge de status ativo e tooltip explicativo).

### RF02. Comportamento com Modo Caneta Ativado (`penMode === true`)
- **Descrição**:
  - **Caneta/Stylus (`pointerType === 'pen'`)**: Escreve, desenha, destaca e apaga normalmente de acordo com a ferramenta ativa. O botão lateral da caneta (S-Pen) continua acionando a borracha.
  - **1 Dedo (`pointerType === 'touch'`, `touches.length === 1`)**: Não desenha nem apaga traços. O toque navega pela página, realizando pan horizontal e vertical suave e imediato (1:1 com o deslocamento do dedo).
  - **2 Dedos (`touches.length === 2`)**: Realiza pinch-to-zoom focal e pan simultâneo pela página.
  - **Mouse (`pointerType === 'mouse'`)**: Mantém compatibilidade plena para interações em desktop.

### RF03. Comportamento com Modo Caneta Desativado (`penMode === false`)
- **Descrição**:
  - **1 Dedo (`pointerType === 'touch'`, `touches.length === 1`)**: Desenha ou apaga traços na folha de acordo com a ferramenta selecionada (`pen`, `highlighter`, `eraser`, etc.).
  - **2 Dedos (`touches.length === 2`)**: Não cria traços (qualquer traço iniciado antes do segundo toque é abortado instantaneamente sem deixar pontos órfãos). Os 2 dedos navegam e realizam pan pela página, além de permitirem pinch-to-zoom com ponto focal.

### RF04. Desbloqueio e Fluidez do Pan e Zoom de 2 Dedos
- **Descrição**:
  - O pinch-to-zoom com 2 dedos deve calcular a ampliação em torno do ponto médio dos dedos (`midpoint`), ajustando as coordenadas de `scrollLeft` e `scrollTop` de modo que a área sob os dedos permaneça sob os mesmos (zoom focal).
  - Eliminar o comportamento anterior onde o zoom ficava travado estritamente no centro da tela.
  - Durante o gesto de pan/zoom, o CSS Scroll Snap (`snap-x snap-mandatory`) e o `scroll-smooth` devem ser suspensos (`snap-none scroll-auto`) para evitar conflito de posições e resistência no arraste.
  - A largura dos containers de página no mobile deve expandir quando o zoom ultrapassar a largura da viewport, permitindo rolar até as margens laterais extremas da folha.

### RF05. Reconciliação Pós-Gesto
- **Descrição**:
  - Ao soltar os dedos (`touchend`), se o nível de zoom estiver na escala normal ajustada à tela (`pageScale <= fitScale * 1.05`), o viewport pode alinhar-se à página mais próxima.
  - Se a página estiver ampliada (`pageScale > fitScale * 1.05`), a posição do pan manual deve ser preservada intacta, sem forçar snap centralizador que tire o usuário da sua área de trabalho.

## 4. Requisitos Não Funcionais
- **Performance**: Taxa de atualização do pan/zoom de 60fps a 120fps em dispositivos móveis, sem alocações pesadas no loop de `touchmove`.
- **Local-First & Offline**: O estado do modo caneta deve persistir em `localStorage` e funcionar 100% offline.
- **Ergonomia e IHC**: Transições naturais, eliminação de traços acidentais e affordance tátil nos controles.

## 5. Critérios de Aceite
- [ ] O botão do Modo Caneta alterna o estado e persiste a preferência do usuário.
- [ ] Com Modo Caneta ATIVADO: tocar e arrastar com 1 dedo na folha move/navega a página em vez de desenhar.
- [ ] Com Modo Caneta ATIVADO: a caneta stylus desenha e apaga com precisão.
- [ ] Com Modo Caneta DESATIVADO: 1 dedo desenha na folha e 2 dedos realizam pan e zoom.
- [ ] O gesto de 2 dedos amplia e reduz acompanhando o ponto médio dos dedos, sem travar no centro.
- [ ] No mobile com zoom ampliado, é possível realizar pan até as bordas laterais e cantos da folha.
- [ ] Todos os testes unitários do módulo de desenho são aprovados com 100% de sucesso.
