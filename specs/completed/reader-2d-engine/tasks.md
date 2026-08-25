# Tasks: Implementação do Leitor 2D Nativo de Alta Performance e Nitidez

- [x] **1. Limpeza de Dependências Three.js**
  - [x] 1.1. Remover `three` e `@types/three` do `front/package.json`.
  - [x] 1.2. Executar validação de integridade de dependências no frontend.

- [x] **2. Refatoração do Motor de Renderização e Virada 2D (`useBookPageTurn.ts`)**
  - [x] 2.1. Remover todo o código legado de Three.js (Scene, Camera, WebGLRenderer, Mesh, Shaders, Geometrias 3D).
  - [x] 2.2. Implementar cálculo de layout 2D com suporte a High-DPI (`devicePixelRatio`), cálculo de margens e posições de página (simples e dupla).
  - [x] 2.3. Implementar transição de deslizamento 2D (Slide horizontal com aceleração `easeOutCubic`, interpolação de arraste/gesto e fallback instantâneo).
  - [x] 2.4. Implementar renderização direta em Canvas 2D com cache de páginas e suporte a DPI dinâmico.

- [x] **3. Atualização do Componente de Visualização (`PageCurlCanvas.vue` e `Viewer.vue`)**
  - [x] 3.1. Ajustar o componente de renderização para Canvas 2D puro com TextLayer sobreposta sincronizada.
  - [x] 3.2. Adicionar suporte a eventos de teclado (setas ← / →) no `Viewer.vue`.
  - [x] 3.3. Garantir que a seleção de texto e tooltip de anotações continuem funcionando perfeitamente em modo simples e duplo.

- [x] **4. Atualização da Barra de Controles (`ReaderBottomBar.vue`)**
  - [x] 4.1. Adicionar botão de alternância de modo de visualização (1 Página / 2 Páginas).
  - [x] 4.2. Desabilitar ou ocultar o botão em telas mobile ou quando o painel do grafo estiver aberto.

- [x] **5. Testes e Validação**
  - [x] 5.1. Atualizar e criar testes unitários para o novo composable de navegação e renderização 2D.
  - [x] 5.2. Rodar a suíte completa de testes (`npm test`) e verificar linters/typecheck.

- [x] **6. Documentação e Finalização**
  - [x] 6.1. Atualizar documentação em `docs/` e `docs/leitor_e_gerenciamento_memoria.md`.
  - [x] 6.2. Mover spec de `specs/active/reader-2d-engine/` para `specs/completed/reader-2d-engine/`.
  - [x] 6.3. Realizar commits atômicos descritivos.
