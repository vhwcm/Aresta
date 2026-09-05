# Aresta — Plataforma Unificada de Leitura, Conhecimento e Notas Visuais

O **Aresta** é um ecossistema integrado para leitura ativa, estudo aprofundado, mapas mentais infinitos e aprendizagem acelerada com repetição espaçada (SM-2) potencializada por IA.

---

## 🏛️ Arquitetura do Monólito Modular

O sistema opera em um **Monólito Modular em Duas Camadas** (`apps/api` e `apps/web`):

```
┌───────────────────────────────────────────┐
│           apps/web (Nuxt 3)               │
│  Home / Leitor 3D / Canvas / Flashcards   │
│             Porta: :3000                  │
│       (Empacotado no Tauri v2)            │
└─────────────────────┬─────────────────────┘
                      │ REST / JWT
                      ▼
┌───────────────────────────────────────────┐
│           apps/api (Express)              │
│   Auth / Reader / Canvas / Memory / AI    │
│             Porta: :3001                  │
└─────────────────────┬─────────────────────┘
                      │ Prisma ORM
                      ▼
┌───────────────────────────────────────────┐
│         PostgreSQL 16 + pgvector          │
│            Porta: :5432                   │
└───────────────────────────────────────────┘
```

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js 20+
- Docker & Docker Compose
- NPM

### 2. Subir o Banco de Dados
```bash
npm run db:up
```

### 3. Iniciar o Ambiente de Desenvolvimento
```bash
npm run dev
```
- **Web App / Desktop:** [http://localhost:3000](http://localhost:3000)
- **API REST:** [http://localhost:3001](http://localhost:3001)

### 4. Executar Bateria de Testes
```bash
npm test
```

### 5. Compilar para Produção
```bash
npm run build
```

### 6. Executar Versão Desktop (Tauri v2)
```bash
npm run tauri:dev
```
