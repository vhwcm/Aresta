# Aresta Monolith — Orchestrator & Quality Gates

Plataforma unificada de leitura ativa, síntese de conhecimento, mapas mentais e inteligência artificial.

## Estrutura do Monólito
- `apps/web/` — Frontend Nuxt 3 & Tauri v2 (:3000)
- `apps/api/` — Backend Express Modular & Prisma (:3001)
  - `src/modules/auth/`
  - `src/modules/reader/`
  - `src/modules/canvas/`
  - `src/modules/memory/`
  - `src/modules/ai/`
- Banco de dados PostgreSQL 16 com extensão `pgvector` (:5432)
# Diretrizes do Monólito Aresta & Manual do Agente (Modelo Mental Kiro)

Este projeto adota o **modelo mental do Kiro**, onde o conhecimento estruturado, especificações técnicas, observabilidade e diagramação visual guiam todo o ciclo de vida do desenvolvimento.

---

## 1. Arquitetura do Monólito Modular

- **Backend (`apps/api`)**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL 16 com `pgvector`.
- **Frontend (`apps/web`)**: Nuxt 3, Vue 3, Pinia, Tailwind CSS, Three.js (virada de página 3D), Foliate.js, Tauri v2.
- Banco de dados único e compartilhado com chaves estrangeiras reais.

---

## 2. Fluxo de Desenvolvimento

### 🟢 Tarefas Pequenas
1. Registrar a tarefa em `checklist.md` na seção "In Progress".
2. Inspecionar o módulo relevante.
3. Implementar a alteração.
4. Rodar os Quality Gates (`npm test`).
5. Mover para "Done" no `checklist.md` e realizar commit atômico.

### 🟡 Tarefas Médias
1. Registrar a tarefa em `checklist.md` na seção "In Progress" com checklist de passos.
2. Consultar contratos de rotas e schema Prisma.
3. Fazer TDD.
4. Implementar mudanças no código e testes.
5. Validar Quality Gates (`npm test` e `npm run build`).
6. Documentar o que foi feito na pasta correta. Criar um novo ou atualizar uma já existente. 
7. Mover para "Done" no `checklist.md` e realizar commit atômico.
8. Faça perguntas técnicas profundas ao usuário para ver se ele entendeu o que foi feito.

### 🔴 Tarefas Grandes
1. Registrar a tarefa em `checklist.md` na seção "In Progress" com checklist de passos. 
2. Planejar especificação técnica detalhada pensando em TDD e usar a skill grill-me.
3. Executar alterações em `apps/api` e `apps/web`.
4. Validar Quality Gates 100% verdes.
5. Documentar o que foi feito na pasta correta. Criar um novo ou atualizar uma já existente. E criar uma ADR
6. Mover para "Done" no `checklist.md` e realizar commit atômico.
7. Faça perguntas técnicas profundas ao usuário para ver se ele entendeu o que foi feito.

---

## 3. Regras Inegociáveis

### 3.1. Rastreamento Obrigatório em `checklist.md`
É **MANDATÓRIO** manter o arquivo `checklist.md` na raiz sempre atualizado com **todas** as tarefas:
- **Formato de 1 linha por tarefa**: `- [DD/MM/AAAA HH:MM] [Status] Descrição resumida da tarefa`.
- **Status em uma palavra**: `[Fazendo]` (em `## 🔄 Em Andamento`) e `[Concluído]` (em `## ✅ Concluído`).
- **Sem visão geral**: Não incluir blocos de estatísticas ou tabelas de métricas.
- **Histórico cumulativo**: Jamais apagar itens concluídos, mantendo a integridade do contexto do usuário.

### 3.2. Versionamento Obrigatório de Migrations Prisma
Toda alteração em `apps/api/prisma/schema.prisma` **EXIGE OBRIGATORIAMENTE** a geração e versionamento da migration SQL correspondente em `apps/api/prisma/migrations/`:
- O container em produção executa `npx prisma migrate deploy` na inicialização, que apenas aplica arquivos `.sql` existentes.
- Qualquer alteração de schema sem migration SQL quebra o ambiente de produção/deploy.
- Consultar detalhes e fluxo completo em [.agent/rules/database-migrations.md](file:///c:/Users/vichw/Aresta/.agent/rules/database-migrations.md).





