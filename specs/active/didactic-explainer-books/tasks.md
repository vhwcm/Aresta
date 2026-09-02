# Checklist de Tarefas: Livros & Livretos Didáticos com IA

## Fase 1: Modelagem Prisma & Migração do Banco
- [x] 1.1 Atualizar `aresta-back-node/prisma/schema.prisma` adicionando `format_type String @default("EPUB")` e `is_ai_generated Boolean @default(false)` no modelo `Book`.
- [x] 1.2 Criar os modelos `DidacticBooklet` e `DidacticBookletChapter` em `schema.prisma` com chaves estrangeiras para `User`, `Book`, `Flashcard?`, `Annotation?` e `Theme?`.
- [x] 1.3 Rodar migração do Prisma (`npx prisma migrate dev` ou `npx prisma db push`) e regenerar o Prisma Client (`npx prisma generate`).

## Fase 2: Schemas Zod, Prompt Engine & Serviços de Composição
- [x] 2.1 Criar schemas de validação Zod em `src/schemas/didactic.schema.ts` (`CreateBookletSchema`, `AppendChapterSchema`).
- [x] 2.2 Criar `src/services/didacticPromptEngine.service.ts` com o sistema de pré-prompt pedagógico, diretrizes de analogias, regras de Mermaid e callouts.
- [x] 2.3 Criar `src/services/didacticAI.service.ts` para integração com Gemini AI, coleta de contexto semântico e sanitização de Markdown.
- [x] 2.4 Criar `src/services/didacticBooklet.service.ts` com a lógica de:
  - Criação de livreto didático independente (*Standalone Booklet*).
  - Anexação de capítulo a livreto existente com incremento de `order_index`.
  - **Validação estrita da regra de append**: lançar erro `CANNOT_APPEND_TO_NON_BOOKLET` caso o livro alvo não seja um livreto didático.

## Fase 3: Endpoints REST, Controllers & Rotas
- [x] 3.1 Criar `src/controllers/didactic.controller.ts` com endpoints:
  - `POST /api/v1/didactic/booklets` (Criar novo livreto).
  - `POST /api/v1/didactic/booklets/:id/append` (Appendar capítulo em livreto).
  - `GET /api/v1/didactic/booklets` (Listar livretos do usuário).
  - `GET /api/v1/didactic/booklets/:id` (Obter livreto com todos os capítulos).
- [x] 3.2 Registrar rotas em `src/routes/didactic.routes.ts` e plugar no `app.ts` com documentação Swagger.
- [x] 3.3 Escrever testes unitários para o compilador de livros e serviços de IA (`tests/unit/didacticBooklet.service.spec.ts`).

## Fase 4: Frontend - Strategy Pattern & Adapter de Leitura Próprio
- [x] 4.1 Criar a classe `front/app/adapters/DidacticDocumentAdapter.ts` implementando a interface `IBookDocument`:
  - Carregamento de capítulos e paginação virtual inteligente.
  - Renderização de páginas para o motor 2D/3D.
  - Implementação de `renderTextLayer` com spans indexados para seleção de texto.
  - Suporte ao sistema de anotações e grifos (`didactic://...`).
- [x] 4.2 Registrar o novo tipo `'didactic'` em `front/app/adapters/BookDocumentFactory.ts` e `front/app/interfaces/reader/IBookDocument.ts`.
- [x] 4.3 Integrar o renderizador dinâmico de blocos `mermaid` e callouts pedagógicos no adapter.

## Fase 5: Integrações de UI & Pontos de Entrada
- [x] 5.1 Criar composable `front/app/composables/useDidacticBooklet.ts` para gerenciar criação, append e listagem de livretos.
- [x] 5.2 Adicionar ação "Explicar com IA" na tela de revisão de Flashcards (`front/app/pages/revisao.vue`) com modal oferecendo:
  - *"Criar Novo Livreto Didático"*
  - *"Anexar a um Livreto Existente"* (com seletor de livretos).
- [x] 5.3 Adicionar botão "Novo Livreto Didático" na Biblioteca (`front/app/pages/library.vue`) e na gaveta do Grafo (`NodeDrawer.vue`).
- [x] 5.4 Adicionar badge visual identificando livretos didáticos na estante.

## Fase 6: Bateria Exaustiva de Testes Automatizados
- [x] 6.1 Escrever testes unitários em `tests/unit/didacticBooklet.service.spec.ts`:
  - Teste de criação de livreto com sucesso.
  - Teste de append de capítulo sequencial.
  - Teste de **rejeição obrigatória** de append quando o alvo for EPUB ou PDF (`CANNOT_APPEND_TO_NON_BOOKLET`).
  - Teste de isolamento por usuário.
- [x] 6.2 Escrever testes unitários no Frontend em `front/tests/unit/adapters/DidacticDocumentAdapter.spec.ts`:
  - Teste de instanciação via `BookDocumentFactory`.
  - Teste de cálculo de páginas e paginação.
  - Teste da camada de texto (`renderTextLayer`) e âncoras de grifos/anotações.
- [x] 6.3 Escrever testes de integração de API em `tests/integration/didactic.routes.spec.ts`.

## Fase 7: Quality Gates & Atualização da Base de Conhecimento
- [ ] 7.1 Executar os Quality Gates no Frontend (`npm run lint`, `npm run typecheck`, `npm run test`).
- [ ] 7.2 Executar os Quality Gates no Backend (`npm run build`, `npm run test`).
- [ ] 7.3 Atualizar a documentação em `docs/domain/books.md`, `docs/domain/reading.md`, `docs/domain/flashcards.md` e criar `docs/domain/didactic-booklets.md`.
- [ ] 7.4 Mover a spec para `specs/completed/didactic-explainer-books/`.
