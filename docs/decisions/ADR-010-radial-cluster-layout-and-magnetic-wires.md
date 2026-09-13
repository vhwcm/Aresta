# ADR-010: Layout Radial Clusterizado, Auto-Fit em Tela Cheia, Micro-Balanço e Arestas Magnéticas no Grafo

- **Status**: Aceito
- **Data**: 2026-09-13
- **Autores**: Equipe Aresta

---

## 1. Contexto

Anteriormente no Grafo de Conhecimento (`GraphCanvas.vue`):
1. Uma contenção restrita (`maxDispersalRadius = Math.min(width, height) * 0.42`) e força radial compressiva forçavam todos os nós a se aglomerarem de forma excessivamente densa em volta do centro.
2. Não havia enquadramento automático (`fitToScreen`) no zoom inicial, dependendo de manipulação manual do usuário para visualizar todos os nós.
3. Arrastar nós com o mouse frequentemente desorganizava a hierarquia do grafo.
4. Conectar nós exigia navegar por modais ou barras superiores, sem possibilidade de puxar conexões visuais diretamente no canvas.

---

## 2. Decisão

1. **Layout Radial Clusterizado em Árvore**:
   - **Nó Raiz ("Meu Conhecimento")**: fixo no centro do canvas.
   - **Nível 1 (Temas)**: expandidos em raio amplo (`R1 ~ 230px`), divididos angularmente ao redor do centro.
   - **Nível 2 (Livros, Notas, Quadros)**: agrupados em leque no corredor angular de seus temas pais (`R2 ~ 420px`), expandindo-se para longe do centro.
   - **Nível 3 (Anotações)**: distribuídas na periferia externa (`R3 ~ 580px`) em torno dos livros.
   - **Remoção do Clamp**: removida a barreira artificial de 42%, permitindo que os nós respirem com distância confortável (`forceCollide` com 22px de margem).

2. **Auto-Fit Inteligente Inicial e Dinâmico**:
   - Função `fitToScreen(animate)` calcula a bounding box real dos nós visíveis com respiro de 75px e aplica a transformação D3 Zoom (`scale` e `translate`) para que 100% dos nós caibam na tela no carregamento, ao filtrar camadas ou pesquisar.

3. **Imobilização Manual com Micro-Balanço Harmônico Contínuo**:
   - Desativado o arrasto livre de nós para preservar o alinhamento visual.
   - Adicionada animação harmônica contínua em loop `requestAnimationFrame` (`amplitude: 2.8px`, fases pseudo-aleatórias por ID do nó), sincronizando coordenadas de nós e extremidades de arestas.

4. **Puxamento de Arestas Magnéticas (Wire Dragging)**:
   - Ao segurar e arrastar o cursor a partir de um nó (>5px), renderiza uma linha guia tracejada com filtro de brilho SVG (`#wire-glow`).
   - Ao aproximar-se de outro nó válido, aplica snap magnético e highlight pulsante (`.node-snap-highlight`).
   - Ao soltar, conecta diretamente Temas com Temas (`createConnection`) ou Livros com Temas (`linkBookToNode`).
   - Clique simples (<5px) continua abrindo detalhes do nó.

---

## 3. Consequências

- **Positivas**:
  - Visualização imediata e equilibrada de todo o universo de conhecimento do usuário em qualquer tamanho de tela.
  - Grafo visualmente vivo e orgânico, sem perder o layout geométrico.
  - Criação direta e tátil de relações semânticas com feedback em tempo real.
