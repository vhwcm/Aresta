# Aresta — Ecossistema de 5 Microserviços

> Sistema de leitura inteligente com retencao de conhecimento por IA.

## Repositorios

| Repo | Porta API | Porta Front | Banco | Descricao |
|------|-----------|-------------|-------|-----------|
| aresta-auth | 3001 | - | PostgreSQL :5431 | JWT, usuarios, streak |
| aresta-ai | 3002 | - | Stateless | Gemini wrapper |
| aresta-reader | 3003 | 3010 | PostgreSQL :5433 | Leitor EPUB/PDF + Tauri |
| aresta-canvas | 3004 | 3011 | SQLite | Canvas visual + Tauri |
| aresta-memory | 3005 | - | PostgreSQL+pgvector :5435 | Anotacoes, flashcards SM-2, grafo |

## Subir todos os servicos

docker-compose -f docker-compose.orchestrator.yml up

## Status da Migracao

- [x] Fase 0 — Scaffolding dos 5 repos
- [x] Fase 1 — Schemas Prisma
- [x] Fase 2 — Backend migrado (services, controllers, routes)
- [x] Fase 3 — Frontend migrado (pages, components, composables, stores)
- [ ] Fase 4 — Testes de integracao cross-service
