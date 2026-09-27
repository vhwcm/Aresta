# Tasks: Folha Única Centralizada em Telas Horizontais no Modo Desenho

- [x] **Task 1: Testes Unitários de Geometria e Interação (TDD)**
  - Adicionar testes em `apps/web/tests/unit/pages/drawingPage.test.ts` verificando:
    - Em telas horizontais com múltiplas páginas, o container de trilha aplica padding e espaçamento calculados para folha única no centro.
    - As páginas adjacentes recebem o overlay de clique e o estilo de peeking lateral.
    - O clique em uma página inerte no canto dispara a troca de foco (`activePageIndex`) e o deslocamento suave (`scrollToPage`).
    - No mobile portrait, a largura contínua de 100% é preservada.

- [x] **Task 2: Implementar Cálculo Reativo de Espaçamento e Peeking em `[id].vue`**
  - Adicionar estado reativo `isHorizontal` baseado na resolução e orientação da tela.
  - Implementar computed properties `horizontalPaddingX` e `horizontalGap` respeitando a fórmula $\text{gap} = \text{paddingX} - K$.
  - Ajustar o container de trilha para aplicar `padding-left`, `padding-right` e `gap` dinâmicos quando `isHorizontal` for verdadeiro.

- [x] **Task 3: Implementar Foco por Clique e Proteção de Páginas Inativas**
  - Inserir overlay clicável nas páginas inativas em telas horizontais com affordance visual (`cursor-pointer`, `hover:bg-primary/5`).
  - Implementar método `focusPage(idx)` que atualiza `activePageIndex` e centraliza a página via `scrollToPage(idx, true)`.
  - Garantir que `addPage` continue centralizando a nova folha criada.

- [x] **Task 4: Validação de Quality Gates e Documentação**
  - Executar suíte de testes unitários (`npm test`).
  - Executar verificação de build (`npm run build`).
  - Criar ADR em `docs/decisions/ADR-026-horizontal-drawing-single-centered-page-and-corner-peeking.md`.
  - Atualizar `checklist.md` com status `[Concluído]`.
