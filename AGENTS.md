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
1. **Entrada de Tarefa**: Toda nova solicitação do usuário deve ser inserida imediatamente na seção `🔄 O Que Está Sendo Feito Agora (In Progress / Doing)` com subtarefas decompostas.
2. **Atualização**: Marcar `[x]` conforme o avanço.
3. **Conclusão**: Ao finalizar a entrega e validar os Quality Gates, mover a tarefa para `✅ O Que Já Foi Feito (Done / Concluído)`.
4. **Preservação de Contexto**: NUNCA apagar tarefas concluídas. O histórico cumulativo deve ser sempre preservado.

