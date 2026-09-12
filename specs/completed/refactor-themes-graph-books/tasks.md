# Tarefas de Implementação: Refatoração de Temas, Anotações e Grafo de Conhecimento

## Checklist de Execução Sequencial

- [x] **1. Banco de Dados & Persistência (Prisma / SQLite)**
  - [x] 1.1 Atualizar `prisma/schema.prisma` com catálogo global de `Theme`, `ThemeHierarchy`, `BookPublicInfo`, `BookTheme` e `Annotation` (`cfi` nullable).
  - [x] 1.2 Executar migração do Prisma (`npx prisma db push`) e regenerar Prisma Client.
  - [x] 1.3 Atualizar seed (`prisma/seed.ts`) com temas globais e hierarquias de exemplo.

- [ ] **2. [REMOVIDO DO ESCOPO] Microserviço Go (IA AnalyzeBook, Web Grounding & Embeddings)**
  - [x] *Decisão*: Enriquecimento automático de livros por IA via AnalyzeBook removido do escopo. Temas são vinculados diretamente e com curadoria pelo usuário/admin.

- [x] **3. Backend Node.js (Serviços, Controladores e Schemas)**
  - [x] 3.1 Schemas e modelos de livros e anotações.
  - [x] 3.2 Atualizar schemas de livros, anotações e grafo.
  - [x] 3.3 Implementar cadastro de livros com extração de capa e gravação no banco.
  - [x] 3.4 Atualizar `annotationService` para suportar anotações soltas e validar que temas pertencem ao livro.
  - [x] 3.5 Atualizar `graphService` para retornar nós de temas e nós de livros com conexões e tipos.
  - [x] 3.6 Criar middleware / verificação de permissão `adminMiddleware` para rotas de upload público.
  - [x] 3.7 Implementar controllers e rotas.
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
