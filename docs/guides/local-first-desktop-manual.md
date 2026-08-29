# Manual Técnico: Arquitetura Local-First & Aplicativos Desktop (Windows e Linux)

Este guia documenta detalhadamente a arquitetura **Local-First**, os mecanismos de persistência local, o motor de sincronização bidirecional e o processo de desenvolvimento e build dos aplicativos **Desktop** para Windows e Linux no ecossistema **Aresta**.

---

## 1. Visão Geral da Arquitetura

O Aresta adota a filosofia **Local-First**: os dados residem prioritariamente no dispositivo do usuário e todas as leituras, edições, destaques, flashcards e conexões de Canvas ocorrem instantaneamente em bancos de dados locais. A sincronização com a nuvem ocorre em segundo plano quando há conexão com a internet.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (DESKTOP / WEB)                            │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     INTERFACE NUXT 4 / VUE 3                          │  │
│  │   [ Leitor EPUB/PDF ]  [ Flashcards SRS ]  [ Canvas ]  [ Anotações ]  │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │             CAMADA DE REPOSITÓRIO (Local Repository Pattern)          │  │
│  │     - BookRepository         - AnnotationRepository                   │  │
│  │     - FlashcardRepository    - CanvasRepository  - StreakRepository   │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│                ┌─────────────────────┴─────────────────────┐                │
│                │                                           │                │
│     [Desktop Tauri App]                         [Navegador / PWA]           │
│                ▼                                           ▼                │
│  ┌───────────────────────────┐               ┌───────────────────────────┐  │
│  │   SQLite Nativo (Tauri)   │               │    IndexedDB (Dexie.js)   │  │
│  │   - $APP_DATA/aresta.db   │               │    - Banco 'aresta_local' │  │
│  │   - FS: $APP_DATA/books/  │               │    - OPFS para EPUBs/PDFs │  │
│  └─────────────┬─────────────┘               └─────────────┬─────────────┘  │
│                │                                           │                │
│                └─────────────────────┬─────────────────────┘                │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                 MOTOR DE SINCRONIZAÇÃO (Sync Engine)                  │  │
│  │  - Fila de mutações com timestamps UTC (`mutation_queue`)             │  │
│  │  - Detector automático online/offline e auto-sync a cada 60s          │  │
│  │  - Push de mutações locais & Pull de deltas remotos (`/api/sync`)     │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                         HTTPS / JSON  │ POST /api/sync
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        NUVEM / SERVIDOR BACKEND                             │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                  API REST EXPRESS (Node.js & Prisma ORM)              │  │
│  │  - Resolução de conflitos Last-Write-Wins (LWW) via updated_at        │  │
│  │  - Banco PostgreSQL central e orquestração de IA (aresta-ocr)         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes e Estrutura de Pastas

### Frontend (`front/app/`)
- `adapters/database/`:
  - `IDatabaseAdapter.ts`: Interface agnóstica de banco local.
  - `DexieAdapter.ts`: Driver IndexedDB com Dexie.js.
  - `TauriSqliteAdapter.ts`: Driver SQLite nativo para Desktop Tauri v2.
  - `InMemoryAdapter.ts`: Driver em memória para SSR e testes automatizados.
  - `DatabaseManager.ts`: Factory singleton que detecta o runtime e direciona para SQLite ou IndexedDB.
  - `repositories/`: `BookRepository`, `AnnotationRepository`, `FlashcardRepository`, `CanvasRepository`, `StreakRepository`.
- `adapters/storage/`:
  - `IBinaryStorageAdapter.ts`: Interface de armazenamento de arquivos binários.
  - `TauriFsStorageAdapter.ts`: Gravação de EPUBs e PDFs no diretório `$APP_DATA/books/`.
  - `OpfsStorageAdapter.ts`: Gravação no *Origin Private File System* do navegador.
  - `StorageManager.ts`: Singleton de resolução do storage de binários.
- `services/`:
  - `MutationQueueService.ts`: Gestão da fila de mutações pendentes.
- `composables/`:
  - `useSyncEngine.ts`: Gerenciador de sincronização em lote e conectividade.

### Desktop (`front/src-tauri/`)
- `tauri.conf.json`: Configurações de janela, ícones, segurança e alvos (`nsis`, `msi`, `appimage`, `deb`).
- `Cargo.toml`: Dependências Rust (`tauri-plugin-sql`, `tauri-plugin-fs`, `tauri-plugin-dialog`, `rusqlite`).
- `capabilities/default.json`: Permissões de sandbox dos plugins nativos.
- `src/main.rs` e `src/lib.rs`: Inicializador nativo da aplicação.

### Backend (`aresta-back-node/src/`)
- `services/sync.service.ts`: Processamento de lotes de mutações com resolução LWW e cálculo de deltas remotos.
- `controllers/sync.controller.ts`: Controller REST para `POST /api/sync`.
- `routes/sync.routes.ts`: Rota protegida por autenticação JWT.

---

## 3. Como Executar e Empacotar o Aplicativo Desktop

### 3.1. Instalação Automática de Dependências Desktop (1 Comando)
Para baixar e configurar automaticamente o Rust, Cargo e as dependências nativas:

```bash
npm run setup:desktop
```
*O script detecta o sistema operacional (Windows, Linux ou macOS), executa a instalação do Rustup e configura as bibliotecas necessárias.*

---

### 3.2. Comandos de Execução

| Comando | Descrição |
| :--- | :--- |
| `npm run setup:desktop` | Instala automaticamente o Rust, Cargo e dependências nativas no SO |
| `npm run desktop:dev` | Inicia o Nuxt + Tauri Desktop em modo desenvolvimento local (Hot-Reload) |
| `npm run desktop:build` | Compila os instaladores para Windows (`.exe`/`.msi`) e Linux (`.AppImage`/`.deb`) |

Os instaladores gerados ficam disponíveis em:
- **Windows**: `front/src-tauri/target/release/bundle/nsis/` (`.exe`) e `bundle/msi/` (`.msi`).
- **Linux**: `front/src-tauri/target/release/bundle/appimage/` (`.AppImage`) e `bundle/deb/` (`.deb`).

---

## 4. Estratégia de Sincronização e Resolução de Conflitos

1. **Escrita Instantânea**: Qualquer ação do usuário (alterar página, criar nota, avaliar flashcard) é salva no banco local em <5ms com status `sync_status: 'pending'`.
2. **Fila de Mutações**: A mutação é registrada com UUID v4 e timestamp UTC em `mutation_queue`.
3. **Despacho em Lote**:
   - Ao reconectar à internet ou no intervalo de 60s, o `useSyncEngine` reúne todas as mutações e chama `POST /api/sync`.
4. **Resolução no Servidor**:
   - O servidor avalia cada mutação: se o registro remoto possuir `updated_at` mais recente que a mutação, o estado do servidor prevalece (*Last-Write-Wins*). Caso contrário, a alteração do cliente é gravada na base central PostgreSQL.
5. **Aplicação de Deltas**:
   - O servidor retorna os deltas (livros, notas, flashcards, quadros modificados por outros dispositivos). O cliente atualiza sua base local e marca as mutações como `synced`.
