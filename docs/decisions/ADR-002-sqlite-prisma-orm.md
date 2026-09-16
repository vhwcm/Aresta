# ADR-002: Adoção do SQLite e Prisma ORM

## Status
Superado (Deprecated / Superseded pelo PostgreSQL 16 + pgvector)

## Data
2026-08-25 (Superado em 2026-09)

## Contexto Original
O Aresta é uma aplicação de leitura e retenção que inicialmente buscou ser simples de executar localmente sem a necessidade de configurar contêineres de banco de dados pesados, mantendo integridade relacional.

## Decisão Original
Adotou-se o **SQLite 3** como banco de dados relacional embarcado, operando com **Prisma ORM** como camada de abstração de dados, migrações e tipagem estática TypeScript.

## Superação / Decisão Vigente
Com a evolução da plataforma para integrar **Inteligência Artificial Contextual**, **embeddings vetoriais (`vector(1536)`)** e arquitetura de monólito modular conteinerizado (`apps/api`), o banco de dados principal do ecossistema foi migrado para **PostgreSQL 16 com extensão `pgvector`** em contêiner Docker (`aresta-db`), com versionamento estrito de migrations SQL em `apps/api/prisma/migrations/`.

No ambiente desktop/offline (Tauri), a persistência local-first segue isolada no cliente via SQLite local ou IndexedDB/OPFS.

## Consequências da Superação
- **Positivas**: Suporte nativo a busca vetorial por similaridade de cosseno com `pgvector`, alta concorrência de leitura e escrita, e integridade referencial forte em produção.
- **Impacto de Infra**: Exige Docker / daemon do PostgreSQL 16 rodando para o backend `apps/api`.
