# Tarefas de Implementação: Modo Caneta e Gestos de Navegação/Zoom Mobile no Desenho

## Checklist de Execução

- [x] **1. Camada de Estado & Composables (`useDrawing.ts`)**
  - [x] 1.1 Adicionar estado reativo `isPenOnlyMode = ref(false)` com inicialização e persistência no `localStorage` (`aresta_drawing_pen_mode`).
  - [x] 1.2 Exportar `isPenOnlyMode` e a função auxiliar `togglePenOnlyMode()` no composable.
  - [x] 1.3 Criar testes unitários em `apps/web/tests/unit/composables/useDrawing.test.ts` cobrindo a alternância e retenção do estado.

- [x] **2. Barra de Ferramentas (`DrawingToolbar.vue`)**
  - [x] 2.1 Adicionar prop `penMode?: boolean` e emit `update:penMode`.
  - [x] 2.2 Criar botão estilizado de alternância do Modo Caneta com ícone `PenLineIcon` (ou similar) e badge visual de ativo.
  - [x] 2.3 Atualizar testes em `apps/web/tests/unit/components/DrawingToolbar.test.ts` para validar renderização e disparo de eventos do Modo Caneta.

- [x] **3. Canvas da Folha de Desenho (`DrawingPageCanvas.vue`)**
  - [x] 3.1 Adicionar prop `penMode?: boolean` em `DrawingPageCanvas.vue`.
  - [x] 3.2 Atualizar `handlePointerDown`: se `props.penMode && pType === 'touch'`, retornar imediatamente sem capturar ponteiro nem iniciar traço.
  - [x] 3.3 Garantir que a caneta stylus (`pType === 'pen'`) desenhe perfeitamente quando `penMode === true`.
  - [x] 3.4 Atualizar testes em `apps/web/tests/unit/components/DrawingPageCanvas.test.ts` validando o bloqueio de traço por dedo no modo caneta e aceitação de traço com stylus.

- [x] **4. Página Principal & Viewport (`apps/web/app/pages/canvas/drawing/[id].vue`)**
  - [x] 4.1 Conectar `isPenOnlyMode` do `useDrawing` ao `DrawingToolbar`, ao `DrawingPageCanvas` e ao cabeçalho superior.
  - [x] 4.2 Implementar navegação de 1 dedo no viewport quando `penOnlyMode === true` (`isSingleTouchPanning`).
  - [x] 4.3 Corrigir pan e zoom de 2 dedos:
    - Suspender `snap-x snap-mandatory` e `scroll-smooth` dinamicamente durante o toque (`isTouchInteracting`).
    - Implementar algoritmo de zoom focal centralizado no ponto médio dos dedos (`focalX`, `focalY`).
    - Implementar deslocamento diferencial contínuo de pan (`panDeltaX`, `panDeltaY`).
    - Expandir largura de `.page-slide` no mobile para `Math.max(windowWidth, scaledSheetWidth)` ao ampliar a folha, eliminando o travamento no centro da tela.
  - [x] 4.4 Atualizar testes em `apps/web/tests/unit/pages/drawingPage.test.ts`.

- [x] **5. Quality Gates & Validação**
  - [x] 5.1 Executar testes unitários do frontend (`npm test -- tests/unit/components/Drawing tests/unit/pages/drawing tests/unit/composables/useDrawing`).
  - [x] 5.2 Executar build do frontend (`npm --prefix apps/web run build`).
  - [x] 5.3 Atualizar documentação e ADR.
  - [x] 5.4 Atualizar `checklist.md` e realizar commit atômico.
