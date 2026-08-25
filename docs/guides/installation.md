# Guia de Instalação & Execução Local

Este guia orienta o setup completo do monorepositório **Aresta** em ambiente de desenvolvimento local.

---

## 1. Pré-requisitos
- **Node.js**: v18 ou v20+ (`npm` v9+)
- **Git**
- **Python 3.12** (opcional, para testes de conversão `pdf2epub/`)

---

## 2. Instalação das Dependências

Na raiz do monorepositório:

```bash
# 1. Instalar dependências da raiz
npm install

# 2. Instalar dependências do Frontend e Backend
cd front && npm install && cd ../aresta-back-node && npm install && cd ..

# 3. Gerar Prisma Client e popular banco inicial
cd aresta-back-node
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
cd ..
```

---

## 3. Inicialização Rápida

### Opção 1: Inicialização Concorrente (Recomendado)
```bash
./start.sh
# ou:
npm start
```
Isso iniciará:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:7070/api](http://localhost:7070/api)
- **Swagger Docs**: [http://localhost:7070/api-docs](http://localhost:7070/api-docs)

---

### Opção 2: Execução Individual dos Módulos

#### Apenas o Frontend:
```bash
cd front
npm run dev
```

#### Apenas o Backend:
```bash
cd aresta-back-node
npm run dev
```
