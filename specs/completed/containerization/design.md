# Design Técnico: Containerização Completa (Docker Compose & Serviços)

## 1. Visão Geral da Arquitetura

A infraestrutura é baseada em Docker Compose com uma rede bridge isolada (`aresta-network`), volumes nomeados para persistência do banco (`pgdata`) e arquivos de mídia/livros (`storage_data`).

```
                              Host / Navegador
                                      │
               ┌──────────────────────┴──────────────────────┐
               │ :3000                                       │ :7070
               ▼                                             ▼
       ┌───────────────┐                             ┌───────────────┐
       │   frontend    │                             │    backend    │
       │ (Nuxt 4 / SSR)│                             │(Node Express) │
       └───────┬───────┘                             └───────┬───────┘
               │                                             │
               │ aresta-network                              │ aresta-network
               │ (Bridge)                                    │ (Bridge)
               └──────────────────────┬──────────────────────┘
                                      │
                      ┌───────────────┴───────────────┐
                      │ :5432                         │ :50051 (gRPC)
                      ▼                               ▼
              ┌───────────────┐               ┌───────────────┐
              │      db       │               │  ocr-service  │
              │ (PostgreSQL)  │               │   (Go gRPC)   │
              └───────────────┘               └───────────────┘
```

Consulte o diagrama visual detalhado em: `diagrams/docker-compose-flow.txt`

---

## 2. Especificação dos Containers e Dockerfiles

### 2.1. Container do Banco de Dados (`db`)
- **Imagem Base**: `postgres:16-alpine`
- **Variáveis de Ambiente**:
  - `POSTGRES_USER`: `aresta`
  - `POSTGRES_PASSWORD`: `aresta_secret`
  - `POSTGRES_DB`: `aresta_db`
- **Volume**: `pgdata:/var/lib/postgresql/data`
- **Healthcheck**: `pg_isready -U aresta -d aresta_db`

### 2.2. Container do Microsserviço OCR Go (`ocr-service`)
- **Localização**: `aresta-ocr/Dockerfile`
- **Estratégia de Build Multi-Stage**:
  - *Stage 1 (Builder)*: `golang:1.23-alpine` compila o binário estático `CGO_ENABLED=0 go build -o /app/ocr-server ./cmd/server/main.go`.
  - *Stage 2 (Runner)*: `alpine:3.20` ou `scratch` contendo apenas os certificados CA e o binário `/app/ocr-server`.
- **Porta Exposta**: `50051` (gRPC).

### 2.3. Container do Backend Node.js (`backend`)
- **Localização**: `aresta-back-node/Dockerfile`
- **Estratégia de Build Multi-Stage**:
  - *Stage 1 (Builder)*: `node:20-alpine`, executa `npm ci`, `npx prisma generate` e compila TypeScript com `npm run build`.
  - *Stage 2 (Runner)*: `node:20-alpine` com dependências de produção, Prisma Client e script de entrypoint que roda migrações antes de iniciar o servidor Express.
- **Porta Exposta**: `7070`
- **Healthcheck**: `wget --no-verbose --tries=1 --spider http://localhost:7070/api/health || exit 1`

### 2.4. Container do Frontend Nuxt (`frontend`)
- **Localização**: `front/Dockerfile`
- **Estratégia de Build Multi-Stage**:
  - *Stage 1 (Builder)*: `node:20-alpine`, `npm ci` e `npm run build` (gerando `.output/server/index.mjs`).
  - *Stage 2 (Runner)*: `node:20-alpine`, executa `node .output/server/index.mjs`.
- **Porta Exposta**: `3000`

---

## 3. Adaptação do Prisma para Suporte ao PostgreSQL

Para permitir flexibilidade entre SQLite local e PostgreSQL no Docker:
- Suporte a `DATABASE_URL="postgresql://aresta:aresta_secret@db:5432/aresta_db?schema=public"` no `.env`.
- No `schema.prisma`, ajuste do provider ou uso de scripts de migração equivalentes garantindo integridade dos tipos e chaves estrangeiras.

---

## 4. Orquestração no `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: aresta-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-aresta}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-aresta_secret}
      POSTGRES_DB: ${POSTGRES_DB:-aresta_db}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aresta -d aresta_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - aresta-network

  ocr-service:
    build:
      context: ./aresta-ocr
      dockerfile: Dockerfile
    container_name: aresta-ocr
    restart: unless-stopped
    environment:
      GRPC_PORT: 50051
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GEMINI_MODEL: ${GEMINI_MODEL:-gemini-flash-latest}
      USE_MOCK: ${USE_MOCK:-false}
    ports:
      - "50051:50051"
    networks:
      - aresta-network

  backend:
    build:
      context: ./aresta-back-node
      dockerfile: Dockerfile
    container_name: aresta-backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      ocr-service:
        condition: service_started
    environment:
      PORT: 7070
      DATABASE_URL: ${DATABASE_URL:-postgresql://aresta:aresta_secret@db:5432/aresta_db?schema=public}
      OCR_SERVICE_URL: ocr-service:50051
      JWT_SECRET: ${JWT_SECRET:-aresta_jwt_super_secret_key_2026}
    ports:
      - "7070:7070"
    volumes:
      - storage_data:/app/storage
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:7070/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - aresta-network

  frontend:
    build:
      context: ./front
      dockerfile: Dockerfile
    container_name: aresta-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    environment:
      PORT: 3000
      NUXT_PUBLIC_API_BASE: ${NUXT_PUBLIC_API_BASE:-http://localhost:7070}
    ports:
      - "3000:3000"
    networks:
      - aresta-network

volumes:
  pgdata:
  storage_data:

networks:
  aresta-network:
    driver: bridge
```
