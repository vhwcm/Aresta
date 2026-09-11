# Módulo de Grafo de Conhecimento & Mapa Mental Unificado

O módulo de **Grafo de Conhecimento Unificado** integra em uma única rede semântica interconectada:
- 🏷️ **Temas Globais (`Theme`)**
- 📚 **Livros (`Book`)**
- 📝 **Anotações de Leitura (`Annotation`)**
- 📄 **Notas Livres (`Note`)**
- 🖼️ **Quadros Infinitos (`Canvas`)**

---

## 1. Arquitetura de Dados (Prisma ORM & PostgreSQL 16)

O endpoint canônico `GET /api/graph` agrega as seguintes entidades do usuário:
1. **`user_books` + `books`**: Livros pertencentes à biblioteca do usuário com suas respectivas capas e temas.
2. **`themes` + `theme_hierarchies`**: Taxonomia conceitual e hierarquias direcionadas de subtemas.
3. **`annotations` + `annotation_themes`**: Anotações pontuais feitas durante a leitura no leitor EPUB/PDF com trechos grifados e CFIs.
4. **`notes` + `note_links`**: Notas livres em Markdown com suporte a links bidirecionais e embeds `[[book:id]]`, `[[canvas:id]]`, `[[note:id]]`.
5. **`canvases`**: Quadros infinitos com cards e notas embutidas.

### Arestas Estruturais e Semânticas
- `theme-hierarchy`: Relação pai ➔ filho entre temas.
- `book-theme`: Relação de pertencimento entre livro e tema.
- `annotation-book`: Conexão da anotação com o livro de origem.
- `annotation-theme`: Conexão da anotação com os temas do livro.
- `note-book`, `note-canvas`, `note-note`: Conexões explícitas por `NoteLink` e menções em Markdown.
- `canvas-note`: Notas contidas dentro do canvas JSON.
- `note-theme`: Correspondência semântica automática quando tags de notas coincidem com temas ativos.

---

## 2. Componente Visual D3 (`GraphCanvas.vue`)

- **Simulação de Forças D3**: `forceSimulation`, `forceLink`, `forceManyBody`, `forceCollide` com distâncias balanceadas para cada categoria de nó.
- **Filtros de Camadas Visuais**: Chips interativos para ligar/desligar visualmente Temas, Livros, Anotações, Notas e Quadros.
- **Interatividade Especializada**:
  - **Livro**: Abre a gaveta lateral `BookAnnotationsDrawer` com as anotações do livro e botão para continuar a leitura no Leitor (`/reader/:id`).
  - **Anotação**: Abre modal com o trecho citado, nota e atalho para o Leitor no ponto correspondente.
  - **Nota**: Abre o editor de notas (`/canvas?note=:id`).
  - **Quadro**: Navega para `/canvas/:id`.
  - **Tema**: Abre o `ThemeCanvasOverlay` com os livros do tema.
- **Tooltip Flutuante**: Preview contextual ao passar o mouse sobre os nós.

---

## 3. Navegação Integrada

- **Página `/grafo`**: Visão em tela cheia do Grafo Universal com todos os recursos e modais.
- **Página `/canvas`**: O alternador de visualização "Grafo" renderiza o mesmo Grafo Universal Unificado.
- **Navbar Inferior (`BottomNavbar.vue`)**: Botão direto "Anotações" para `/canvas` (sem dropdown intermediário).
- **Leitor de Livros (`/reader`)**: O grafo foi desativado durante a leitura para manter a imersão completa.
