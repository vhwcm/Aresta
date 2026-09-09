# Arquitetura Local-First, Desktop Tauri e Containerização de Serviços

Este documento registra o modelo arquitetural do **Aresta** para suportar leitura offline, sincronização em nuvem, execução desktop via Tauri v2 e orquestração de microsserviços via containers Docker.

---

## 1. Visão Geral do Modelo Arquitetural

O Aresta adota a filosofia **Local-First**, combinando a autonomia e agilidade da execução local com a robustez e inteligência dos serviços centralizados em nuvem:

```text
================================================================================
                    ARESTA: ARQUITETURA LOCAL-FIRST & DOCKER STACK
================================================================================

+-------------------------------------------------------------------------------+
|                      DISPOSITIVO CLIENTE (Web / Desktop)                      |
|                                                                               |
|  +---------------------+   +---------------------+   +---------------------+  |
|  |   Leitor de EPUBs   |   |   Armazenamento     |   |    Banco Local      |  |
|  |   (100% Offline)    |   |      Local          |   |    (IndexedDB /     |  |
|  |                     |<--+  (OPFS / FileSys)   |   |     Tauri Store)    |  |
|  | - Virar páginas     |   |  - Livros em cache  |   | - Anotações         |  |
|  | - Criar anotações   |   |  - Capas            |   | - Progresso         |  |
|  | - Fazer Flashcards  |   +---------------------+   | - Streaks           |  |
|  +----------+----------+                             +----------+----------+  |
|             |                                                   |             |
|             +------------------------+--------------------------+             |
|                                      |                                        |
|                                      v                                        |
|                     +----------------------------------+                      |
|                     |        Sync Engine Local         |                      |
|                     |  - Fila de mutações (outbox)     |                      |
|                     |  - Timestamps (updated_at)       |                      |
|                     |  - Detecção online / offline     |                      |
|                     +----------------+-----------------+                      |
+--------------------------------------|----------------------------------------+
                                       |
                   HTTP(S) Sync Events |  POST /api/sync (quando online)
                                       |
+--------------------------------------v----------------------------------------+
|                   SERVIDOR / CLOUD (DOCKER COMPOSE STACK)                     |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                         Container 1: Backend API                        |  |
|  |                     (Node.js 20 Express + Prisma ORM)                   |  |
|  |                                                                         |  |
|  |   - Endpoint /api/sync (Resolução LWW e merge de dados)                 |  |
|  |   - Autenticação JWT e RBAC                                             |  |
|  |   - Orquestrador gRPC de chamadas para IA                               |  |
|  +----------------------+--------------------------+-----------------------+  |
|                         |                          |                          |
|       Prisma (Port 5432)|                          | gRPC (Port 50051)        |
|                         v                          v                          |
|  +-----------------------------+     +-------------------------------------+  |
|  |    Container 2: Database    |     |      Container 3: aresta-ocr        |  |
|  |   (PostgreSQL 16 Alpine)    |     |      (Go 1.23 Microservice)         |  |
|  |                             |     |                                     |  |
|  | - Fonte da verdade central  |     | - Inversão de dependência (SOLID D) |  |
|  | - Volume persistente        |     | - Google Gemini 2.0 / Flash         |  |
|  | - Backups estruturados      |     | - Transcrição de escrita e imagens  |  |
|  +-----------------------------+     +-------------------------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                   Container 4: Frontend Web (Nuxt 3)                    |  |
|  |                       (Acesso via Navegador Web)                        |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 2. Pilares da Arquitetura

### A. Leitura 100% Offline e Armazenamento Local
- **Livros e Capas**: O arquivo `.epub` e suas capas são mantidos localmente no dispositivo via **OPFS (Origin Private File System)** no navegador ou no sistema de arquivos nativo do desktop via Tauri.
- **Banco de Dados no Cliente**: Todas as interações (posições de leitura, anotações, destaques, flashcards e ofensivas/streaks) são gravadas instantaneamente no banco local (IndexedDB no browser ou Store local).
- **Independência de Rede**: O usuário pode ler livros e revisar flashcards sem qualquer conexão com a internet.

### B. Motor de Sincronização Bidirecional (Sync Engine)
- **Controle de Versão Local**: Cada registro persistido localmente recebe metadados de auditoria:
  - `updated_at`: Timestamp ISO da última alteração.
  - `deleted_at`: Suporte a *soft delete* para replicação de exclusões.
  - `sync_status`: Estado da mutação (`synced` | `pending`).
- **Resolução de Conflitos**: Estratégia baseada em *Last-Write-Wins (LWW)* por campo/entidade ou mesclagem incremental com timestamps confiáveis.
- **Endpoint Central**: `POST /api/sync` no Backend Node.js, que recebe as mutações pendentes do cliente e retorna as novidades remotas.

---

## 3. Fluxo de Sincronização Híbrida: "Dados no Aresta, Binários no Usuário"

Para otimizar os custos de infraestrutura e garantir escalabilidade ilimitada de armazenamento de acervo para os usuários, o Aresta adota uma abordagem de segregação estrita entre **Dados Relacionais / Metadados** e **Arquivos Binários**:

```text
================================================================================
           ARESTA: FLUXO DE SINCRONIZAÇÃO HÍBRIDA (DADOS VS BINÁRIOS)
