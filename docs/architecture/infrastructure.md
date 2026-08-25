# Infraestrutura, Portas e CI/CD

Este documento descreve o ambiente de execução local, orquestração de scripts e os Quality Gates automatizados no CI/CD.

---

## 1. Portas e Serviços Locais

| Serviço | Porta Padrão | Endpoint Principal / Documentação |
| :--- | :--- | :--- |
| **Frontend Nuxt 4** | `3000` | [http://localhost:3000](http://localhost:3000) |
| **Backend Express API** | `7070` | [http://localhost:7070/api](http://localhost:7070/api) |
| **Swagger UI** | `7070` | [http://localhost:7070/api-docs](http://localhost:7070/api-docs) |
| **Backend Healthcheck** | `7070` | [http://localhost:7070/api/health](http://localhost:7070/api/health) |

---

## 2. Scripts de Inicialização

- **Inicialização Unificada**:
  ```bash
  ./start.sh
  # ou via npm:
  npm start
  ```
  O script `start.sh` inicia o backend em background na porta `7070` e o frontend Nuxt na porta `3000`, monitorando o encerramento gracioso via sinais `SIGINT` e `SIGTERM`.

---

## 3. Quality Gates e Automação (CI/CD)

O pipeline do GitHub Actions (`.github/workflows/quality-gates.yml`) valida todas as alterações antes do merge em `main`:

```
                       Git Push / Pull Request
                                  │
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │ GitHub Actions: Quality Gates Pipeline           │
        │                                                  │
        │ 1. Pre-commit Checks (Python 3.12, sanitização)  │
        │                                                  │
        │ 2. Frontend Quality Gates (Node 20):             │
        │    - ESLint (tamanho de arquivos e identação)    │
        │    - Typecheck (vue-tsc / nuxt typecheck)        │
        │    - Vitest Unit Tests                           │
        │                                                  │
        │ 3. Backend Quality Gates (Node 20):              │
        │    - Build & Typecheck (Prisma generate + tsc)   │
        │    - Vitest Unit & Integration Tests             │
        └──────────────────────────────────────────────────┘
```
