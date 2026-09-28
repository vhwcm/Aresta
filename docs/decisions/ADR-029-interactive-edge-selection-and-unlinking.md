# ADR-029: Seleção Interativa de Arestas e Desvinculação Persistente no Grafo de Conhecimento

## Status
Aceito

## Data
28/09/2026

## Contexto
O Grafo de Conhecimento do Aresta (`GraphCanvas.vue`) renderiza relações multidimensionais entre nós raiz, temas, livros, anotações e notas através de arestas no formato SVG renderizadas via D3.
Anteriormente, as arestas eram tratadas como elementos puramente visuais (`<line>` passivos), sem capacidade de seleção interativa, inspeção ou desvinculação direta na tela pelo usuário. Quando o usuário desejava remover um livro ou anotação de um tema, ou quebrar a conexão entre dois temas relacionados, necessitava navegar até telas ou gavetas laterais de edição, gerando atrito cognitivo.

## Decisão
1. **Camada de Interação Ergonômica (Hit-Area Aumentada)**:
   - Implementação de um `<line class="graph-edge-hit">` transparente sobreposto a cada aresta com espessura de 18px e `cursor: pointer`. Isso garante uma área de toque acessível tanto para cliques de mouse quanto toques em telas touch/mobile sem sobrecarregar visualmente o grafo.
   - Arestas estruturais protegidas (como as conexões do nó raiz `Meu Conhecimento` e o vínculo inerente `annotation-book`) são marcadas como não-deletáveis, preservando a estabilidade da topologia.

2. **Feedback Visual e Botão Flutuante Centralizado**:
   - Ao clicar na aresta interativa, a aresta é destacada com cor de ênfase vibrante (`#EF4444`) e espessura acentuada.
   - Um botão flutuante estilizado em Glassmorphism surge exatamente no ponto médio da aresta com o ícone de lixeira e o rótulo "Excluir vínculo".
   - A posição do botão (`edgeBtnPos`) é calculada em tempo real com base no ponto médio das coordenadas atuais dos nós de origem e destino, projetadas no espaço de visualização D3 através da matriz de transformação de zoom (`transform.applyX/Y`), acompanhando animações de flutuação, física e zoom/pan do canvas sem qualquer defasagem.

3. **Desvinculação Real e Persistente (`useGraph.unlinkEdge`)**:
   - A exclusão atua no domínio de dados de acordo com a semântica da relação:
     - `book-theme`: Desvincula o livro do tema chamando o repositório persistente (`bookRepo.save`).
     - `annotation-theme`: Remove a relação do tema da anotação persistente (`annotationRepo.save`).
     - `note-theme`: Remove a tag correspondente ao tema da lista de tags da nota (`noteRepo.save`).
     - `note-book` / `note-canvas`: Remove o link associado da nota (`noteRepo.save`).
     - `theme-hierarchy` / arestas customizadas: Remove a aresta de `meta.edges` no armazenamento local e memórias ativas.
   - O estado do grafo em memória é atualizado imediatamente e os dados revalidados, garantindo uma transição fluida sem necessidade de toasts intrusivos.

## Consequências
- **Positivas**:
  - Eliminação de fricção para gerenciamento de conexões conceituais direto pelo grafo.
  - Precisão geométrica no rastreamento do botão flutuante em tempo real durante zoom, arrasto e física D3.
  - Segurança de dados: arestas vitais para a estrutura física (como conexões do nó central) permanecem protegidas contra exclusão acidental.
- **Negativas / Mitigações**:
  - Exige sincronização de coordenadas a cada frame de animação D3; mitigado utilizando cálculo direto de ponto médio sem consultas custosas ao DOM (`getBoundingClientRect`), mantendo 60 FPS contínuos.
