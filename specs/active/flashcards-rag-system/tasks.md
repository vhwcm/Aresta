# Tarefas de Implementação: Sistema de Flashcards com RAG e Repetição Espaçada

## Checklist de Execução

- [ ] **1. Persistência & Schemas**
  - [ ] 1.1 Atualizar `aresta-back-node/prisma/schema.prisma` adicionando campo `embedding` em `Annotation` e novos modelos `Flashcard` e `DailyDeckCard`
  - [ ] 1.2 Executar `npx prisma db push` e `npx prisma generate` em `aresta-back-node/`
  - [ ] 1.3 Criar schemas Zod em `aresta-back-node/src/schemas/flashcard.schema.ts`

- [ ] **2. Protobuf & Microsserviço de IA (Go)**
  - [ ] 2.1 Atualizar `proto/ai/v1/ai.proto` em `aresta-ocr/` e `aresta-back-node/` com `GenerateEmbedding` e `GenerateFlashcard`
  - [ ] 2.2 Recompilar stubs gRPC em Go (`protoc`)
  - [ ] 2.3 Implementar `GenerateEmbedding` e `GenerateFlashcard` com o prompt especializado de 3 arquétipos (Situação Real, Relembração, União de Conceitos) no adapter Gemini do Go
  - [ ] 2.4 Atualizar `AIClient` no Node.js (`src/services/ai.client.ts`) para expor os novos métodos gRPC com fallback local caso o gRPC esteja offline

- [ ] **3. Serviços de Domínio & RAG no Backend (Node.js)**
  - [ ] 3.1 Implementar `FlashcardRAGService` com cosine similarity local para recuperar vizinhos de anotações
  - [ ] 3.2 Implementar `FlashcardService` com geração incremental 1:1, seleção de deck diário (50 cards) e repetição espaçada
  - [ ] 3.3 Implementar `FlashcardSchedulerService` (`node-cron`) com jobs às 22:00 (geração) e 00:00 (deck diário)
  - [ ] 3.4 Integrar avaliação de flashcards ao `StreakService` para atualizar `flashcards_reviewed`
  - [ ] 3.5 Atualizar `AnnotationService` para gerar/armazenar embeddings ao criar anotações

- [ ] **4. Controllers, Rotas & Documentação Swagger**
  - [ ] 4.1 Criar `FlashcardController` em `src/controllers/flashcard.controller.ts`
  - [ ] 4.2 Criar `FlashcardRoutes` em `src/routes/flashcard.routes.ts` com anotações JSDoc/Swagger
  - [ ] 4.3 Registrar as novas rotas em `src/config/routes.ts`

- [ ] **5. Testes Automatizados no Backend**
  - [ ] 5.1 Criar testes de integração em `aresta-back-node/tests/flashcard.test.ts`
  - [ ] 5.2 Executar suíte de testes com Vitest (`npm test`)

- [ ] **6. Frontend (Nuxt 4 / Vue 3)**
  - [ ] 6.1 Criar composable `front/app/composables/useFlashcards.ts` conectado aos endpoints de deck diário e review
  - [ ] 6.2 Integrar o 1º flashcard do dia na Home (`front/app/pages/index.vue`)
  - [ ] 6.3 Atualizar `front/app/pages/revisao.vue` para consumir o deck diário de 50 cards com autoavaliação e feedback de ofensiva
  - [ ] 6.4 Validar build e testes do frontend

- [ ] **7. Documentação & Finalização Kiro**
  - [ ] 7.1 Atualizar `docs/domain/flashcards.md` e `docs/architecture/diagrams/`
  - [ ] 7.2 Executar skill `review-consistency` para auditoria geral
  - [ ] 7.3 Mover spec para `specs/completed/flashcards-rag-system/`
