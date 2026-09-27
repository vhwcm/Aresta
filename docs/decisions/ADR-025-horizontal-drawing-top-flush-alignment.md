# ADR-025: Alinhamento Superior da Folha de Desenho em Telas Horizontais

## Status
Aceito (Accepted)

## Data
2026-09-27

## Contexto
No módulo de anotações e desenhos paginados (`/canvas/drawing/:id`), a experiência de uso em telas horizontais (desktop, monitores widescreen e tablets em orientação paisagem) sofria com centralização vertical excessiva e margens que afastavam a folha do topo:
1. **Centralização Vertical Desnecessária**: O container da trilha utilizava classes como `m-auto`, `items-center` e `md:py-8`, gerando um espaçamento vertical considerável (~50-80px) entre a barra superior e o topo da folha.
2. **Corte e Quebra Visual de Encaixe**: O componente `DrawingPageCanvas.vue` foi concebido com cantos inferiores arredondados (`rounded-b-xl`) e sem borda superior (`border-t-0`), projetado especificamente para se conectar de maneira rente à borda inferior do cabeçalho da página. O espaçamento superior quebrava a metáfora de bloco/prancheta fixada ao topo.
3. **Ergonomia de Escrita e Visualização**: Em monitores e tablets horizontais, fixar a folha rente ao topo maximiza a estabilidade visual e a ergonomia durante o traçado, permitindo rolagem vertical natural para baixo quando o conteúdo se estende além da altura do viewport.

## Decisão
1. **Fixação Rente ao Topo (Top Flush) em Telas Horizontais**:
   - Ajuste da trilha flex (`Centering Track`) para aplicar `md:pt-0 landscape:pt-0` e `md:items-start landscape:items-start`, eliminando qualquer margem ou padding superior da folha em visualizações horizontais.
   - Substituição de `m-auto` irrestrito por `my-auto md:my-0 md:mx-auto landscape:my-0 landscape:mx-auto`, garantindo que auto-margins verticais não forcem a centralização da folha no eixo vertical do viewport.
   - Configuração de `md:justify-start landscape:justify-start` nos slides de página (`.page-slide`).

2. **Posicionamento da Barra de Ferramentas Flutuante em Paisagem**:
   - Atualização do container da `DrawingToolbar` para manter a ancoragem lateral esquerda em qualquer proporção de tela horizontal (`landscape:top-1/2 landscape:-translate-y-1/2 landscape:left-6`), prevenindo colisões visuais com o topo da folha.

3. **Cálculo de Escala Adaptativa Sem Desconto Superior Fantasma**:
   - Em `calculateFitScale()`, a altura disponível para telas horizontais passa a considerar apenas o cabeçalho superior (56px) e a margem de respiro inferior (48px): `availableHeight = window.innerHeight - 104`.
   - Remoção da dedução do espaçamento superior fantasma (anteriormente `window.innerHeight - 136`), proporcionando aproveitamento dimensional otimizado no enquadramento inicial.

## Consequências
- **Positivas**:
  - Folha colada perfeitamente na parte superior em telas horizontais, conectando o topo plano (`border-t-0`) diretamente ao cabeçalho.
  - Eliminação de espaços pretos vazios ociosos acima da folha em monitores widescreen e tablets.
  - Preservação integral do comportamento mobile portrait estilo Samsung Notes (100% largura e criação contínua ao deslizar).
  - 100% dos Quality Gates verdes (testes unitários e build de produção validados).
