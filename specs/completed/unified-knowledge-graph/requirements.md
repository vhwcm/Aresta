# Requisitos: Grafo de Conhecimento Unificado

## 1. Objetivo Geral
Unificar os grafos de conhecimento que hoje existem separadamente no ecossistema Aresta (o grafo de Temas e Livros do `/grafo` e o grafo de Quadros e Notas do `/canvas`), consolidando em uma única rede semântica interconectada: **Livros (`Book`)**, **Temas (`Theme`)**, **Anotações de Leitura (`Annotation`)** e **Notas Livres / Quadros (`Note` e `Canvas`)**. Além disso, a navegação do Leitor de Livros (`/reader`) não deve permitir abrir o grafo durante a leitura, preservando a imersão.

## 2. Escopo
- **Incluído**:
  - Endpoint otimizado `GET /api/graph` retornando todos os nós (temas, livros, anotações do leitor, notas e quadros) e todas as arestas (hierarquia de temas, tema-livro, anotação-livro, anotação-tema, nota-livro, nota-canvas, nota-nota, nota-tema por tags).
  - Suporte a filtros de tipos de nós no payload e na interface (`book`, `theme`, `annotation`, `note`, `canvas`).
  - Atualização do componente visual canônico de Grafo D3 para suportar os 5 tipos de nós com identidades visuais distintas e interatividade especializada.
  - Comportamento de clique personalizado:
    - Livro (`book`): abre painel/gaveta com as anotações feitas naquele livro, com botão para ir para o leitor.
    - Anotação (`annotation`): exibe o trecho grifado e anotação com atalho para abrir o livro na posição correspondente.
    - Nota (`note`): abre editor/visualizador da nota.
    - Quadro (`canvas`): navega para o quadro infinito.
    - Tema (`theme`): abre o painel do tema com seus livros e notas associadas.
  - Disponibilidade do Grafo Unificado em `/grafo`, no alternador de visualização do `/canvas` (modo Grafo), e no card/sidebar da Home.
  - Remoção/desativação da abertura do painel de grafo dentro do Leitor de Livros (`/reader`), mantendo a leitura 100% imersiva.
  - Ajuste na navbar inferior (`BottomNavbar.vue`): o botão de notas passa a se chamar **"Anotações"**, vai **direto para `/canvas`** (sem dropdown) e a opção de menu "Grafo de Conhecimento" é removida da navbar.
- **Não Incluído**:
  - Alteração no algoritmo de repetição espaçada (SM-2) ou flashcards.
  - Modificação na renderização 3D de virada de página do leitor.

## 3. Requisitos Funcionais

### R1. Agregação e Entrega Unificada de Dados no Backend
- **Descrição**: O serviço `GraphService.getGraph(userId)` no módulo `apps/api/src/modules/memory` deve agregar `UserBooks`, `Themes`, `Annotations`, `Notes` e `Canvases` do usuário.
- **Atores**: Usuário Autenticado.
- **Regras de Negócio**:
  - Cada entidade é mapeada para um `GraphNode` com tipo (`theme` | `book` | `annotation` | `note` | `canvas`), identificador único consistente (`theme-${id}`, `book-${id}`, `ann-${id}`, `note-${id}`, `canvas-${id}`), título/nome, atributos visuais e dados de contexto.
  - Arestas geradas automaticamente:
    1. `ThemeHierarchy` (pai -> filho entre temas).
    2. `BookTheme` (livro -> tema).
    3. `Annotation` -> `Book` (`ann.book_id`).
    4. `Annotation` -> `Theme` (`annotationThemes`).
    5. `Note` -> `Book` (via `NoteLink` com `target_type: BOOK` ou menções no Markdown `![[book:id]]`).
    6. `Note` -> `Canvas` (via `NoteLink` ou embeds `![[canvas:id]]`).
    7. `Note` -> `Note` (via `NoteLink` ou embeds `![[note:id]]`).
    8. `Canvas` -> `Note` (notas presentes dentro do canvas JSON).
    9. `Note` -> `Theme` (associação semântica quando as tags da nota coincidirem com nomes de temas ativos).

