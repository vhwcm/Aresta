---
name: invoke-specialists
description: >-
  Referência para o Lead Orchestrator sobre como invocar os 4 subagentes
  especializados (api-worker, web-worker, code-reviewer, security-auditor)
  com contexto mínimo e resultados estruturados.
---

# Invoke Specialists — Guia de Invocação de Subagentes Especializados

Esta skill documenta os **4 subagentes especializados** do projeto Aresta e como o Lead Orchestrator deve invocá-los seguindo os princípios de contexto mínimo, missão específica e resultados estruturados.

---

## 🎯 Princípio Fundamental: Quando Delegar vs. Resolver Inline

**Delegar para um specialist quando:**
- A tarefa envolve implementação de código em um domínio específico (backend OU frontend)
- A tarefa é média ou grande (múltiplos arquivos, lógica de negócio)
- A revisão requer expertise profunda (segurança, performance, arquitetura)

**Resolver inline (sem delegação) quando:**
- A tarefa é trivial (CSS fix, typo, config simples, 1-2 linhas)
- A tarefa cruza domínios de forma inseparável e pequena
- O contexto já está carregado na sessão atual

---

## 📋 Catálogo de Specialists

### 1. `api-worker` — Backend & Database

**Tipo**: Worker de execução (write tools ✅)
**Quando usar**: Implementação de endpoints, services, controllers, routes, schemas Zod, alterações no Prisma schema, migrations, testes backend.

**Template de invocação**:
```
invoke_subagent: api-worker
Prompt:
"## Tarefa: [Nome conciso]

### Objetivo
[Descrição clara e delimitada do que implementar]

### Contexto (arquivos para ler)
- `apps/api/src/modules/<modulo>/services/<service>.ts`
- `apps/api/src/modules/<modulo>/routes/<routes>.ts`
- `apps/api/prisma/schema.prisma` (se envolver modelo)

### Spec de referência (se existir)
- `specs/active/<feature>/design.md`

### Restrições
- Implementar SOMENTE no módulo `<modulo>`
- Seguir padrão de rotas existente
- Criar teste em `apps/api/tests/`
- Executar `npm --prefix apps/api test` ao final

### Critério de conclusão
- Endpoint funcionando conforme spec
- Teste passando com assertions significativas
- Retornar resumo estruturado via send_message"
```

---

### 2. `web-worker` — Frontend & UI

**Tipo**: Worker de execução (write tools ✅)
**Quando usar**: Implementação de componentes Vue, composables, pages, stores Pinia, adapters, estilização Tailwind, integração Tauri, testes frontend.

**Template de invocação**:
```
invoke_subagent: web-worker
Prompt:
"## Tarefa: [Nome conciso]

### Objetivo
[Descrição clara e delimitada do que implementar]

### Contexto (arquivos para ler)
- `apps/web/app/components/<area>/<componente>.vue`
- `apps/web/app/composables/<composable>.ts`
- `apps/web/app/pages/<page>.vue`

### Spec de referência (se existir)
- `specs/active/<feature>/design.md`

### Restrições
- Implementar SOMENTE em `apps/web/`
- Usar `<script setup lang="ts">` e Composition API
- Estilizar com Tailwind CSS
- Criar teste em `apps/web/tests/unit/`
- Executar `npm --prefix apps/web test` ao final

### Critério de conclusão
- Componente/page renderizando conforme spec
- Teste passando
- Retornar resumo estruturado via send_message"
```

---

### 3. `code-reviewer` — Revisão de Qualidade

**Tipo**: Revisor (read-only 📖)
**Quando usar**: Após workers concluírem implementação, antes do merge/commit final. Revisa qualidade, bugs, edge cases, aderência à spec e padrões arquiteturais.

