# Infraestrutura, Portas e CI/CD

Este documento descreve o ambiente de execução local, orquestração de scripts e os Quality Gates automatizados no CI/CD do monólito Aresta.

---

## 1. Portas e Serviços do Monólito

| Serviço | Aplicação | Porta Padrão | Endpoint Principal / Documentação |
| :--- | :--- | :--- | :--- |
| **Frontend Nuxt 3 / Tauri** | `apps/web` | `3000` | [http://localhost:3000](http://localhost:3000) |
| **Backend Express API** | `apps/api` | `3001` | [http://localhost:3001/api](http://localhost:3001/api) |
| **Swagger UI** | `apps/api` | `3001` | [http://localhost:3001/api-docs](http://localhost:3001/api-docs) |
| **Backend Healthcheck** | `apps/api` | `3001` | [http://localhost:3001/api/health](http://localhost:3001/api/health) |
| **Banco PostgreSQL 16 + pgvector** | `docker (aresta-db)` | `5432` | `postgresql://aresta:aresta@localhost:5432/aresta` |
| **OCR gRPC Service** | `aresta-ocr` | `50051` | `localhost:50051` |

---

## 2. Quality Gates e Automação (CI/CD)

O pipeline do GitHub Actions valida rigorosamente todas as alterações antes de qualquer merge:

```text
                       Git Push / Pull Request
                                  │
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │ GitHub Actions: Quality Gates Pipeline           │
        │                                                  │
        │ 1. apps/web Quality Gates:                       │
        │    - ESLint / Code Style                         │
        │    - Typecheck (vue-tsc / nuxt typecheck)        │
        │    - Vitest Unit Tests                           │
        │                                                  │
        │ 2. apps/api Quality Gates:                       │
        │    - Build (tsc + Prisma generate)               │
        │    - Vitest Unit & Integration Tests             │
        │                                                  │
        │ 3. Android APK Build (Automated CI Artifact)     │
        └──────────────────────────────────────────────────┘
```
