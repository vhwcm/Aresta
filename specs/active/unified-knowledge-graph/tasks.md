# Tarefas: Grafo de Conhecimento Unificado

## 1. Backend (apps/api)
- [x] 1.1 Atualizar `GraphService.getGraph` em `apps/api/src/modules/memory/services/graph.service.ts`:
  - Buscar `Note` (com `noteLinks`), `Canvas`, `Annotation` (com `annotationThemes`), `UserBook` e `Theme`.
  - Gerar `nodes` tipados para todos os 5 tipos (`theme`, `book`, `annotation`, `note`, `canvas`).
  - Gerar `edges` estruturais e semânticas (livro-tema, anotação-livro, anotação-tema, nota-livro, nota-canvas, nota-nota, canvas-nota, nota-tema).
- [x] 1.2 Atualizar testes unitários do backend para `GraphService` cobrindo a geração correta de todos os tipos de nós e arestas.

## 2. Frontend Interfaces & Composable (apps/web)
- [x] 2.1 Atualizar `apps/web/app/interfaces/graph.ts` com os novos tipos `GraphNodeType` e propriedades adicionais (`bookId`, `selectedText`, `cfi`, etc.).
- [x] 2.2 Atualizar `useGraph.ts` para consumir os novos nós e gerenciar estados de filtros de camadas ativas (`theme`, `book`, `annotation`, `note`, `canvas`).

## 3. Componentes Visuais do Grafo (apps/web)
- [x] 3.1 Atualizar `GraphCanvas.vue`:
  - Renderizar nós com visual específico por tipo (capa/borda para livros, marcador para anotações, doc para notas, grid para quadros, círculo colorido para temas).
  - Adicionar barra de filtros de camadas rápidas (chips para ligar/desligar tipos de nós).
  - Configurar cliques e eventos para cada tipo de nó:
    - Livro: emite abertura da gaveta de anotações do livro com botão para ir para o leitor.
    - Anotação: abre card/preview com trecho grifado e link para abrir o livro na posição.
    - Nota: emite seleção de nota para editor/drawer.
    - Quadro: navega para `/canvas/:id`.
    - Tema: abre overlay do tema.
- [x] 3.2 Atualizar `apps/web/app/pages/grafo.vue` para suportar os novos nós, drawers e modais.
- [x] 3.3 Atualizar `apps/web/app/pages/canvas/index.vue` para substituir `KnowledgeGraphView` pelo `GraphCanvas` unificado quando a aba "Grafo" estiver ativa.

## 4. Remoção do Grafo do Leitor & Ajuste da Navbar (apps/web)
- [x] 4.1 Remover botão de grafo e atalhos em `ReaderTopBar.vue` e `ReaderBottomBar.vue`.
- [x] 4.2 Desativar abertura de painel de grafo durante a leitura em `ReaderView.vue`.
- [x] 4.3 Atualizar `BottomNavbar.vue` e seus testes: botão direto "Anotações" apontando para `/canvas`, removendo dropdown de notas e opção "Grafo de Conhecimento".

## 5. Quality Gates & Testes
- [x] 5.1 Executar testes unitários do backend (`npm test` em `apps/api`).
- [x] 5.2 Executar testes unitários do frontend (`npm test` em `apps/web`).
- [x] 5.3 Executar build de produção (`npm run build`).
- [x] 5.4 Atualizar documentação e registrar ADR.
