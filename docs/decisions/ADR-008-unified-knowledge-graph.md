# ADR-008: Grafo de Conhecimento Unificado (Livros, Temas, Anotações e Notas/Quadros)

- **Status**: Aceito
- **Data**: 2026-09-11
- **Autores**: Equipe Aresta

---

## 1. Contexto

Anteriormente no ecossistema Aresta existiam dois grafos de conhecimento desconectados:
1. O grafo de temas e livros da rota `/grafo` (onde anotações não eram nós visuais, mas listas em drawers).
2. O grafo de quadros e notas da rota `/canvas` (`KnowledgeGraphView.vue`), que não possuía visibilidade dos livros nem dos temas.
Além disso, no Leitor de Livros (`/reader`), existia uma interface de grafo aberta que gerava distração na leitura, e na barra inferior (`BottomNavbar`), o acesso a notas era mediado por um dropdown intermediário com a opção redundante de grafo.

---

## 2. Decisão

1. **Unificação Canônica no Backend (`GET /api/graph`)**:
   - `GraphService.getGraph(userId)` agrega os 5 tipos de nós:
     - `theme-${id}` (Temas taxonômicos e semânticos)
     - `book-${id}` (Livros da biblioteca do usuário)
     - `ann-${id}` (Anotações de leitura com texto grifado e notas)
     - `note-${id}` (Notas livres em Markdown)
     - `canvas-${id}` (Quadros infinitos)
   - Computação de arestas estruturais e semânticas automáticas:
     - `theme-hierarchy` (pai ➔ filho)
     - `book-theme` (livro ➔ tema)
     - `annotation-book` (anotação ➔ livro de origem)
     - `annotation-theme` (anotação ➔ tema vinculado)
     - `note-book`, `note-canvas`, `note-note` (via `NoteLink` e menções `[[book:id]]`, `[[canvas:id]]`, `[[note:id]]`)
     - `canvas-note` (notas incorporadas ao JSON do canvas)
     - `note-theme` (correspondência semântica de tags de notas com temas ativos)

2. **Componente Visual Unificado (`GraphCanvas.vue`) com Filtro de Camadas**:
   - Renderização diferenciada por tipo de nó em D3 (capa do livro, marcador âmbar para anotações, documento índigo para notas, grid esmeralda para quadros, círculo colorido para temas).
   - Barra de filtros de camadas para alternar visibilidade sob demanda (Temas, Livros, Anotações, Notas, Quadros).
   - Tooltip flutuante com preview rico de trechos citados, notas e pastas.

3. **Interações Especializadas**:
   - Livro: abre gaveta lateral `BookAnnotationsDrawer` com as anotações do livro e botão direto "Continuar Leitura" para abrir no Leitor.
   - Anotação: abre modal com o trecho citado e atalho "Abrir no Livro" na posição exata (CFI).
   - Nota: abre o editor de notas (`/canvas?note=:id`).
   - Quadro: navega para `/canvas/:id`.
   - Tema: abre o `ThemeCanvasOverlay`.

4. **Navegação Simplificada e Leitor Imersivo**:
   - A página `/canvas` em modo "Grafo" renderiza o mesmo Grafo Universal Unificado.
   - A navbar inferior (`BottomNavbar.vue`) possui o link direto "Anotações" para `/canvas` sem menu dropdown.
   - O Leitor de Livros (`/reader`) não possui botão nem painel de grafo durante a leitura, preservando imersão total.

---

## 3. Consequências

- **Positivas**:
  - Uma única fonte da verdade e uma única engine visual para todo o conhecimento do usuário.
  - Navegação fluida entre leitura, anotações de livros e notas de pensamento livre.
  - Leitura 100% imersiva sem poluição de grafos durante a sessão de leitura.
  - Performance consistente com uma única requisição otimizada no backend.
