# Arquitetura do Backend (`aresta-back-node/`)

O backend do Aresta é construído com **Node.js**, **Express.js**, **TypeScript** e **Prisma ORM**, estruturado no padrão arquitetural **MVC em Camadas**.

---

## 1. Estrutura de Diretórios

```
aresta-back-node/
├── src/
│   ├── config/               # Envs validadas, instância Prisma Client e Swagger spec
│   ├── controllers/          # Controladores HTTP com anotações OpenAPI JSDoc
│   ├── middlewares/          # JWT auth, Zod validate e global error handler
│   ├── routes/               # Definição e agrupamento de rotas da API
│   ├── schemas/              # Schemas Zod e tipos TypeScript inferidos
│   ├── services/             # Regras de negócio e persistência com Prisma
│   ├── app.ts                # Configuração do Express (cors, json, rotas, errors)
│   └── server.ts             # Entrypoint do servidor HTTP na porta 7070
├── prisma/
│   ├── schema.prisma         # Schema relacional e definições de tabelas
│   └── seed.ts               # Script de população inicial do banco SQLite
└── tests/                    # Testes de integração com Vitest e Supertest
```

---

## 2. Ciclo de Vida da Requisição

```
    Cliente HTTP (Front / Postman / Swagger)
           │
           │ 1. HTTP Request (ex: POST /api/user-books/:id/progress)
           ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ Express App (`src/app.ts`)                                             │
    │                                                                        │
    │  [Middleware: cors, express.json]                                     │
    │      │                                                                 │
    │      ▼                                                                 │
    │  [Router: `src/routes/index.ts` -> `userBook.routes.ts`]               │
    │      │                                                                 │
    │      ▼                                                                 │
    │  [Auth Middleware: `auth.middleware.ts`]                               │
    │      │ Valida Bearer JWT Token -> Injeta `req.user` (ou retorna 401)   │
    │      ▼                                                                 │
    │  [Validate Middleware: `validate.middleware.ts(schema)`]               │
    │      │ Valida body/params/query com Zod (ou retorna 400 com erros)     │
    │      ▼                                                                 │
    │  [Controller: `userBook.controller.ts`]                                │
    │      │ Extrai `req.params`, `req.body`, `req.user.id`                  │
    │      │ Chama `userBookService.updateProgress(...)`                     │
    │      ▼                                                                 │
    │  [Service: `userBook.service.ts`]                                      │
    │      │ Executa regras de negócio, valida limites de página             │
    │      │ Executa query/transação via `prisma.userBook.update(...)`       │
    │      ▼                                                                 │
    │  [Prisma Client -> SQLite `dev.db`]                                    │
    │      │ Persiste dados em disco                                         │
    │      ▼                                                                 │
    │  Retorno do Service -> Controller formata JSON 200 OK                  │
    └──────────────────────────────────┬─────────────────────────────────────┘
                                       │
                                       │ 2. JSON Response 200 OK
                                       ▼
                             Cliente HTTP Atualizado
```

---

## 3. Camadas e Responsabilidades

### 3.1. Schemas Zod (`src/schemas/`)
Garantem validação estrita em tempo de execução para qualquer dado externo antes de atingir as regras de negócio:
```typescript
import { z } from 'zod';

export const updateProgressSchema = z.object({
  body: z.object({
    currentPage: z.number().int().min(0, 'Página atual deve ser maior ou igual a 0'),
  }),
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});
```

### 3.2. Controllers (`src/controllers/`)
Orquestram a requisição, extraem dados já validados e invocam a camada de serviço. Documentados com anotações JSDoc para geração automática de Swagger UI em `/api-docs`.

### 3.3. Services (`src/services/`)
Contêm todas as regras de negócio puras, cálculos de streaks, conexões de temas no grafo e chamadas transacionais ao Prisma.

---

## 4. Endpoints Principais da API

| Rota | Descrição | Autenticação |
| :--- | :--- | :--- |
| `POST /api/auth/login` | Autenticação de usuário e emissão de JWT | Pública |
| `GET /api/auth/me` | Dados do usuário logado | Requer JWT |
| `GET /api/books` | Listagem do catálogo de livros globais | Requer JWT |
| `GET /api/books/:id/download` | Download/streaming do binário EPUB/PDF | Requer JWT |
| `GET /api/user-books` | Livros na estante do usuário e progresso | Requer JWT |
| `POST /api/annotations` | Criação de anotação/citação com CFI | Requer JWT |
| `GET /api/graph` | Nós e arestas do grafo de conhecimento | Requer JWT |
| `POST /api/streak/track-reading` | Registro de leitura diária e ofensivas | Requer JWT |
| `GET /api/health` | Healthcheck do servidor e banco | Pública |
