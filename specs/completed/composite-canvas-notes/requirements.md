# Requisitos: Módulo de Notas Compostas (Composite Notes) & Canvas Bidirecional com Prevenção de Ciclos e Anexo de Livros

## 1. Objetivo Geral
Evoluir o ecossistema de anotações do **Aresta** para uma arquitetura baseada no padrão **Composite**, unificando **Notas em Markdown** e **Quadros Infinitos (Canvas)** no estilo Obsidian. 
O sistema deve permitir a incorporação bidirecional:
1. **Canvas dentro de Notas Markdown**: Inclusão de blocos de Canvas interativos diretamente no corpo de uma anotação, permitindo pré-visualização interativa (pan/zoom) ou abertura em tela cheia.
2. **Notas dentro de Canvas**: Inclusão de cards de notas completas dentro do quadro infinito, com suporte a visualização de markdown formatado e edição inline.
3. **Anexo de Livros**: Integração direta com a biblioteca de livros (`books`), exibindo cards com capa estilizada, autor, progresso de leitura e redirecionamento direto para o leitor (`/reader/:id` ou `/livros/:id/ler`).
4. **Prevenção Robusta de Ciclos e Otimização de Performance**: Mecanismo inteligente de detecção de referências circulares (`Nota A -> Canvas B -> Nota A`) e limite de profundidade de renderização para impedir estouro de pilha e sobrecarga de renderização no DOM.

---

## 2. Escopo

- **Incluído**:
  - Modelo de dados unificado para Notas Standalone (`Note`), com suporte a títulos, tags, pastas, conteúdo em Markdown e referências a entidades (Canvas, Livros, Outras Notas).
  - Parser e renderizador de blocos compostos no Markdown (`![[canvas:<id>]]` e `![[book:<id>]]` ou sintaxe de bloco customizada).
  - Componente de visualização embutida de Canvas (`CanvasEmbedPreview.vue`) com modo miniatura interativo (navegação restrita/pan/zoom) e botão de expansão/abertura rápida.
  - Novos tipos de nós no Canvas (`note_embed` e `book_card`) aderentes ao JSON Canvas Spec v1.0 com metadados estendidos.
  - Algoritmo de **Detecção de Ciclos e Limite de Profundidade** (*Ancestral Graph Cycle Detector* com profundidade máxima configurável `MAX_DEPTH = 3`) que exibe um placeholder informativo ("*Referência cíclica prevenida*") quando um loop de renderização for identificado.
  - Virtualização e Lazy Loading de nós de Canvas e blocos embutidos para manter a fluidez de 60 FPS mesmo com múltiplos embeds aninhados.
  - Cards de livros com renderização de capa, metadados (título, autor, status) e navegação com clique único para o leitor.
  - Endpoints REST completos no backend (`aresta-back-node`) com validações Zod e relacionamentos Prisma.
  - Testes unitários e de integração abrangentes cobrindo detecção de ciclos, integridade de dados e renderização.

- **Não Incluído**:
  - Edição colaborativa simultânea multiusuário em tempo real via WebSockets/CRDT (foco na experiência individual sincronizada).
  - Renderização 3D de modelos ou simulação de física dentro dos blocos compostos.

---

## 3. Requisitos Funcionais

### R1. Sistema Unificado de Notas Markdown (Document Model)
- **Descrição**: O usuário deve poder criar, listar, atualizar, renomear e excluir documentos de anotações (`Note`), organizados por títulos, tags e pastas lógicas.
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: Cada nota deve possuir um `title` (1 a 255 caracteres), `content` (Markdown em formato string UTF-8) e pertencer obrigatoriamente a um `user_id`.

### R2. Incorporação de Canvas em Notas Markdown (Canvas Embed)
- **Descrição**: No editor/preview de uma nota, o usuário pode inserir uma referência a um Canvas existente via sintaxe wikilink `![[canvas:canvas-uuid]]` ou comando de inserção na barra de ferramentas.
- **Comportamento**:
  - No modo **Visualização/Preview**, o bloco renderiza um *Interactive Canvas Viewport* contido, com grade, nós e setas visíveis.
  - O usuário pode realizar pan e zoom dentro da caixa delimitadora do embed.
  - O cabeçalho do bloco embed contém o título do canvas, botão para tela cheia ("*Expandir*") e botão para abrir o canvas na página dedicada (`/canvas/:id`).
- **Regra**: Caso o Canvas referenciado não exista ou tenha sido excluído, exibir um fallback gracioso com aviso de "Canvas não encontrado".

