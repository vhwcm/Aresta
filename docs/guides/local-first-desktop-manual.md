# Manual Técnico: Arquitetura Local-First & Aplicativos Desktop e Mobile

Este guia documenta detalhadamente a arquitetura **Local-First**, os mecanismos de persistência local, o motor de sincronização bidirecional e o processo de desenvolvimento e build dos aplicativos **Desktop e Mobile (Android)** no ecossistema **Aresta**.

---

## 1. Visão Geral da Arquitetura

O Aresta adota a filosofia **Local-First**: os dados residem prioritariamente no dispositivo do usuário e todas as leituras, edições, destaques, flashcards e conexões de Canvas ocorrem instantaneamente em bancos de dados locais. A sincronização com a nuvem ocorre em segundo plano quando há conexão com a internet.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENTE (DESKTOP / ANDROID / WEB)                     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    INTERFACE APPS/WEB (NUXT 3 / VUE 3)                │  │
│  │   [ Leitor EPUB/PDF ]  [ Flashcards SRS ]  [ Canvas ]  [ Anotações ]  │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │             CAMADA DE REPOSITÓRIO (Local Repository Pattern)          │  │
│  │     - BookRepository         - AnnotationRepository                   │  │
│  │     - FlashcardRepository    - CanvasRepository  - StreakRepository   │  │
│  │     - LinkRepository         - DidacticBookletRepository              │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│                ┌─────────────────────┴─────────────────────┐                │
│                │                                           │                │
│     [Tauri v2: Desktop / Android]               [Navegador / PWA]           │
│                ▼                                           ▼                │
│  ┌───────────────────────────┐               ┌───────────────────────────┐  │
│  │   SQLite Nativo (Tauri)   │               │    IndexedDB (Dexie.js)   │  │
│  │   - $APP_DATA/aresta.db   │               │    - Banco 'aresta_local' │  │
│  │   - Fallback para Dexie   │               │    - OPFS para EPUBs/PDFs │  │
│  └─────────────┬─────────────┘               └─────────────┬─────────────┘  │
│                │                                           │                │
│                └─────────────────────┬─────────────────────┘                │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │          MOTOR DE SINCRONIZAÇÃO EM NUVEM (DriveSyncService)           │  │
│  │  - Last-Write-Wins (LWW) com timestamps UTC e Tombstones (CRDT)       │  │
│  │  - Backup estruturado JSON na pasta privada do Google Drive / iCloud  │  │
│  │  - Sincronização de biblioteca, anotações, flashcards e links         │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                         HTTPS / JSON  │ (OAuth / REST)
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    NUVEM / BACKEND MONÓLITO (apps/api)                      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                  API EXPRESS & PRISMA (apps/api :3001)                │  │
│  │  - Módulos: auth, reader, canvas, memory, ai                          │  │
│  │  - Banco PostgreSQL 16 com pgvector (busca semântica por embeddings)  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes e Estrutura de Pastas

### Frontend (`apps/web/app/`)
- `adapters/database/`:
  - `IDatabaseAdapter.ts`: Interface agnóstica de banco local.
  - `DexieAdapter.ts`: Driver IndexedDB com Dexie.js.
  - `TauriSqliteAdapter.ts`: Driver SQLite nativo para Tauri v2 com fallback resiliente para Dexie.
  - `InMemoryAdapter.ts`: Driver em memória para SSR e testes automatizados.
  - `DatabaseManager.ts`: Factory singleton que detecta o runtime e direciona para SQLite ou IndexedDB.
  - `repositories/`: `BookRepository`, `AnnotationRepository`, `FlashcardRepository`, `CanvasRepository`, `StreakRepository`, `LinkRepository`.
- `adapters/storage/`:
  - `IBinaryStorageAdapter.ts`: Interface de armazenamento de arquivos binários.
  - `TauriFsStorageAdapter.ts`: Gravação de EPUBs e PDFs no diretório `$APP_DATA/books/`.
  - `OpfsStorageAdapter.ts`: Gravação no *Origin Private File System* do navegador.
  - `StorageManager.ts`: Singleton de resolução do storage de binários.
- `services/`:
  - `DriveSyncService.ts`: Motor de sincronização com Google Drive / OneDrive / iCloud.
- `composables/`:
  - `useGoogleDriveSync.ts`: Composable de acionamento reativo da sincronização em nuvem.

### Desktop & Mobile (`apps/web/src-tauri/`)
- `tauri.conf.json`: Configurações de janela, ícones, segurança, capabilities e alvos.
- `Cargo.toml`: Dependências Rust (`tauri-plugin-sql`, `tauri-plugin-fs`, `tauri-plugin-dialog`, `rusqlite`).
- `capabilities/default.json`: Permissões de sandbox dos plugins nativos (SQL, FS, Dialog, Core).
- `src/main.rs` e `src/lib.rs`: Inicializador nativo da aplicação.
- `gen/android/`: Projeto Android nativo com suporte a fullscreen imersivo, safe-areas e APK de release.

### Backend (`apps/api/src/`)
- `modules/auth/`: Autenticação JWT, sessão e OAuth.
- `modules/reader/`: Catálogo de livros, metadados e arquivos.
- `modules/canvas/`: Gestão de quadros JSON Canvas.
- `modules/memory/`: Anotações, flashcards SRS (SM-2) e livretos didáticos.
- `modules/ai/`: Integração com Google Gemini SDK e busca vetorial `pgvector`.

---

## 3. Comandos de Execução e Empacotamento

### 3.1. Desktop (Tauri v2):
```bash
cd apps/web

# Execução em modo desenvolvimento local
npm run desktop:dev

# Empacotamento para desktop (Windows .exe / Linux .AppImage)
npm run desktop:build
```

### 3.2. Android (APK):
```bash
cd apps/web

# Build de APK em desenvolvimento
npx tauri android dev

# Build de APK de produção assinado (CI automatizado via tags v1.X.X)
npx tauri android build --apk
```

---

## 4. Estratégia de Sincronização e Resolução de Conflitos

1. **Escrita Instantânea**: Qualquer ação do usuário (alterar página, criar nota, avaliar flashcard, desenhar no canvas) é gravada no banco local em <5ms com status `sync_status: 'pending'`.
2. **Resolução Last-Write-Wins (LWW)**: Timestamps UTC (`updated_at`) determinam a versão prevalecente entre instâncias locais e arquivos na nuvem.
3. **Tombstones para Exclusões**: Registros excluídos gravam `deleted_at` com timestamp ISO para garantir que snapshots remotos antigos não ressuscitem entidades deletadas.
