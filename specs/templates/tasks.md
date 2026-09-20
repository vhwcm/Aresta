# Tarefas de Implementação: [Nome da Feature]

## Checklist de Execução

- [ ] **1. Persistência & Schemas**
  - [ ] 1.1 Atualizar `apps/api/prisma/schema.prisma` e versionar migration SQL (`npx prisma migrate dev`)
  - [ ] 1.2 Criar schemas de validação Zod no módulo correspondente (`apps/api/src/modules/*/schemas/`)

- [ ] **2. Serviços & Regras de Negócio (Backend)**
  - [ ] 2.1 Implementar service em `apps/api/src/modules/*/services/`
  - [ ] 2.2 Implementar controller em `apps/api/src/modules/*/controllers/`
  - [ ] 2.3 Registrar rotas em `apps/api/src/modules/*/routes/`

- [ ] **3. Testes do Backend**
  - [ ] 3.1 Criar testes de integração com Vitest
  - [ ] 3.2 Executar `npm test` em `apps/api/`

- [ ] **4. Frontend (Nuxt 3 / Vue 3 / Tauri v2)**
  - [ ] 4.1 Criar/atualizar composables, stores ou repositórios em `apps/web/app/`
  - [ ] 4.2 Criar componentes Vue e integrar na página correspondente
  - [ ] 4.3 Criar testes unitários no frontend (`npm test` em `apps/web/`)

- [ ] **5. Documentação & Revisão**
  - [ ] 5.1 Atualizar documentação em `docs/domain/` ou `docs/architecture/`
  - [ ] 5.2 Executar a skill `review-consistency`
  - [ ] 5.3 Mover spec para `specs/completed/`
