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

## Regra Inegociável de Quality Gates
É **MANDATÓRIO** e **INEGOCIÁVEL** verificar e garantir que todos os Quality Gates estejam passando (100% verde) antes de concluir qualquer tarefa ou realizar qualquer commit/push:

```bash
# Validação de testes de todo o monólito
npm test

# Validação individual por aplicação:
# apps/api: npm --prefix apps/api run build && npm --prefix apps/api test
# apps/web: npm --prefix apps/web run typecheck && npm --prefix apps/web test
```

## Regra Inegociável de Rastreamento no Checklist (`checklist.md`)
É **MANDATÓRIO** e **INEGOCIÁVEL** registrar e manter atualizado o arquivo `checklist.md` na raiz do projeto para **TODAS** as tarefas solicitadas pelo usuário:
1. **Formato Resumido Obrigatório**: Exatamente 1 linha por tarefa, status de uma palavra, com data e hora:
   `- [DD/MM/AAAA HH:MM] [Fazendo] Descrição concisa da tarefa` (em `## 🔄 Em Andamento`)
   `- [DD/MM/AAAA HH:MM] [Concluído] Descrição concisa da tarefa` (em `## ✅ Concluído`)
2. **Sem Visão Geral**: Não adicionar tabelas de métricas ou introduções.
3. **Preservação de Contexto**: NUNCA apagar tarefas concluídas. O histórico deve ser sempre cumulativo.