### R3. Incorporação de Notas dentro do Canvas (Note Nodes)
- **Descrição**: O usuário pode adicionar nós do tipo `note_embed` no Canvas infinito, selecionando uma nota existente da sua lista ou criando uma nota rápida.
- **Comportamento**:
  - O nó exibe o título da nota e o Markdown renderizado com formatação rica (títulos, listas, código, imagens).
  - Duplo clique no nó permite editar o conteúdo da nota diretamente ou abrir a nota no painel lateral/editor dedicado.
  - Se a nota original for atualizada, o nó no Canvas reflete automaticamente a alteração.

### R4. Prevenção de Ciclos de Renderização & Depth Limiting (Anti-Recursion)
- **Descrição**: O sistema deve impedir travamento de navegador e recursão infinita decorrente de loops de composição (ex: `Nota A` inclui `Canvas B`, que por sua vez contém `Nota A`).
- **Regra de Detecção**:
  - Toda cadeia de renderização de componentes compostos deve repassar um contexto de ancestrais (`ancestorStack: Array<{ type: 'note' | 'canvas', id: string }>`).
  - Antes de instanciar um novo embed de Note ou Canvas, o renderizador verifica se o par `(type, id)` já existe na pilha de ancestrais.
  - **Condição de Ciclo**: Se o ID já estiver na pilha, a renderização interrompe imediatamente e substitui o componente por um card estilizado com aviso informativo:
    `⚠️ Referência cíclica prevenida: [Nome da Entidade] já está na hierarquia de renderização.`
  - **Limite de Profundidade**: Profundidade máxima de aninhamento fixada em `3` níveis. Ao atingir o nível 3, renderiza um botão estático "*Clique para abrir em nova janela*" em vez de instanciar o componente embutido completo.

### R5. Anexo e Nós de Livros da Estante (Book Integration & Reader Deep Linking)
- **Descrição**: O usuário pode anexar livros tanto em notas Markdown (`![[book:book-id]]`) quanto como nós no Canvas (`type: 'book'`).
- **Comportamento**:
  - Exibe a capa do livro (`cover_path`), título, autor, status de leitura e barra de progresso (percentual lido ou última página).
  - Ao clicar no card do livro, o sistema realiza um redirecionamento seguro para o leitor (`/reader/:id` ou `/livros/:id/ler`), restaurando o último progresso e posição (CFI/página).
  - No Canvas, o nó de livro possui 4 âncoras de conexão magnética para permitir vincular o livro a conceitos, resumos ou flashcards.

### R6. Otimização de Performance e Lazy Rendering
- **Descrição**: Blocos de Canvas embutidos em notas longas e nós de Canvas fora do campo de visão (*off-screen viewport*) devem utilizar lazy loading / `IntersectionObserver`.
- **Regra**: Somente os nós e mini-canvases visíveis na janela de exibição inicial inicializam listeners de eventos pesados e renderização de SVG/DOM.

### R7. Persistência de Dados e Rastreamento de Links
- **Descrição**: O backend deve persistir Notas e Canvases de forma relacional no PostgreSQL/Prisma, registrando metadados de dependência quando notas referenciam outros recursos para possibilitar visualização no Grafo de Conhecimento global.

---

## 4. Requisitos Não Funcionais

- **Performance**: Renderização de notas com até 5 mini-canvases embutidos com tempo de carregamento < 200ms e taxa de 60 FPS durante rolagem.
- **Segurança**: Isolamento estrito por `user_id` em todos os endpoints de Notas e Canvases. Sanitização de Markdown para prevenção de XSS.
- **Consistência**: Aderência total ao padrão **JSON Canvas v1.0** para os nós de Canvas e compatibilidade com Markdown CommonMark + GFM para as Notas.

---

## 5. Critérios de Aceite

- [ ] Usuário consegue criar e editar notas Markdown na interface.
- [ ] Usuário consegue inserir um Canvas em uma nota e interagir com o preview ou abri-lo em tela cheia.
- [ ] Usuário consegue inserir um card de Nota dentro de um Canvas infinito, mantendo sincronização de conteúdo.
- [ ] Cenário de ciclo direto (`Nota A -> Canvas B -> Nota A`) e ciclo indireto (`Nota A -> Canvas B -> Nota C -> Canvas B`) são interceptados sem erro de call stack, renderizando o placeholder amigável de ciclo prevenido.
- [ ] Inclusão de livro exibe a capa real do acervo e redireciona com precisão para o leitor no clique.
- [ ] Testes automatizados cobrem o algoritmo de detecção de ciclos e as operações CRUD de notas e referências compostas.
