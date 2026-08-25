# Tarefas de Implementação: [Nome da Feature]

## Checklist de Execução

- [ ] **1. Persistência & Schemas**
  - [ ] 1.1 Atualizar `prisma/schema.prisma` e gerar migração/client
  - [ ] 1.2 Criar schemas de validação Zod em `src/schemas/`

- [ ] **2. Serviços & Regras de Negócio (Backend)**
  - [ ] 2.1 Implementar service em `src/services/`
  - [ ] 2.2 Implementar controller em `src/controllers/`
  - [ ] 2.3 Registrar rotas com Swagger annotations em `src/routes/`

- [ ] **3. Testes do Backend**
  - [ ] 3.1 Criar testes de integração com Vitest e Supertest
  - [ ] 3.2 Executar `npm test` em `aresta-back-node/`

- [ ] **4. Frontend (Nuxt 4 / Vue 3)**
  - [ ] 4.1 Criar/atualizar composables ou Pinia store em `front/app/`
  - [ ] 4.2 Criar componentes Vue e integrar na página correspondente
  - [ ] 4.3 Criar testes unitários no frontend (`npm test`)

- [ ] **5. Documentação & Revisão**
  - [ ] 5.1 Atualizar documentação em `docs/domain/` ou `docs/architecture/`
  - [ ] 5.2 Executar a skill `review-consistency`
  - [ ] 5.3 Mover spec para `specs/completed/`
