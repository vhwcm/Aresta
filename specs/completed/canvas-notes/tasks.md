# Checklist de Implementação: Quadro Infinito (Canvas) & Anotações com IA

## Fase 1: Backend & Persistência (Node.js / Prisma)
- [x] **T1.1**: Adicionar o modelo `Canvas` em `aresta-back-node/prisma/schema.prisma` e gerar migração/client Prisma.
- [x] **T1.2**: Implementar `CanvasService` com métodos CRUD, duplicação e validação do schema JSON Canvas em `aresta-back-node/src/services/canvas.service.ts`.
- [x] **T1.3**: Implementar `CanvasController` e rotas `/api/canvases` com validação Zod e autenticação JWT em `aresta-back-node/src/controllers/canvas.controller.ts` e `aresta-back-node/src/routes/canvas.routes.ts`.
- [x] **T1.4**: Escrever testes automatizados de integração do backend para a API de Canvas em `aresta-back-node/tests/canvas.test.ts`.

## Fase 2: Composable & Estado do Canvas (Frontend)
- [x] **T2.1**: Implementar o composable `useCanvas.ts` com gerenciamento de nós (`nodes`), conexões (`edges`), viewport (`x, y, zoom`), pilha de Undo/Redo e autosave com debounce.
- [x] **T2.2**: Implementar o composable `useCanvasInking.ts` para captura de traços de caneta, cálculo de bounding box, exportação de imagem PNG recortada e chamada ao endpoint `/api/ocr/transcribe`.
- [x] **T2.3**: Escrever testes unitários em Vitest para `useCanvas.test.ts` e funções de geometria/ancoragem.

## Fase 3: Componentes de Renderização e Viewport (Frontend)
- [x] **T3.1**: Criar componente `CanvasBoard.vue` com suporte a Pan, Zoom centrado no cursor, grade pontilhada e duplo clique para criar notas.
- [x] **T3.2**: Criar componente `CanvasEdgeLayer.vue` (SVG) calculando curvas de Bézier cúbicas entre âncoras (`top`, `right`, `bottom`, `left`), setas direcionadas e rótulos de texto.
- [x] **T3.3**: Criar componente `CanvasNode.vue` com posicionamento absoluto transform, handles de redimensionamento e 4 pontos de ancoragem visuais para criação de setas com drag-and-drop.
- [x] **T3.4**: Criar componente `CanvasNodeText.vue` com edição inline de Markdown e Live Preview.
- [x] **T3.5**: Criar componente `CanvasNodeShape.vue` para formas geométricas (retângulo, elipse, losango, triângulo) com texto interno.
- [x] **T3.6**: Criar componente `CanvasNodeBook.vue` para cards vinculados a livros da estante.

## Fase 4: Camada de Escrita Manual com IA & Barra de Ferramentas
- [x] **T4.1**: Criar componente `CanvasInkingOverlay.vue` para desenho à mão livre com mouse/touch e botão flutuante `"✨ Transcrever"` posicionado na bounding box.
- [x] **T4.2**: Criar componente `CanvasToolbar.vue` com ferramentas de seleção, notas, formas, texto, caneta IA, livro, undo/redo, zoom e exportar `.canvas`.
- [x] **T4.3**: Criar componente `CanvasInsertDrawer.vue` para busca e inserção de livros e citações.

## Fase 5: Páginas, Navegação e Integração
- [x] **T5.1**: Criar página de gerenciamento `/canvas` (`front/app/pages/canvas/index.vue`) com listagem de quadros, busca, exclusão, importação `.canvas` e criação rápida.
- [x] **T5.2**: Criar página do editor `/canvas/[id]` (`front/app/pages/canvas/[id].vue`) integrando todos os componentes do quadro.
- [x] **T5.3**: Adicionar link para o Canvas na barra de navegação/menu lateral principal do Aresta.

## Fase 6: Testes, Revisão e Documentação (Kiro Mental Model)
- [x] **T6.1**: Executar testes automatizados no backend (`npm test` em `aresta-back-node`) e frontend (`npm test` em `front`).
- [x] **T6.2**: Executar auditoria de consistência entre código, specs, diagramas e documentação (`review-consistency`).
- [x] **T6.3**: Mover a spec para `specs/completed/canvas-notes/` e atualizar `docs/` com guias e registros de arquitetura (`update-docs`).
- [x] **T6.4**: Realizar commits atômicos e descritivos das alterações.
