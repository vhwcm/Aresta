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
- Sempre registrar o que está sendo feito (Doing/In Progress) no início da solicitação.
- Marcar o progresso das etapas.
- Mover para concluído (Done) ao finalizar e validar Quality Gates.
- Jamais apagar itens concluídos, mantendo a integridade do contexto do usuário.