**Template de invocação**:
```
invoke_subagent: code-reviewer
Prompt:
"## Revisão: [Nome da Feature/Tarefa]

### Arquivos para revisar
- `apps/api/src/modules/memory/services/search.service.ts`
- `apps/api/src/modules/memory/controllers/search.controller.ts`
- `apps/web/app/components/SearchResults.vue`

### Spec de referência
- `specs/active/<feature>/design.md`
- `specs/active/<feature>/requirements.md`

### Foco da revisão
- [x] Edge cases e null handling
- [x] Error handling e respostas de erro
- [x] Aderência à spec (design.md)
- [x] Performance (queries N+1, re-renders)
- [x] Padrões arquiteturais (camadas, adapters)
- [ ] Testes (opcional — marcar se quiser)

### Retornar
Relatório estruturado com findings por severidade e veredicto (approved / changes_requested)"
```

---

### 4. `security-auditor` — Auditoria de Segurança

**Tipo**: Auditor (read-only 📖)
**Quando usar**: Após implementação que envolve autenticação, autorização, handling de dados sensíveis, inputs do usuário ou novos endpoints expostos.

**Template de invocação**:
```
invoke_subagent: security-auditor
Prompt:
"## Auditoria de Segurança: [Escopo]

### Arquivos para auditar
- `apps/api/src/middlewares/auth.middleware.ts`
- `apps/api/src/modules/auth/services/auth.service.ts`
- `apps/api/src/modules/auth/providers/*.ts`
- `apps/api/src/config/env.ts`

### Foco da auditoria
- [x] JWT (validação, expiração, fallbacks)
- [x] OAuth (tokens, refresh, armazenamento)
- [x] Input validation (Zod schemas)
- [x] Autorização (isolamento de dados por usuário)
- [x] Secrets (hardcoded, logging)
- [ ] SQL injection em raw queries (se aplicável)

### Retornar
Relatório de segurança estruturado com CWE, OWASP, severidade e remediação"
```

---

## 🔄 Padrão de Execução: Planner → Workers → Reviewers

### Tarefas Médias (1 domínio)
```
Lead Agent
├── 1. Registra checklist [Fazendo]
├── 2. Invoca api-worker OU web-worker (1 worker)
├── 3. Aguarda resultado
├── 4. Invoca code-reviewer (se complexidade justificar)
├── 5. Consolida findings
├── 6. Quality Gates (run-quality-gates)
└── 7. Atualiza checklist [Concluído] + git-commit
```

### Tarefas Grandes (cross-domain)
```
Lead Agent
├── 1. Registra checklist [Fazendo]
├── 2. Cria TASKS.md com divisão
├── 3. Invoca api-worker E web-worker em PARALELO
├── 4. Aguarda ambos
├── 5. Invoca code-reviewer E security-auditor em PARALELO
├── 6. Consolida findings
│   ├── Se changes_requested → reenvia para worker corrigir
│   └── Se approved → prossegue
├── 7. Quality Gates (run-quality-gates)
└── 8. Atualiza checklist [Concluído] + validate-and-push
```

### Auditorias sob demanda
```
Lead Agent
├── 1. Invoca security-auditor com escopo específico
├── 2. Recebe relatório estruturado
├── 3. Se findings critical/high → invoca api-worker para remediar
└── 4. Re-audita se necessário
```

---

## ⚠️ Regras de Ouro

1. **Contexto mínimo**: Envie APENAS os arquivos relevantes no prompt. Nunca "analise todo o projeto".
2. **1 tarefa = 1 worker**: Não peça ao api-worker para fazer frontend. Cada worker tem seu domínio.
3. **Paralelismo consciente**: api-worker e web-worker podem rodar em paralelo quando as tarefas são independentes. Se web depende de uma API nova do api-worker, execute sequencialmente.
4. **Reviewers são opcionais para tarefas pequenas**: Não acione code-reviewer ou security-auditor para um CSS fix.
5. **Resultados estruturados**: Todos os specialists retornam relatórios padronizados — o Lead Agent consome como dado, não como texto livre.
6. **Workers nunca delegam**: Se um worker precisa de algo fora do seu escopo, ele retorna `status: blocked` e o Lead Agent resolve.
