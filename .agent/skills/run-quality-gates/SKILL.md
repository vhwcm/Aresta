---
name: run-quality-gates
description: >-
  Executa, valida e orienta a correção de todos os Quality Gates do projeto Aresta
  (Frontend ESLint, Typecheck e Vitest; Backend Build, Prisma Seed e Vitest).
  Garante que nenhum commit seja realizado com quality gates falhando.
---

# Run & Fix Quality Gates Workflow

Esta skill deve ser executada obrigatoriamente antes de realizar commits ou finalizar tarefas no projeto **Aresta**. Ela assegura que 100% dos linters, verificadores de tipo estático, compilações e testes automatizados passem com sucesso.

---

## 🚫 Regra Inegociável: Bloqueio de Commits
**NUNCA** realize `git commit` ou `git push` se qualquer um dos Quality Gates estiver falhando. Se um comando retornar código diferente de zero ou reportar erros, corrija a causa raiz imediatamente antes de prosseguir.

---

## 📋 Checklist de Quality Gates

### 1. Frontend (`/front`)
Execute os comandos dentro da pasta `front/`:

1. **Linter (ESLint)**:
   ```bash
   cd front && npm run lint
   ```
   - *Verifica*: regras de ESLint, formatação, imports não utilizados e limites de complexidade/tamanho.
   - *Ignorados*: `src-tauri/**`, `dist/**`, `.nuxt/**`, `.output/**`.

2. **Tipagem Estática (vue-tsc / Nuxt Typecheck)**:
   ```bash
   cd front && npm run typecheck
   ```
   - *Verifica*: TypeScript estrito em componentes `.vue`, composables, stores e adapters.

3. **Testes Unitários & Integração (Vitest)**:
   ```bash
   cd front && npm run test
   ```
   - *Verifica*: 100% dos testes unitários de composables, stores e renderizadores do front.

---

### 2. Backend (`/aresta-back-node`)
Execute os comandos dentro da pasta `aresta-back-node/`:

1. **Build & Compilação TypeScript (Prisma + TSC)**:
   ```bash
   cd aresta-back-node && npm run build
   ```
   - *Verifica*: Geração do Prisma Client e compilação do TypeScript sem erros.

2. **Testes Automatizados (Vitest)**:
   ```bash
   cd aresta-back-node && npm run test
   ```
   - *Verifica*: 100% das rotas de API, autenticação, canvas, grafo, sincronização, flashcards, streaks e anotações.

---

## 🛠️ Guia de Resolução Rápida de Erros Frequentes

### 1. Backend: Erro de chave duplicada Prisma (`P2002: Unique constraint failed on the fields: ('id')`)
- **Causa**: Inserção manual de IDs fixos em sementes de banco (seed) sem atualizar o contador das *sequences* do PostgreSQL.
- **Solução**: Executar `npm run prisma:seed` que sincroniza as sequences (`setval`) em `src/services/seed.service.ts`.

### 2. Frontend: Erros de ESLint em arquivos gerados ou binários
- **Causa**: ESLint varrendo pastas de build (`src-tauri/target`, `.nuxt`).
- **Solução**: Certificar-se de que os caminhos estão listados em `front/.eslintignore` e `ignorePatterns` em `front/.eslintrc.cjs`.

### 3. Frontend: Tipagem estrita com `vue-tsc`
- **Causa**: Arrays que podem conter `undefined` sob `noUncheckedIndexedAccess`, ou unions `string | number`.
- **Solução**: Usar `(arr[0] ?? fallback)` e conversões seguras com `Number(...)`.

---

## 🔄 Fluxo de Execução Recomendado

```
                   ┌─────────────────────────────┐
                   │  Alterações Implementadas   │
                   └──────────────┬──────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │  1. Frontend: npm run lint  │ ──(Falhou)──► Corrigir ESLint
                   └──────────────┬──────────────┘
                                  │ (OK)
                   ┌──────────────▼──────────────┐
                   │ 2. Frontend: typecheck      │ ──(Falhou)──► Corrigir Tipos TS
                   └──────────────┬──────────────┘
                                  │ (OK)
                   ┌──────────────▼──────────────┐
                   │ 3. Frontend: npm run test   │ ──(Falhou)──► Corrigir Testes Front
                   └──────────────┬──────────────┘
                                  │ (OK)
                   ┌──────────────▼──────────────┐
                   │ 4. Backend: npm run build   │ ──(Falhou)──► Corrigir Build Node/TS
                   └──────────────┬──────────────┘
                                  │ (OK)
                   ┌──────────────▼──────────────┐
                   │ 5. Backend: npm run test    │ ──(Falhou)──► Corrigir Testes Back
                   └──────────────┬──────────────┘
                                  │ (100% OK)
                   ┌──────────────▼──────────────┐
                   │      git add & commit       │
                   └─────────────────────────────┘
```
