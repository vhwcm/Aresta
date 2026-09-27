# ADR-028: Modo Caneta e Gestos de Navegação e Zoom Focal no Editor de Desenho

## Status
Aceito

## Data
2026-09-27

## Contexto
No módulo de notas e cadernos de desenho do Aresta (`/canvas/drawing/:id`), usuários em dispositivos móveis e tablets enfrentavam duas restrições ergonômicas críticas:
1. **Ausência de Modo Caneta Exclusivo**: Usuários que desenham com caneta stylus (como S-Pen, Apple Pencil ou canetas capacitivas ativas) precisavam apoiar a mão ou tocar a folha para navegar sem criar traços indesejados. Não havia um modo dedicado onde apenas a caneta escrevesse e o toque de 1 dedo navegasse livremente pela folha.
2. **Zoom Travado no Centro**: Ao utilizar 2 dedos em telas móveis com o modo de desenho livre, a ampliação (pinch-to-zoom) ficava rigidamente ancorada ao centro da tela, sem permitir pan livre nem zoom direcionado à área onde os dedos estavam (zoom focal). Isso ocorria devido a três fatores combinados:
   - A imposição incondicional de CSS Scroll Snap (`snap-x snap-mandatory`) e `scroll-smooth` no viewport durante eventos contínuos de toque.
   - A largura fixa dos containers `.page-slide` (`w-screen`), que forçava a folha ampliada a se alinhar pelo centro com flexbox sem expandir o `scrollWidth` da viewport.
   - A ausência de compensação de coordenadas de rolagem relativas ao ponto médio (`midpoint`) dos toques durante a variação da escala.

## Decisão
Implementou-se uma arquitetura desacoplada de tratamento de eventos e estado reativo:

1. **Estado Reativo de Modo Caneta (`useDrawing.ts`)**:
   - Criação do estado `isPenOnlyMode = ref(false)` com persistência síncrona em `localStorage` (`aresta_drawing_pen_mode`).
   - Disponibilização dos métodos `setPenOnlyMode(enabled)` e `togglePenOnlyMode()` exportados pelo composable singleton.

2. **Filtro de Entrada no Canvas (`DrawingPageCanvas.vue`)**:
   - Adição da prop `penMode: boolean`.
   - Quando `penMode === true`, os eventos `pointerdown`, `pointermove` e `pointerup` com `pointerType === 'touch'` são ignorados para a criação de traços e não capturam o ponteiro.
   - Eventos `pointerType === 'pen'` continuam desenhando com `perfect-freehand` em alta precisão.
   - Quando `penMode === false`, o toque de 1 dedo desenha e o segundo dedo aborta o traço imediatamente.

3. **Navegação com 1 Dedo e Pan/Zoom Focal com 2 Dedos (`[id].vue`)**:
   - **Modo Caneta Ativo**: O toque de 1 dedo (`e.touches.length === 1`) aciona `isSingleTouchPanning`, transladando `viewport.scrollLeft` e `viewport.scrollTop` de forma fluida (1:1 com o deslocamento do dedo).
   - **Dois Dedos (Ambos os Modos)**:
     - Suspensão imediata do scroll snap (`snap-none scroll-auto`) durante a interação (`isTouchInteracting = true`).
     - Cálculo de zoom focal: a posição da viewport é ajustada em função do ponto focal sob os dedos (`focalX`, `focalY`) proporcionalmente ao ratio `newScale / oldScale`, eliminando o centro fixo.
     - Pan diferencial acompanhando o movimento das mãos (`panDeltaX`, `panDeltaY`).
   - **Expansão Dinâmica do Slide**: A largura de `.page-slide` no mobile expande para `Math.max(windowWidth, scaledSheetWidth)` ao ampliar, garantindo que o usuário possa rolar até os cantos extremos da folha.

4. **Controles de IHC e Interface**:
   - Botão alternador do Modo Caneta no cabeçalho superior (`[id].vue`) e na barra flutuante de ferramentas (`DrawingToolbar.vue`), com affordance visual (badge ativo, destaque com cor primária e tooltip explicativo).
   - Atalho de teclado `M` para alternar o modo caneta instantaneamente.

## Consequências

### Positivas
- Paridade ergonômica com aplicativos de referência (Samsung Notes, GoodNotes e Apple Notes).
- Usuários com caneta stylus podem apoiar a mão e navegar naturalmente com 1 dedo sem manchar a página.
- Usuários sem caneta stylus contam com pinch-to-zoom focal e pan com 2 dedos responsivo e sem travamento central.
- A folha ampliada tem amplitude total de navegação horizontal e vertical.
- Persistência Local-First garante que a preferência do usuário é mantida entre sessões sem overhead de rede.

### Negativas / Mitigações
- Durante gestos rápidos de pinça, a compensação matemática de escala exige cálculos trigonométricos por frame: mitigado pelo uso de `Math.hypot` nativo de alta performance e cálculo direto em coordenadas de viewport sem reflows desnecessários.
