# Tarefas de Implementação: Refatoração de Temas, Anotações e Grafo de Conhecimento

## Checklist de Execução Sequencial

- [ ] **1. Banco de Dados & Persistência (Prisma / SQLite)**
  - [ ] 1.1 Atualizar `prisma/schema.prisma` com catálogo global de `Theme`, `ThemeHierarchy`, `BookPublicInfo`, `BookTheme` e `Annotation` (`cfi` nullable).
  - [ ] 1.2 Executar migração do Prisma (`npx prisma db push` ou migration) e regenerar Prisma Client.
  - [ ] 1.3 Atualizar seed (`prisma/seed.ts`) com temas globais e hierarquias de exemplo.

- [ ] **2. Microserviço Go (IA, Web Grounding & Embeddings)**
  - [ ] 2.1 Definir / atualizar proto gRPC (`proto/ai/v1/ai.proto`) com `AnalyzeBook`.
  - [ ] 2.2 Gerar stubs Go e TypeScript a partir do Protobuf.
  - [ ] 2.3 Implementar adaptador Gemini com Google Search Grounding e Embeddings no Go.
  - [ ] 2.4 Implementar lógica de similaridade de cosseno e geração de subtemas hierárquicos no Go.
  - [ ] 2.5 Registrar handler gRPC no servidor Go e adicionar testes unitários no Go.

- [ ] **3. Backend Node.js (Serviços, Controladores e Schemas)**
  - [ ] 3.1 Criar cliente gRPC para `AIService` no Node.js.
  - [ ] 3.2 Atualizar `src/schemas/book.schema.ts`, `src/schemas/annotation.schema.ts` e `src/schemas/graph.schema.ts`.
  - [ ] 3.3 Implementar `bookService.adminUpload` com extração de capa, gravação no banco e enriquecimento assíncrono via Go.
  - [ ] 3.4 Atualizar `annotationService` para suportar anotações soltas e validar que temas pertencem ao livro.
  - [ ] 3.5 Atualizar `graphService` para retornar nós de temas e nós de livros com conexões e tipos.
  - [ ] 3.6 Criar middleware / verificação de permissão `adminMiddleware` para rotas de upload público.
  - [ ] 3.7 Implementar controllers e rotas com anotações Swagger.
  - [ ] 3.8 Criar e rodar testes de integração com Vitest e Supertest no backend.

- [ ] **4. Frontend (Nuxt 4 / Vue 3 + D3.js)**
  - [ ] 4.1 Criar composable/store de administração para upload de livros (`useAdminBooks`).
  - [ ] 4.2 Criar página de administração `/admin/upload` (ou modal de Viktor) com título, autor e dropzone.
  - [ ] 4.3 Atualizar `useGraph` e interfaces (`interfaces/graph.ts`) para suportar nós de livros e temas.
  - [ ] 4.4 Atualizar `GraphCanvas.vue` para renderizar nós de livros (capa + título truncado em 10 caracteres com `'...'`) e nós de temas.
  - [ ] 4.5 Implementar componente `ThemeCanvasOverlay.vue` (carrossel horizontal de livros no topo + lista de anotações abaixo).
  - [ ] 4.6 Implementar componente `BookAnnotationsDrawer.vue` (listagem de anotações + criação de anotação solta).
  - [ ] 4.7 Conectar interações de clique na página `grafo.vue` (abertura do overlay de tema vs drawer de livro).
  - [ ] 4.8 Criar testes unitários no frontend com Vitest.

- [ ] **5. Revisão de Consistência & Atualização da Documentação**
  - [ ] 5.1 Executar a skill `review-consistency` para auditar integridade de código, docs e diagramas.
  - [ ] 5.2 Atualizar documentação em `docs/domain/`, `docs/architecture/` e `docs/decisions/` (ADRs).
  - [ ] 5.3 Mover spec para `specs/completed/` ao finalizar.
