# Arquitetura do Backend (`apps/api/`)

O backend do Aresta é construído com **Node.js**, **Express.js**, **TypeScript** e **Prisma ORM** sobre **PostgreSQL (com pgvector)**, estruturado no padrão modular em camadas.

---

## 1. Estrutura de Módulos

```text
apps/api/
├── src/
│   ├── config/               # Envs validadas, instância Prisma Client e Swagger spec
│   ├── middlewares/          # JWT auth, Zod validate e global error handler
│   ├── modules/              # Módulos de domínio
│   │   ├── auth/             # Autenticação, emissão e validação JWT
│   │   ├── reader/           # Progresso de leitura, anotações e livros
│   │   ├── canvas/           # Quadros infinitos (JSON Canvas v1.0)
│   │   ├── memory/           # Flashcards, SRS, decks diários e ofensivas
│   │   └── ai/               # Orquestração de IA, busca vetorial e OCR
│   ├── app.ts                # Configuração do Express (cors, json, rotas, errors)
│   └── server.ts             # Entrypoint do servidor HTTP na porta 3001
├── prisma/
│   ├── schema.prisma         # Schema relacional e definições de tabelas
│   └── seed.ts               # Script de população inicial
└── tests/                    # Testes unitários e de integração com Vitest
```

---

## 2. Ciclo de Vida da Requisição (Backend Request Lifecycle)

```text
================================================================================
FLUXO DE REQUISIÇÃO DO BACKEND (BACKEND REQUEST LIFECYCLE)
================================================================================

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
    │  [Prisma Client -> PostgreSQL `aresta-db`]                             │
    │      │ Persiste dados em disco                                         │
    │      ▼                                                                 │
    │  Retorno do Service -> Controller formata JSON 200 OK                  │
    └──────────────────────────────────┬─────────────────────────────────────┘
                                       │
                                       │ 2. JSON Response 200 OK
                                       ▼
                             Cliente HTTP Atualizado
================================================================================
```

---

## 3. Fluxo de Autenticação e Autorização JWT (Authentication Flow)

```text
================================================================================
FLUXO DE AUTENTICAÇÃO E AUTORIZAÇÃO JWT (AUTHENTICATION FLOW)
================================================================================

    ┌──────────────┐                                         ┌─────────────────┐
    │   Frontend   │                                         │ Backend Express │
    └──────┬───────┘                                         └────────┬────────┘
           │                                                          │
           │ 1. POST /api/auth/login { email, password }              │
           ├─────────────────────────────────────────────────────────►│
           │                                                          │
           │                                                          │ 2. Busca User por email
           │                                                          │    no PostgreSQL via Prisma
           │                                                          │ 3. Compara hash bcrypt
           │                                                          │ 4. Gera JWT assinado
           │                                                          │
           │ 5. Response 200 OK { token, user: { id, name, role } }   │
           │◄─────────────────────────────────────────────────────────┤
           │                                                          │
           │ (Armazena token em Cookie / LocalStorage)                │
           │                                                          │
           │ 6. Requisição Protegida (Header: Authorization: Bearer ) │
           ├─────────────────────────────────────────────────────────►│
           │                                                          │
           │                                                          │ 7. auth.middleware.ts
           │                                                          │    Verifica assinatura
           │                                                          │    Injeta req.user
           │                                                          │
           │ 8. Response 200 OK com dados solicitados                 │
           │◄─────────────────────────────────────────────────────────┤
================================================================================
```

---

## 4. Fluxo de Cálculo de Streaks e Atividade Diária (Streak & Activity Flow)

```text
================================================================================
FLUXO DE CÁLCULO DE STREAKS E ATIVIDADE DIÁRIA (STREAK & ACTIVITY FLOW)
================================================================================

    ┌──────────────────────────────────────┐
    │  Ação do Usuário: Leitura/Flashcard  │
    └──────────────────┬───────────────────┘
                       │
                       │ POST /api/streak/track-reading ou track-flashcards
                       ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ Backend: Streak Service (`streak.service.ts`)                          │
    │                                                                        │
    │  1. Obtém data atual em UTC (formato `YYYY-MM-DD`)                     │
    │  2. Busca ou cria `DailyActivity` para (user_id, date)                 │
    │  3. Incrementa `reading_seconds` e/ou `flashcards_reviewed`            │
    │  4. Verifica se meta diária foi atingida -> seta `is_completed = true` │
    │  5. Se completou pela 1ª vez no dia:                                   │
    │     - Compara com `last_active_date`:                                  │
    │       * Se dia anterior consecutivo: `current_streak += 1`             │
    │       * Se pulou 1 dia e tem `streak_freeze_count > 0`:                │
    │         Consome 1 freeze, preserva streak e marca `is_frozen = true`   │
    │       * Se pulou sem freeze: reinicia `current_streak = 1`             │
    │     - Atualiza `longest_streak = max(longest_streak, current_streak)`  │
    │     - Atualiza `last_active_date = data_atual`                         │
    │  6. Persiste via transação Prisma no banco                             │
    └──────────────────────────────────┬─────────────────────────────────────┘
                                       │
                                       │ Retorna status da ofensiva
                                       ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ Frontend: Dashboard Home (`apps/web/pages/index.vue` / `useStreak`)    │
    │  - Atualiza contador de dias de ofensiva com animação de fogo          │
    │  - Mostra dias restantes de congelamento e progresso da meta           │
    └────────────────────────────────────────────────────────────────────────┘
================================================================================
```

---

## 5. Camadas e Responsabilidades

### 5.1. Schemas Zod (`src/modules/*/schemas/`)
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

### 5.2. Controllers (`src/modules/*/controllers/`)
Orquestram a requisição, extraem dados já validados e invocam a camada de serviço. Documentados com anotações JSDoc para Swagger OpenAPI.

### 5.3. Services (`src/modules/*/services/`)
Contêm todas as regras de negócio puras, cálculos de streaks, conexões de temas no grafo e chamadas transacionais ao Prisma.

---

## 6. Endpoints Principais da API

| Rota | Descrição | Autenticação |
| :--- | :--- | :--- |
| `POST /api/auth/login` | Autenticação de usuário e emissão de JWT | Pública |
| `GET /api/auth/me` | Dados do usuário logado | Requer JWT |
| `GET /api/books` | Listagem do catálogo de livros do usuário | Requer JWT |
| `POST /api/annotations` | Criação de anotação/citação com CFI | Requer JWT |
| `POST /api/ocr/transcribe` | Transcrição de imagem em base64 via OCR Gemini | Requer JWT |
| `GET /api/graph` | Nós e arestas do grafo de conhecimento | Requer JWT |
| `POST /api/streak/track-reading` | Registro de leitura diária e ofensivas | Requer JWT |
| `GET /api/health` | Healthcheck do servidor e banco | Pública |
