---
title: 'Instalação'
description: 'Como instalar e configurar o projeto'
---

## Instalação e Execução

Siga os passos abaixo para instalar e rodar os serviços locais.

### Pré-requisitos
- **Node.js**: v20 ou superior
- **Git**

### Passos para Inicialização

1. Instalar as dependências do monorepositório e hooks:
   ```bash
   npm run setup:hooks
   ```

2. Configurar o backend Node.js (`aresta-back-node`):
   ```bash
   cd aresta-back-node
   npm install
   npx prisma db push
   npx prisma db seed
   cd ..
   ```

3. Iniciar o Frontend e Backend em desenvolvimento:
   ```bash
   # Executar backend (Porta 7070) e frontend (Porta 3000)
   npm run dev
   ```

Acesse:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:7070`
- **Swagger UI**: `http://localhost:7070/api-docs`

---

## 🧪 Testes Automatizados

### Rodar testes do Backend (Express + Vitest):
```bash
cd aresta-back-node
npm test
```

### Rodar testes do Frontend (Nuxt + Vitest):
```bash
cd front
npm run test
```
- **Documentação Swagger UI**: `http://localhost:7070/api-docs`

---

### Executando Módulos Individualmente

#### 1. Backend Express.js (`aresta-back-node`)
```bash
cd aresta-back-node
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

Para rodar os testes automatizados do backend:
```bash
npm test
```

#### 2. Frontend Nuxt (`front`)
```bash
cd front
npm install
npm run dev
```
