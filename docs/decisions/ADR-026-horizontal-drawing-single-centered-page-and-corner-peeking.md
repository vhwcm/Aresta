# ADR-026: Folha Única Centralizada em Telas Horizontais com Páginas Adjacentes nos Cantos

## Status
Aceito (Accepted)

## Data
2026-09-27

## Contexto
No módulo de anotações e desenhos paginados (`/canvas/drawing/:id`), quando acessado em telas horizontais (desktop, monitores widescreen e tablets em orientação paisagem), ocorria um problema de sobrecarga cognitiva e layout:
1. **Exibição Simultânea Lado a Lado**: O container da trilha utilizava `md:justify-center` e `md:w-auto` com um `gap` fixo de 32px (`gap-8`). Em telas largas (ex: 1920x1080), duas páginas cabiam lado a lado e eram renderizadas ao mesmo tempo em tamanho real no centro do monitor.
2. **Falta de Foco em Folha Única**: O usuário necessita de foco absoluto na folha de desenho que está trabalhando ativamente, sem a distração de uma segunda folha inteira competindo por atenção no meio da tela.
3. **Navegação Não Intuitiva Entre Folhas**: As páginas anteriores ou posteriores não possuíam affordance clara de preview recolhido no canto e foco ao clicar, permitindo inclusive interações acidentais na página adjacente enquanto se desenhava na folha primária.

## Decisão
1. **Geometria de Folha Única Centralizada**:
   - Para telas horizontais (`isHorizontal = window.innerWidth >= 768 || window.innerWidth > window.innerHeight`), foi implementada a fórmula matemática:
     $$\text{paddingX} = \frac{W - S}{2}$$
     $$\text{gap} = \text{paddingX} - K$$
     onde $W$ é a largura do viewport, $S$ é a largura renderizada da folha ($794 \times \text{pageScale}$) e $K$ é a margem de espreita no canto ($\sim 76\text{px}$).
   - Essa geometria garante que **apenas a folha ativa fique no centro exato da tela**, enquanto as folhas adjacentes espreitam exatamente $K$ pixels nos cantos esquerdo/direito.

2. **Overlay Protetor e Troca de Foco por Clique**:
   - As folhas inativas nos cantos recebem um overlay com `cursor-pointer`, feedback visual no hover (`hover:bg-primary/5`), tooltip indicador de página e bloqueio de cliques profundos no canvas.
   - Ao clicar na folha recolhida no canto, o método `focusPage(idx)` é acionado, atualizando `activePageIndex` e disparando `scrollToPage(idx, true)` (`scrollIntoView` com `inline: 'center'`), centralizando suavemente a folha escolhida.

3. **Navegação Suave e Teclado**:
   - Preservado o alinhamento com CSS Scroll Snap (`snap-x snap-mandatory` no viewport e `snap-center` nos slides).
   - Suporte adicionado a atalhos de teclado (Setas Esquerda e Direita) para alternar o foco entre páginas quando o usuário não estiver editando campos de texto.

4. **Isolamento de Modos**:
   - A experiência vertical mobile portrait (Samsung Notes: 100% largura horizontal e criação contínua ao rolar para o lado) foi estritamente preservada sem alterações em seu fluxo de layout.

## Consequências
- **Positivas**:
  - Exibição de exatamente uma folha no centro em monitores e tablets horizontais.
  - Páginas vizinhas espreitam sutilmente no canto da tela, fornecendo contexto e affordance para troca de foco.
  - Clique na folha do canto transita o foco de forma suave e rápida, sem risco de traços acidentais.
  - Total paridade e 100% de cobertura nos testes unitários automatizados.
