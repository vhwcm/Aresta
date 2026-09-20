# Guia: Suíte de Testes & Qualidade

Este guia apresenta a estratégia de testes do Aresta, comandos de execução e critérios de cobertura para o Frontend (`apps/web`) e Backend (`apps/api`).

---

## 1. Visão Geral das Camadas de Teste

| Módulo | Tipo de Teste | Ferramenta | Localização |
| :--- | :--- | :--- | :--- |
| **Backend (`apps/api`)** | Integração & API Express | Vitest + Axios / Supertest | `apps/api/tests/` |
| **Frontend (`apps/web`)** | Unitário & Componentes Vue/Nuxt | Vitest + @vue/test-utils | `apps/web/tests/` |
| **Frontend (`apps/web`)** | Adapters e Sincronização Local-First | Vitest | `apps/web/tests/unit/adapters/`, `apps/web/tests/unit/services/` |

---

## 2. Executando os Testes

### Testes do Backend (`apps/api`):
```bash
cd apps/api

# Executar todos os testes
npm test

# Executar em modo watch (reexecuta ao salvar arquivos)
npm run test:watch

# Build e validação estática de tipos (Prisma generate + tsc)
npm run build
```

### Testes e Quality Gates do Frontend (`apps/web`):
```bash
cd apps/web

# Executar testes unitários Vitest
npm test

# Checagem estática de tipos TypeScript (Nuxt Typecheck)
npm run typecheck

# Executar linter ESLint
npm run lint
```

---

## 3. Diretrizes para Novos Testes
1. **Novos Endpoints**: Devem ter cobertura de cenários felizes (200/201) e cenários de erro (400 Zod validation, 401 Unauthorized, 404 Not Found).
2. **Novos Composables/Adapters**: Devem possuir testes validando retornos, tratamento de exceções e persistência local-first resiliente (Dexie/SQLite fallback).
