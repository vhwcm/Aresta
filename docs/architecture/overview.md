# Visão Geral da Arquitetura (Architecture Overview)

O **Aresta** é um ecossistema monolítico modular projetado para leitura ativa de livros digitais (EPUB e PDF), retenção de conhecimento com repetição espaçada e flashcards, mapas mentais através de grafos relacionais e quadros infinitos com inteligência artificial.

---

## 1. Diagrama Geral do Monólito

```text
================================================================================
ARESTA — VISÃO GERAL DO MONÓLITO MODULAR (SYSTEM OVERVIEW)
================================================================================

                           ┌─────────────────────────┐
                           │     USUÁRIO / CLIENTE   │
                           │   (Desktop Tauri / Web) │
                           └────────────┬────────────┘
                                        │
                                        │ HTTP / WebSocket (:3000)
                                        ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ FRONTEND (apps/web — Nuxt 3 / Vue 3 / TypeScript / Pinia / Tailwind)   │
    │                                                                        │
    │  ┌────────────────────┐   ┌────────────────────┐   ┌────────────────┐  │
    │  │  Pages & Layouts   │   │ Reader Engine      │   │ D3.js Graph &  │  │
    │  │  (Home, Reader,    │   │ (Adapter, Foliate, │   │ Canvas Infinito│  │
    │  │   Canvas, Review)  │   │  PDF.js, 3D Curl)  │   │ Physics Engine │  │
    │  └─────────┬──────────┘   └─────────┬──────────┘   └───────┬────────┘  │
    │            │                        │                      │           │
    │            └────────────────────────┼──────────────────────┘           │
    │                                     ▼                                  │
    │                        ┌────────────────────────┐                      │
    │                        │ Composables & Stores   │                      │
    │                        │ (useAuth, useBooks...) │                      │
    │                        └────────────┬───────────┘                      │
    └─────────────────────────────────────┼──────────────────────────────────┘
                                          │
                                          │ REST API Calls / JSON (:3001/api)
                                          ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ BACKEND (apps/api — Node.js / Express Modular / TypeScript / Prisma)   │
    │                                                                        │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │ Middlewares (CORS, JWT Auth, Zod Validation, Error Handler)      │  │
    │  └──────────────────────────────────┬───────────────────────────────┘  │
    │                                     ▼                                  │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │ Módulos: auth, reader, canvas, memory, ai                        │  │
    │  └──────────────────────────────────┬───────────────────────────────┘  │
    │                                     ▼                                  │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │ Business Services & AI Orchestrator                              │  │
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
    │ PostgreSQL 16 + pgvector│                       │ Google Drive / FS Local │
    │ (aresta-db :5432)       │                       │ (Binários EPUB/PDF)     │
    └─────────────────────────┘                       └─────────────────────────┘
================================================================================
```

---

## 2. Mapa dos Documentos de Arquitetura

Cada subsistema possui sua documentação técnica com seus respectivos diagramas ASCII integrados:

- [apps/api (Backend Modular)](file:///c:/Users/vichw/Aresta/docs/architecture/backend.md): Ciclo de requisição, autenticação JWT, cálculo de ofensivas/streaks e endpoints.
- [apps/web (Frontend Nuxt 3 & Tauri)](file:///c:/Users/vichw/Aresta/docs/architecture/frontend.md): Arquitetura de interface, stores reativas e componentes.
- [Subsistema de Leitor (Reader)](file:///c:/Users/vichw/Aresta/docs/architecture/reader.md): Padrão Adapter (EPUB/PDF), Motor 3D de Virada de Página (Three.js WebGL) e Pilha de Páginas Virtuais.
- [Quadro Infinito & Grafo (Canvas)](file:///c:/Users/vichw/Aresta/docs/architecture/canvas.md): Padrão JSON Canvas v1.0, notas compostas aninhadas, prevenção de loops e simulação física D3.
- [Inteligência Artificial & RAG (AI)](file:///c:/Users/vichw/Aresta/docs/architecture/ai.md): Vetorização, busca semântica, geração de flashcards e repetição espaçada.
- [Banco de Dados Relacional & Vetorial](file:///c:/Users/vichw/Aresta/docs/architecture/database.md): Diagrama ERD, entidades Prisma e tipos de dados.
- [Local-First & Sincronização Híbrida](file:///c:/Users/vichw/Aresta/docs/architecture/local-first-and-containers.md): Funcionamento offline, Last-Write-Wins e segregação de binários.
- [Microsserviço de OCR](file:///c:/Users/vichw/Aresta/docs/architecture/ocr-service.md): Inversão de dependência em Go, gRPC e integração Gemini Vision.
- [Infraestrutura, Portas & CI/CD](file:///c:/Users/vichw/Aresta/docs/architecture/infrastructure.md): Execução local, portas e Quality Gates.
