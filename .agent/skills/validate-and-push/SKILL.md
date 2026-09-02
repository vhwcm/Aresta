---
name: validate-and-push
description: >-
  Executa a esteira obrigatoria de validacao (Quality Gates, sincronizacao de package-lock.json,
  ESLint, Typecheck e Vitest) e realiza o commit atomico seguido de git push para o repositorio remoto.
---

# Validate & Push Workflow

Esta skill define o procedimento padronizado e obrigatorio de finalizacao e publicacao de alteracoes no repositorio.

---

## Objetivo

Garantir que:
1. **Nenhum commit/push ocorra com quality gates quebrados ou lockfiles dessincronizados**.
2. **Assegurar paridade estrita de `package.json` e `package-lock.json`**, prevenindo falhas de `npm ci` no CI/CD do GitHub Actions.
3. **Realizar commits atomicos descritivos** (Conventional Commits) e enviar automaticamente as alteracoes com `git push`.

---

## Fluxo Sequencial de Execucao

```
 ┌────────────────────────┐
 │ 1. Sincronizar Lock    │ ──► `npm install` (se houver alteracao em package.json)
 └───────────┬────────────┘
             │
 ┌───────────▼────────────┐
 │ 2. Run Quality Gates   │ ──► Lint, Typecheck, Build, Vitest
 └───────────┬────────────┘
             │ (100% OK)
 ┌───────────▼────────────┐
 │ 3. Git Status & Diff   │ ──► Inspecionar arquivos staged / unstaged
 └───────────┬────────────┘
             │
 ┌───────────▼────────────┐
 │ 4. Commits Atomicos    │ ──► `git add <files>` && `git commit -m "<tipo>(<escopo>): <desc>"`
 └───────────┬────────────┘
             │
 ┌───────────▼────────────┐
 │ 5. Git Push            │ ──► `git push origin <branch>`
 └────────────────────────┘
```

---

## Etapas Detalhadas

### 1. Sincronizacao e Validacao de Lockfiles (`npm ci`)
- Se qualquer dependencia ou script foi alterado em `package.json` (raiz, `front/` ou `aresta-back-node/`), execute `npm install` na pasta correspondente.
- Teste a integridade rodando `npm ci` para certificar-se de que a esteira de CI/CD nao falhara por `EUSAGE`.

### 2. Execucao dos Quality Gates
Execute todos os passos da skill `run-quality-gates`:
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test`
- Backend: `npm run build`

### 3. Agrupamento em Commits Atomicos
- Isole mudancas logicas por escopo:
  - `fix(deps): ...` para lockfiles e dependencias
  - `feat(<modulo>): ...` para novas funcionalidades
  - `fix(<modulo>): ...` para correcoes de bugs
  - `refactor(<modulo>): ...` para refatoracoes
  - `test(<modulo>): ...` para novos testes
  - `docs(<modulo>): ...` para documentacao

### 4. Git Push
- Apos a conclusao de todos os commits locais, realize o push para o remote:
  ```bash
  git push
  ```
- Confirme que a branch local e remota estao em sincronia.
