---
title: 'Backend Express.js & Swagger'
description: 'Arquitetura, APIs, Swagger/OpenAPI e Guia de Testes do Backend em Node.js'
---

## ⚡ Visão Geral do Backend

O backend do **Aresta** foi refatorado para utilizar **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM** e documentação interativa **Swagger (OpenAPI 3.0)**, seguindo estritamente o padrão arquitetural **Layered MVC**.

### Principais Características
- **Linguagem**: TypeScript com compilação para ES Modules (`"type": "module"`).
- **Camadas MVC**:
  - `controllers/`: Recebimento de requisições HTTP, validação de fluxo e anotações JSDoc para o Swagger.
  - `services/`: Regras de negócio da aplicação e manipulação de entidades.
  - `routes/`: Declaração e agrupamento de rotas e middlewares.
  - `middlewares/`: Autenticação JWT (`authenticate`, `optionalAuthenticate`), controle de acessos (`requireRole`), tratamento centralizado de erros (`errorHandler`) e validação declarativa (`validateRequest`).
  - `schemas/`: Schemas de validação de dados de entrada com **Zod**.
  - `config/`: Configurações de ambiente tipadas (`env.ts`, `env.example.ts`), cliente Prisma e Swagger.
- **Banco de Dados**: SQLite embarcado com Prisma ORM (`prisma/schema.prisma`).
- **Documentação Interativa**: Swagger UI servido em `/api-docs` gerado via `swagger-jsdoc`.
- **Testes Automatizados**: Suíte completa com **Vitest** e **Supertest**.

---

## 📖 Documentação Interativa (Swagger)

A API disponibiliza a interface Swagger UI completa e a especificação OpenAPI em formato JSON:
- **Swagger UI**: [http://localhost:7070/api-docs](http://localhost:7070/api-docs)
- **OpenAPI JSON**: [http://localhost:7070/api-docs.json](http://localhost:7070/api-docs.json)

---

## 🔒 Variáveis de Ambiente e Segurança

As credenciais e configurações sensíveis são protegidas via `.gitignore`. Um arquivo de exemplo e uma interface tipada estão disponíveis:

### Arquivo `.env.example`
```bash
# Porta do servidor backend Express
PORT=7070

# URL de conexão com o banco SQLite (Prisma)
DATABASE_URL="file:./dev.db"

# Segredo para assinatura de tokens JWT
JWT_SECRET="aresta_super_secret_jwt_key_change_in_production"

# Modo de desenvolvimento / debug
DEBUG=true

# Diretório de armazenamento de capas e livros
STORAGE_PATH="./storage"
```

### Tipagem em `src/config/env.example.ts`
Garante a consistência de todas as variáveis exigidas pelo sistema em tempo de desenvolvimento.

---

## 🚀 Como Executar o Backend

Navegue até o diretório `aresta-back-node`:

```bash
cd aresta-back-node

# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Sincronizar o banco de dados e aplicar o seed inicial
npx prisma db push
npx prisma db seed

# 4. Iniciar o servidor em modo de desenvolvimento
npm run dev
```

O servidor iniciará em `http://localhost:7070`.

---

## 🧪 Testes Automatizados (Vitest)

Para executar toda a suíte de testes com **Vitest** e **Supertest**:

```bash
cd aresta-back-node

# Executar testes em modo pontual
npm test

# Executar testes em modo contínuo (Watch)
npm run test:watch
```

### Cobertura de Testes
1. `tests/health.test.ts`: Validação de `/api/health` e endpoint OpenAPI `/api-docs.json`.
2. `tests/auth.test.ts`: Testes de autenticação, login com senha válida/inválida e endpoint `/api/auth/me`.
3. `tests/books.test.ts`: Listagem, criação, leitura por ID e remoção de livros.
4. `tests/users.test.ts`: Validação de permissões de administrador (401/403) e operações de CRUD.
5. `tests/graph.test.ts`: Criação, atualização e remoção de nós e conexões do grafo.

---

## 🌐 Mapeamento de Rotas da API

| Método | Rota | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck do servidor e banco | Pública |
| `GET` | `/api-docs` | Interface Swagger UI | Pública |
| `POST` | `/api/auth/login` | Autenticação e geração de JWT | Pública |
| `GET` | `/api/auth/me` | Dados do usuário autenticado | Bearer Token |
| `GET` | `/api/books` | Listagem do acervo de livros | Pública |
| `GET` | `/api/books/:id` | Detalhes do livro por ID | Pública |
| `GET` | `/api/books/:id/cover` | Imagem da capa do livro | Pública |
| `GET` | `/api/books/:id/file` | Arquivo PDF do livro | Pública |
| `POST` | `/api/books` | Cadastro de novo livro | Pública |
| `DELETE` | `/api/books/:id` | Remoção de livro | Pública |
| `GET` | `/api/user-books` | Livros na estante do usuário | Opcional (Fallback dev) |
| `POST` | `/api/user-books` | Adicionar/atualizar livro na estante | Opcional (Fallback dev) |
| `PATCH` | `/api/user-books/:id` | Atualizar progresso/status de leitura | Opcional (Fallback dev) |
| `DELETE` | `/api/user-books/:id` | Remover livro da estante por ID | Opcional (Fallback dev) |
| `DELETE` | `/api/user-books/book/:bookId` | Remover livro da estante por bookId | Opcional (Fallback dev) |
| `GET` | `/api/user-settings` | Preferências de leitura | Opcional (Fallback dev) |
| `PUT` | `/api/user-settings` | Atualizar preferências | Opcional (Fallback dev) |
| `GET` | `/api/graph` | Nós e arestas do grafo | Opcional (Fallback dev) |
| `POST` | `/api/graph/nodes` | Criar nó de tema | Opcional (Fallback dev) |
| `PUT` | `/api/graph/nodes/:id` | Atualizar nó de tema | Opcional (Fallback dev) |
| `DELETE` | `/api/graph/nodes/:id` | Remover nó de tema | Opcional (Fallback dev) |
| `POST` | `/api/graph/connections` | Conectar dois temas | Opcional (Fallback dev) |
| `DELETE` | `/api/graph/connections/:sourceId/:targetId` | Remover conexão | Opcional (Fallback dev) |
| `POST` | `/api/graph/nodes/:id/books` | Vincular livro a um tema | Opcional (Fallback dev) |
| `DELETE` | `/api/graph/nodes/:id/books/:userBookId` | Desvincular livro de um tema | Opcional (Fallback dev) |
| `GET` | `/api/users` | Listar todos os usuários | ADMIN (Bearer) |
| `GET` | `/api/users/:id` | Detalhes do usuário | ADMIN (Bearer) |
| `POST` | `/api/users` | Criar novo usuário | ADMIN (Bearer) |
| `PUT` | `/api/users/:id` | Atualizar usuário | ADMIN (Bearer) |
| `DELETE` | `/api/users/:id` | Remover usuário | ADMIN (Bearer) |

