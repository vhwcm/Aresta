# Visão Geral da Arquitetura (Architecture Overview)

O **Aresta** é um ecossistema monorepositório projetado para leitura inteligente de livros digitais (EPUB e PDF), retenção de conhecimento com flashcards e visualização de mapas mentais através de grafos relacionais.

---

## 1. Diagrama Geral do Sistema

```
                           ┌─────────────────────────┐
                           │     USUÁRIO / BROWSER   │
                           └────────────┬────────────┘
                                        │
                                        │ HTTP / WebSocket (:3000)
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ FRONTEND (Nuxt 4 / Vue 3 / TypeScript / Pinia / Tailwind CSS)          │
    │                                                                        │
    │  ┌────────────────────┐   ┌────────────────────┐   ┌────────────────┐  │
    │  │  Pages & Layouts   │   │ Reader Adapter     │   │ D3.js Graph &  │  │
    │  │  (Home, Reader,    │   │ (Foliate-js EPUB / │   │ Mental Map     │  │
    │  │   Graph, Review)   │   │  PDF.js Renderer)  │   │ Physics Engine │  │
    │  └─────────┬──────────┘   └─────────┬──────────┘   └───────┬────────┘  │
    │            │                        │                      │           │
    │            └────────────────────────┼──────────────────────┘           │
    │                                     ▼                                  │
    │                        ┌────────────────────────┐                      │
    │                        │ Composables & Stores   │                      │
    │                        │ (useUserBooks, useAuth)│                      │
    │                        └────────────┬───────────┘                      │
    └─────────────────────────────────────┼──────────────────────────────────┘
                                          │
                                          │ REST API Calls / JSON (:7070/api)
                                          ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ BACKEND (Node.js / Express.js / TypeScript / MVC / Swagger OpenAPI)    │
    │                                                                        │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │ Middlewares (CORS, JWT Auth, Zod Validation, Error Handler)      │  │
    │  └──────────────────────────────────┬───────────────────────────────┘  │
    │                                     ▼                                  │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │ Controllers (Auth, Books, UserBooks, Annotations, Graph, Streak) │  │
    │  └──────────────────────────────────┬───────────────────────────────┘  │
    │                                     ▼                                  │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │ Business Services (Regras de negócio, cálculos de streak/grafo)  │  │
    │  └──────────────────────────────────┬───────────────────────────────┘  │
    │                                     ▼                                  │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │ Prisma ORM Client                                                │  │
    │  └──────────────────────────────────┬───────────────────────────────┘  │
    └─────────────────────────────────────┼──────────────────────────────────┘
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 │                                                 │
                 ▼                                                 ▼
    ┌─────────────────────────┐                       ┌─────────────────────────┐
    │ Banco de Dados SQLite   │                       │ Sistema de Arquivos     │
    │ (dev.db / WAL Mode)     │                       │ (storage/epubs, covers) │
    └─────────────────────────┘                       └─────────────────────────┘
```

---

## 2. Stack Tecnológica

| Camada | Tecnologias Principais | Propósito |
| :--- | :--- | :--- |
| **Frontend** | [Nuxt 4](https://nuxt.com/) / Vue 3, TypeScript, Tailwind CSS, Pinia, D3.js | Interface web reativa, renderização de documentos e simulação física de grafos |
| **Leitor de Livros** | `foliate-js` (EPUB), `pdfjs-dist` (PDF), Canvas API | Renderização performática de múltiplos formatos com padrão Adapter |
| **Backend** | [Node.js](https://nodejs.org/), Express.js, TypeScript, [Prisma ORM](https://www.prisma.io/), Zod, BCrypt, JWT | API RESTful em arquitetura MVC com documentação Swagger OpenAPI |
| **Banco de Dados** | [SQLite 3](https://sqlite.org/) (via Prisma) | Armazenamento relacional local, com modo WAL ativado para alta concorrência |
| **Conversor** | Python 3.12, PyPDF, EbookLib, Pytest (`pdf2epub/`) | Conversão e processamento de arquivos PDF para EPUB |
| **Qualidade & CI/CD** | Vitest, Supertest, Playwright, ESLint, Pre-commit, GitHub Actions | Quality gates, testes unitários, testes de integração e validações automáticas |

---

## 3. Módulos e Comunicação

1. **Frontend e Backend**: Comunicação exclusiva via protocolo HTTP/JSON (`http://localhost:7070/api`).
2. **Autenticação**: Stateless baseada em tokens JWT no cabeçalho `Authorization: Bearer <token>`.
3. **Armazenamento de Mídia**: Arquivos binários de livros (`.epub`, `.pdf`) e capas (`.png`, `.jpg`) são servidos através de endpoints de download e streaming do backend.
