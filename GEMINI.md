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
3. Implementar mudanças no código e testes.
4. Validar Quality Gates (`npm test` e `npm run build`).
5. Mover para "Done" no `checklist.md` e realizar commit atômico.

### 🔴 Tarefas Grandes
1. Registrar a tarefa em `checklist.md` na seção "In Progress" com checklist de passos.
2. Planejar especificação técnica detalhada.
3. Executar alterações em `apps/api` e `apps/web`.
4. Validar Quality Gates 100% verdes.
5. Mover para "Done" no `checklist.md` e realizar commit atômico.

---

## 3. Regras Inegociáveis

### 3.1. Verificação Obrigatória de Quality Gates
**SEMPRE**, antes de finalizar qualquer tarefa, responder ao usuário confirmando a conclusão de um trabalho, ou realizar qualquer `git commit` / `git push`, é **MANDATÓRIO** executar e validar que todos os Quality Gates estão 100% passando (verde):

- `npm run test:api`
- `npm run test:web`
- `npm run build:api`
- `npm run build:web`

### 3.2. Rastreamento Obrigatório em `checklist.md`
É **MANDATÓRIO** manter o arquivo `checklist.md` na raiz sempre atualizado com **todas** as tarefas:
- **Formato de 1 linha por tarefa**: `- [DD/MM/AAAA HH:MM] [Status] Descrição resumida da tarefa`.
- **Status em uma palavra**: `[Fazendo]` (em `## 🔄 Em Andamento`) e `[Concluído]` (em `## ✅ Concluído`).
- **Sem visão geral**: Não incluir blocos de estatísticas ou tabelas de métricas.
- **Histórico cumulativo**: Jamais apagar itens concluídos, mantendo a integridade do contexto do usuário.

### 3.3. Central Lead Orchestrator vs Worker
- A **sessão raiz** opera como a Central de Comando (Ponto Único de Contato com o usuário). Decompõe metas em tarefas atômicas, instancia subagentes em background e reporta sínteses limpas em formato de checklist no chat central.
- Os **subagentes** de background operam como workers executores especializados, nunca delegando nem alterando o `checklist.md` geral da raiz. Retornam resumos estruturados ao orquestrador pai.



