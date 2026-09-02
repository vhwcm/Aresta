# Tarefas de Implementação: Módulo de Notas Compostas & Canvas Bidirecional

## Checklist de Execução

- [x] **1. Persistência & Schemas (Backend)**
  - [x] 1.1 Adicionar modelo `Note` e `NoteLink` em `aresta-back-node/prisma/schema.prisma` e gerar client Prisma
  - [x] 1.2 Criar schemas de validação Zod para Notas (`src/schemas/note.schema.ts`)
  - [x] 1.3 Atualizar schemas de validação Zod do Canvas (`src/schemas/canvas.schema.ts`) para suportar novos nós `note_embed` e metadados de `book`

- [x] **2. Serviços & Rotas de API (Backend)**
  - [x] 2.1 Implementar `NoteService` em `src/services/note.service.ts` com métodos CRUD, busca por tags e extração de links
  - [x] 2.2 Implementar `NoteController` em `src/controllers/note.controller.ts` com tratamento de erros
  - [x] 2.3 Registrar rotas `/api/notes` com Swagger annotations em `src/routes/note.routes.ts` e registrar no `app.ts`
  - [x] 2.4 Atualizar `CanvasService` para suporte a resolução rápida de metadados de livros e notas incorporadas

- [x] **3. Testes do Backend**
  - [x] 3.1 Criar testes de integração para Notas em `tests/notes.test.ts`
  - [x] 3.2 Executar e validar suite de testes com `npm test` em `aresta-back-node/`

- [x] **4. Frontend (Nuxt 3 / Vue 3)**
  - [x] 4.1 Atualizar tipagem em `front/app/interfaces/canvas.ts` e criar interfaces de notas em `front/app/interfaces/note.ts`
  - [x] 4.2 Implementar composable de prevenção de ciclos `front/app/composables/useCycleDetector.ts`
  - [x] 4.3 Implementar componente de aviso de ciclo `front/app/components/canvas/CycleWarningPlaceholder.vue`
  - [x] 4.4 Implementar componente de pré-visualização de Canvas embutido `front/app/components/canvas/CanvasEmbedPreview.vue`
  - [x] 4.5 Implementar componente de nó de nota `front/app/components/canvas/CanvasNodeNote.vue` no Canvas
  - [x] 4.6 Atualizar `front/app/components/canvas/CanvasNodeBook.vue` para exibir capa com qualidade e link direto para o leitor (`/reader/:id`)
  - [x] 4.7 Integrar parser de embeds (`![[canvas:id]]` e `![[book:id]]`) no editor/visualizador de Markdown (`NoteCompositeRenderer.vue`)
  - [x] 4.8 Atualizar `CanvasBoard.vue` e `CanvasToolbar.vue` para permitir inserção de nós de notas e conexão magnética nos 4 lados
  - [x] 4.9 Criar página e gerenciador de notas (`front/app/pages/notes.vue`)

- [x] **5. Testes do Frontend**
  - [x] 5.1 Criar testes unitários para o composable `useCycleDetector.test.ts`
  - [x] 5.2 Criar testes de componentes para `NoteCompositeRenderer.test.ts` e `useNotes.test.ts`
  - [x] 5.3 Executar `npm test` no frontend

- [x] **6. Documentação & Quality Gates**
  - [x] 6.1 Criar documentação de domínio em `docs/domain/notes.md`
  - [x] 6.2 Copiar diagramas ASCII para `docs/architecture/diagrams/`
  - [x] 6.3 Executar Quality Gates completos (`run-quality-gates`)
  - [x] 6.4 Revisar consistência cruzada (`review-consistency`) e commitar
