# Guia de Instalação & Execução Local

Este guia orienta o setup completo do monólito **Aresta** em ambiente de desenvolvimento local.

---

## 1. Pré-requisitos
- **Node.js**: v20+ ou v22 (`npm` v10+)
- **Docker & Docker Compose** (para o PostgreSQL 16 com extensão `pgvector`)
- **Git**

---

## 2. Instalação das Dependências

Na raiz do monorepositório:

```bash
# 1. Instalar dependências da raiz
npm install

# 2. Instalar dependências do Frontend (apps/web) e Backend (apps/api)
cd apps/web && npm install && cd ../api && npm install && cd ../..

# 3. Subir o container de banco de dados PostgreSQL 16 + pgvector
docker compose up -d aresta-db

# 4. Executar migrations e popular banco inicial
cd apps/api
npx prisma migrate deploy
npm run prisma:seed
cd ../..
```

---

## 3. Inicialização dos Ambientes

### Opção 1: Inicialização Concorrente
```bash
npm run dev
```
Isso iniciará:
- **Frontend (Nuxt 3 & Tauri)**: [http://localhost:3000](http://localhost:3000)
- **Backend API (Express & Prisma)**: [http://localhost:3001/api](http://localhost:3001/api)
- **Healthcheck**: [http://localhost:3001/health](http://localhost:3001/health)

---

### Opção 2: Execução Individual dos Módulos

#### Apenas o Frontend:
```bash
cd apps/web
npm run dev
```

#### Apenas o Backend:
```bash
cd apps/api
npm run dev
```

#### Aplicativo Desktop (Tauri v2):
```bash
cd apps/web
npm run desktop:dev
```
