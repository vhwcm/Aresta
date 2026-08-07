---
title: 'Quality Gates'
description: 'Garantia de Qualidade de Código (Pre-commit, ESLint, Checkstyle e CI)'
---

## Quality Gates do Repositório

O projeto utiliza um sistema robusto de **Quality Gates** para garantir a consistência e qualidade do código fonte, controlando o tamanho de classes, métodos e a identação profunda.

### Arquitetura de Validação

Os Quality Gates rodam em duas frentes:
1. **Localmente (Git Hooks)** gerenciados pela ferramenta Python `pre-commit`.
2. **Nuvem (GitHub Actions)** validando cada commit/Pull Request na branch principal.

---

### Verificações em Commit (Pre-commit)

Rodam de forma extremamente rápida a cada commit local:
- **Sanitização Básica**: trailing whitespaces, fim de arquivo (EOF), checagem de integridade do JSON/YAML.
- **Frontend (ESLint)**:
  - Tamanho máximo de arquivo/classe: **350 linhas**.
  - Tamanho máximo de método/função: **80 linhas** (com exceções para arquivos de teste e composables complexos).
  - Profundidade máxima de identação/nesting: **4 níveis**.
  - Tamanho máximo de linha: **160 caracteres** (ignorado nos templates `.vue`).
- **Backend (Checkstyle)**:
  - Tamanho máximo de classe: **350 linhas** (`FileLength`).
  - Tamanho máximo de método: **60 linhas** (`MethodLength`).
  - Profundidade máxima de identação/nesting: **4 níveis** (`NestedIfDepth`, `NestedForDepth`, `NestedTryDepth`).
  - Tamanho máximo de linha: **160 caracteres** (`LineLength`).

### Verificações em Push (Pre-push)

Rodam antes de enviar o código para o servidor remoto:
- **Frontend**: Typecheck e execução dos testes unitários com Vitest (`npm run test`).
- **Backend**: Execução dos testes unitários Gradle (`./gradlew test`).

---

### Comandos Úteis

#### Configuração Inicial dos Hooks
```bash
npm run setup:hooks
```

#### Rodar todas as validações manualmente
```bash
npx pre-commit run --all-files
```

#### Pular validações em commits específicos (apenas emergências)
```bash
git commit -m "commit message" --no-verify
```
