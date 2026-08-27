# Tarefas de Implementação: Refatoração de Temas, Anotações e Grafo de Conhecimento

## Checklist de Execução Sequencial

- [x] **1. Banco de Dados & Persistência (Prisma / SQLite)**
  - [x] 1.1 Atualizar `prisma/schema.prisma` com catálogo global de `Theme`, `ThemeHierarchy`, `BookPublicInfo`, `BookTheme` e `Annotation` (`cfi` nullable).
  - [x] 1.2 Executar migração do Prisma (`npx prisma db push`) e regenerar Prisma Client.
  - [x] 1.3 Atualizar seed (`prisma/seed.ts`) com temas globais e hierarquias de exemplo.

- [x] **2. Microserviço Go (IA, Web Grounding & Embeddings)**
  - [x] 2.1 Definir / atualizar proto gRPC (`proto/ai/v1/ai.proto`) com `AnalyzeBook`.
  - [x] 2.2 Gerar stubs Go e TypeScript a partir do Protobuf.
  - [x] 2.3 Implementar adaptador Gemini com Google Search Grounding e Embeddings no Go.
  - [x] 2.4 Implementar lógica de similaridade de cosseno e geração de subtemas hierárquicos no Go.
  - [x] 2.5 Registrar handler gRPC no servidor Go e adicionar testes unitários no Go.

- [x] **3. Backend Node.js (Serviços, Controladores e Schemas)**
  - [x] 3.1 Criar cliente gRPC para `AIService` no Node.js.
  - [x] 3.2 Atualizar `src/schemas/book.schema.ts`, `src/schemas/annotation.schema.ts` e `src/schemas/graph.schema.ts`.
  - [x] 3.3 Implementar `bookService.adminUpload` com extração de capa, gravação no banco e enriquecimento assíncrono via Go.
  - [x] 3.4 Atualizar `annotationService` para suportar anotações soltas e validar que temas pertencem ao livro.
  - [x] 3.5 Atualizar `graphService` para retornar nós de temas e nós de livros com conexões e tipos.
  - [x] 3.6 Criar middleware / verificação de permissão `adminMiddleware` para rotas de upload público.
  - [x] 3.7 Implementar controllers e rotas com anotações Swagger.
  - [x] 3.8 Criar e rodar testes de integração com Vitest e Supertest no backend.

- [x] **4. Frontend (Nuxt 4 / Vue 3 + D3.js)**
  - [x] 4.1 Criar composable/store de administração para upload de livros (`useAdminBooks`).
  - [x] 4.2 Criar página de administração `/admin/upload` com título, autor e dropzone.
  - [x] 4.3 Atualizar `useGraph` e interfaces (`interfaces/graph.ts`) para suportar nós de livros e temas.
  - [x] 4.4 Atualizar `GraphCanvas.vue` para renderizar nós de livros (capa + título truncado em 10 caracteres com `'...'`) e nós de temas.
  - [x] 4.5 Implementar componente `ThemeCanvasOverlay.vue` (carrossel horizontal de livros no topo + lista de anotações abaixo).
  - [x] 4.6 Implementar componente `BookAnnotationsDrawer.vue` (listagem de anotações + criação de anotação solta).
  - [x] 4.7 Conectar interações de clique na página `grafo.vue` (abertura do overlay de tema vs drawer de livro).
  - [x] 4.8 Criar testes unitários no frontend com Vitest.

- [x] **5. Revisão de Consistência & Atualização da Documentação**
  - [x] 5.1 Executar a skill `review-consistency` para auditar integridade de código, docs e diagramas.
  - [x] 5.2 Atualizar documentação em `docs/domain/`, `docs/architecture/` e `docs/decisions/` (ADRs).
  - [x] 5.3 Mover spec para `specs/completed/` ao finalizar.
