# Requisitos: Folha Única Centralizada em Telas Horizontais no Modo Desenho

## Objetivo Geral
Garantir que, em telas horizontais (desktop, laptops e tablets em orientação paisagem), apenas uma única folha de desenho fique visível no centro da tela. Caso existam outras páginas, elas devem aparecer recolhidas/espreitadas no canto da tela (peeking lateral) e, ao clicar em uma folha do canto, o foco e a centralização do viewport devem transitar suavemente para ela.

## Requisitos Funcionais

- **RF01 - Folha Única no Centro em Modo Horizontal**:
  - Quando a tela for horizontal (`window.innerWidth >= 768` ou orientação landscape), a página ativa (`activePageIndex`) deve ficar perfeitamente centralizada na horizontal do viewport.
  - Não deve haver mais de uma folha completa aberta lado a lado no centro do visor simultaneamente.

- **RF02 - Posicionamento das Páginas Adjacentes nos Cantos (Peeking)**:
  - Se houver uma página seguinte (ex: Página 2 enquanto a Página 1 está ativa), uma faixa dela (peeking de ~72px a 84px) deve aparecer rente ao canto direito da tela.
  - Se houver uma página anterior (ex: Página 1 enquanto a Página 2 está ativa), uma faixa dela deve aparecer rente ao canto esquerdo da tela.
  - As páginas nos cantos devem exibir indicação clara de sua existência e estado inativo (borda suave, número da página, cursor de clique e proteção contra traços acidentais).

- **RF03 - Troca de Foco e Transição Suave ao Clicar**:
  - Ao clicar em qualquer ponto da folha no canto, a página clicada torna-se a ativa (`activePageIndex = idx`).
  - O viewport deve transitar suavemente (smooth scroll/snap) para posicionar a página clicada no centro exato da tela.
  - A página anteriormente ativa é deslocada suavemente para o canto oposto.

- **RF04 - Compatibilidade com Navegação por Gestos, Scroll e Teclado**:
  - A rolagem horizontal (mouse wheel horizontal, swipe ou touch pan) e teclado (setas / atalhos) devem continuar funcionando de maneira fluida com `snap-center`.
  - O `IntersectionObserver` deve atualizar reativamente o `activePageIndex` quando uma folha for centralizada pelo scroll.

- **RF05 - Preservação do Fluxo Mobile Portrait**:
  - Em telas verticais (smartphones em portrait), a experiência fluida já existente (folha ocupando 100% da largura, trailing slide "Nova página" e auto-paging) deve ser estritamente preservada sem regressões.

## Critérios de Aceite Testáveis
- [ ] Em resolução 1920x1080 com 2 páginas, apenas a página ativa fica no centro, e a outra página aparece peeking no canto direito/esquerdo.
- [ ] Ao clicar na página recolhida no canto, o foco muda para ela e ela se centraliza no visor.
- [ ] Clicar na página inerte no canto não cria traços de desenho nem arrasta nós nela.
- [ ] No mobile portrait, a largura contínua de 100% e o trailing slide continuam intactos.
- [ ] Todos os testes unitários e de integração passam com 100% de sucesso.