================================================================================

  "Dados no Aresta, Binários no Usuário"

  ┌────────────────────────────────────────────────────────────────────────────┐
  │                           DISPOSITIVO CLIENTE                              │
  │                    (Desktop Tauri / Web PWA / Mobile)                      │
  │                                                                            │
  │   ┌──────────────┐       ┌────────────────┐       ┌────────────────────┐   │
  │   │  SQLite/IDB  │       │   OPFS / FS    │       │    Sync Engine     │   │
  │   │ (metadados)  │       │  (binários)    │       │  (mutation_queue)  │   │
  │   └──────┬───────┘       └───────┬────────┘       └─────────┬──────────┘   │
  │          │                       │                          │              │
  └──────────┼───────────────────────┼──────────────────────────┼──────────────┘
             │                       │                          │
             │                  ┌────▼────────────────┐         │
             │                  │   Google Drive API  │         │
             │                  │ (apenas EPUBs/PDFs) │         │
             │                  │  - AppDataFolder    │         │
             │                  └─────────────────────┘         │
             │                                                  │
             └──────────────────────────────────────────────────►
                         POST /api/sync (deltas JSON)
                         ┌─────────────────────────────┐
                         │   Backend Node.js Express   │
                         │   - JWT Auth & RBAC         │
                         │   - Sync de Metadados (LWW) │
                         │   - IA (OCR, Gemini)        │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │      PostgreSQL Central     │
                         │  (sem storage de binários)  │
                         │  - Notas, Grifos, Progresso │
                         │  - Flashcards, Streaks      │
                         │  - Grafo e Nós              │
                         └─────────────────────────────┘

================================================================================
                      DISTRIBUIÇÃO DE RESPONSABILIDADE
================================================================================

  Dado                     │ Destino                     │ Motivo
  ─────────────────────────┼─────────────────────────────┼──────────────────────
  EPUBs / PDFs             │ Google Drive (AppDataFolder)│ Grandes, custo zero
  Capas                    │ Google Drive (AppDataFolder)│ Binários estáticos
  Anotações / Highlights   │ Backend Aresta (/api/sync)  │ Resolução LWW, CFI
  Flashcards / SRS         │ Backend Aresta (/api/sync)  │ Algoritmo SM-2 exato
  Streaks / Ofensivas      │ Backend Aresta (/api/sync)  │ Fuso-horário e dias
  Graph nodes / edges      │ Backend Aresta (/api/sync)  │ Relacionamento grafo
  Progresso de leitura     │ Backend Aresta (/api/sync)  │ Range CFI e timestamp
================================================================================
```

---

## 4. Orquestração em Containers Docker

O ambiente de servidor e desenvolvimento em nuvem é estruturado em containers isolados:

| Serviço | Tecnologia | Porta | Descrição |
| :--- | :--- | :--- | :--- |
| **`db`** | PostgreSQL 16 Alpine + pgvector | `5432` | Banco de dados relacional e vetorial central com volume persistente. |
| **`ocr-service`** | Go 1.23 (Scratch/Alpine) | `50051` | Microsserviço gRPC de transcrição OCR e integração com IA Gemini. |
| **`backend`** | Node.js 20 Alpine | `3001` | API Express, Prisma ORM, motor de sincronização e healthchecks. |
| **`frontend`** | Node.js 20 (Nuxt 3) | `3000` | Interface Web para desktop/navegador. |
