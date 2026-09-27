# Design Técnico: Folha Única Centralizada em Telas Horizontais no Modo Desenho

## Contexto e Diagnóstico do Problema
Anteriormente, o container de páginas (`div` track em `[id].vue`) utilizava:
```html
<div class="... justify-start md:justify-center gap-4 md:gap-8">
  <div v-for="page in pages" class="page-slide w-screen md:w-auto ...">
```
Em telas horizontais (`md` ou `landscape`), os slides ficavam com largura intrínseca (`794px * pageScale`) e alinhados lado a lado com apenas `32px` (`gap-8`) de espaçamento entre si. Em monitores desktop (ex: 1920x1080) e tablets horizontais, duas folhas de desenho cabiam simultaneamente no centro da tela.

## Modelo Matemático e Geometria da Solução
Para garantir que **apenas a folha ativa fique no centro** e a **folha adjacente fique no canto** (com $K$ pixels visíveis na borda do visor):

1. **Largura da Folha Renderizada ($S$)**:
   $$S = \text{round}(794 \times \text{pageScale})$$

2. **Espaçamento Lateral da Trilha ($\text{paddingX}$)**:
   Para que a primeira e a última página fiquem exatamente no centro da viewport de largura $W$:
   $$\text{paddingX} = \frac{W - S}{2}$$

3. **Distância Entre Folhas ($\text{gap}$)**:
   Queremos que, quando a folha $i$ estiver no centro ($X = \text{paddingX}$ no viewport), a folha $i+1$ inicie em $X = W - K$ (onde $K$ é a margem de peeking, configurada para ~76px).
   A posição de início da folha $i+1$ na trilha é:
   $$\text{paddingX} + S + \text{gap}$$
   Igualando ao ponto desejado na tela ($W - K$):
   $$\text{paddingX} + S + \text{gap} = W - K$$
   Como $\text{paddingX} = \frac{W - S}{2}$, temos $2 \times \text{paddingX} + S = W$. Logo:
   $$\text{paddingX} + S = W - \text{paddingX}$$
   Substituindo:
   $$(W - \text{paddingX}) + \text{gap} = W - K \implies \text{gap} = \text{paddingX} - K$$

4. **Verificação de Simetria e Posição da Folha Anterior ($i-1$)**:
   Quando a folha $i$ está no centro, o viewport scrollou $\text{scrollLeft} = i \times (S + \text{gap})$.
   A folha $i-1$ termina na trilha em:
   $$\text{paddingX} + (i - 1)(S + \text{gap}) + S$$
   Sua posição visual na tela é:
   $$\text{paddingX} + (i - 1)(S + \text{gap}) + S - i(S + \text{gap}) = \text{paddingX} + S - (S + \text{gap}) = \text{paddingX} - \text{gap}$$
   Como $\text{gap} = \text{paddingX} - K$, temos:
   $$\text{paddingX} - (\text{paddingX} - K) = K$$
   Portanto, a folha anterior $i-1$ termina exatamente em $X = K$ da tela, espreitando exatamente $K$ pixels no canto esquerdo!

## Interação e Mudança de Foco por Clique
- **Overlay Protetor Inativo**:
  Em telas horizontais, as páginas inativas (`activePageIndex !== idx`) recebem um overlay com:
  - `cursor-pointer`
  - `hover:bg-primary/5`
  - Bloqueio de eventos de ponteiro para o canvas interno, prevenindo traços de caneta ou seleções acidentais.
  - Ao clicar (`@click.stop="focusPage(idx)"`), ativa `activePageIndex = idx` e executa `scrollToPage(idx, true)` para centralizar suavemente no visor.

- **Navegação por Teclado e Gestos**:
  O viewport mantém `snap-x snap-mandatory`. O `IntersectionObserver` detecta quando uma nova página atingir o centro e sincroniza o `activePageIndex`.

## Componentes Afetados
- `apps/web/app/pages/canvas/drawing/[id].vue`:
  - Cálculo de `horizontalPaddingX` e `horizontalGap`.
  - Aplicação dos estilos dinâmicos de trilha e overlay de clique em páginas inativas.
  - Implementação de `focusPage(idx)` e `scrollToPage(idx)`.
- `apps/web/tests/unit/pages/drawingPage.test.ts`:
  - Testes unitários para folha única horizontal, posicionamento nos cantos e troca de foco por clique.