### R2. Barra de Filtros por Camadas de Nós
- **Descrição**: A interface do Grafo deve fornecer chips/toggles rápidos para ligar/desligar visualmente qualquer uma das 5 categorias de nós:
  - 🏷️ Temas
  - 📚 Livros
  - 📝 Anotações de Leitura
  - 📄 Notas Livres
  - 🖼️ Quadros (Canvas)
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: O grafo recalcula ou filtra dinamicamente a simulação D3, ocultando nós desmarcados e suas arestas associadas.

### R3. Interação Específica por Tipo de Nó
- **Descrição**:
  - Ao clicar em um nó de **Livro**: deve abrir a gaveta lateral contendo a lista das anotações realizadas naquele livro, com botão "Continuar Leitura" que redireciona para `/reader/:id`.
  - Ao clicar em um nó de **Anotação de Leitura**: exibe popover/card com o trecho marcado, nota pessoal e botão para abrir o livro diretamente no CFI/posição.
  - Ao clicar em um nó de **Nota**: abre o drawer/modal de visualização e edição rápida da nota (ou redireciona para `/canvas?note=:id`).
  - Ao clicar em um nó de **Quadro**: navega para `/canvas/:id`.
  - Ao clicar em um nó de **Tema**: abre o overlay com o carrossel de livros e anotações do tema.

### R4. Grafo Unificado em `/canvas`
- **Descrição**: Quando o usuário alternar para o modo "Grafo" na página `/canvas`, a área de exibição deve renderizar o mesmo componente do Grafo de Conhecimento Unificado (com suporte a todos os tipos de nós e filtros).

### R5. Desativação do Grafo dentro do Leitor (`/reader`)
- **Descrição**: Durante a leitura de um livro em `/reader`, o botão de alternar/abrir o Grafo deve ser removido da barra superior/inferior, garantindo uma leitura limpa e sem distrações.

### R6. Botão Direto de Anotações na Navbar
- **Descrição**: O botão na navbar inferior (`BottomNavbar.vue`) que anteriormente abria um menu dropdown com "Notas & Quadros" e "Grafo de Conhecimento" deve:
  - Chamar-se **"Anotações"**.
  - Ser um link direto para `/canvas` (sem abrir dropdown intermediário).
  - Remover a opção "Grafo de Conhecimento" da navbar. O acesso ao Grafo Unificado fica integrado no botão "Grafo" dentro de `/canvas`.

## 5. Requisitos Não Funcionais
- **Performance**: O cálculo das arestas no backend deve utilizar queries Prisma otimizadas com `include` e `Set` em memória, respondendo em menos de 200ms para bases médias de usuários.
- **Estabilidade Visual**: A simulação de forças D3 deve utilizar parâmetros balanceados de colisão e link distance para evitar sobreposição caótica de nós.
- **Responsividade**: Compatível com desktop, tablet e telas menores (mobile).

## 6. Critérios de Aceite
- [ ] Endpoint `GET /api/graph` retorna nós dos 5 tipos (`theme`, `book`, `annotation`, `note`, `canvas`) e suas arestas integradas.
- [ ] Conexões entre livros e notas (`NoteLink` target `BOOK` e menções `[[book:...]]`) são incluídas nas arestas.
- [ ] Conexões entre anotações do leitor e o livro de origem são renderizadas.
- [ ] Clicar no nó de livro abre o painel com as anotações do livro e botão para ir para o leitor.
- [ ] Filtros rápidos de camadas (Temas, Livros, Anotações, Notas, Quadros) permitem filtrar os nós no canvas D3.
- [ ] A tela `/canvas` em modo Grafo renderiza o Grafo Unificado completo.
- [ ] O leitor `/reader` não exibe botão nem atalho para abrir o grafo durante a leitura.
- [ ] Testes unitários do backend e do frontend passam com 100% de sucesso.
