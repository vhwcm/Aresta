# Design Técnico: Local-First & Aplicativos Desktop (Windows e Linux)

## 1. Arquitetura do Sistema

A arquitetura adota o padrão **Local-First**, onde o cliente detém uma cópia completa de seus dados e opera de forma autônoma sem conexão com a internet.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      ARESTA DESKTOP (Tauri v2) / WEB PWA                         │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                    INTERFACE DE USUÁRIO (Nuxt 4 / Vue 3)                   │  │
│  │  [ Leitor EPUB/PDF ]  [ Flashcards SRS ]  [ Canvas ]  [ Anotações/Destaques]│  │
│  └──────────────────────────────────────┬─────────────────────────────────────┘  │
│                                         │                                        │
│                                         ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │               CAMADA DE ABSTRAÇÃO DE REPOSITÓRIO (Local Repository)        │  │
│  │  - BookRepository      - AnnotationRepository   - FlashcardRepository      │  │
│  │  - CanvasRepository    - StreakRepository       - SettingsRepository       │  │
│  └───────────────────┬───────────────────────────────────┬────────────────────┘  │
│                      │                                   │                       │
│        [Desktop]     ▼                     [Web Browser] ▼                       │
│  ┌───────────────────────────────┐         ┌───────────────────────────────┐     │
│  │  Tauri SQLite (`aresta.db`)   │         │  IndexedDB (Dexie.js)         │     │
│  │  + Tauri FS (`$APP_DATA/`)    │         │  + OPFS (Browser Filesystem)  │     │
│  └──────────────┬────────────────┘         └─────────────┬─────────────────┘     │
│                 │                                        │                       │
│                 └───────────────────┬────────────────────┘                       │
│                                     ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                     MOTOR DE SINCRONIZAÇÃO (Sync Engine)                   │  │
│  │  - Fila de Mutações Locais (Pending Mutations Queue)                       │  │
│  │  - Monitor de Conectividade de Rede (Online / Offline Event Listener)      │  │
│  │  - Push de mutações locais & Pull de deltas remotos (`POST /api/sync`)     │  │
│  └──────────────────────────────────┬─────────────────────────────────────────┘  │
└─────────────────────────────────────┼────────────────────────────────────────────┘
                                      │
                                      │ HTTPS (quando conectado)
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVIDOR (Docker Stack)                           │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                   API Express / Node.js (`/api/sync`)                      │  │
│  │  - Autenticação JWT e resolução LWW com `updated_at` / `deleted_at`        │  │
│  │  - Armazenamento centralizado via Prisma ORM (PostgreSQL)                  │  │
│  │  - Orquestrador gRPC para `aresta-ocr` / Gemini AI                         │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Contratos e Schemas de Dados

### 2.1. Fila de Mutações (`mutation_queue`)
Estrutura gravada no banco local (SQLite / IndexedDB):
```typescript
export interface LocalMutation {
  id: string; // UUID v4 gerado no cliente
  entity_type: 'book' | 'annotation' | 'flashcard' | 'canvas_node' | 'canvas_edge' | 'reading_progress' | 'streak';
  entity_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  client_timestamp: string; // ISO 8601 UTC
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  retry_count: number;
}
```

### 2.2. Contrato de Sincronização (`POST /api/sync`)

#### Request:
```typescript
export interface SyncRequestPayload {
  last_sync_timestamp: string | null; // Data do último sync com sucesso
  mutations: LocalMutation[];
}
```

#### Response:
```typescript
export interface SyncResponsePayload {
  server_timestamp: string; // Timestamp do servidor no momento do processamento
  processed_mutation_ids: string[];
  conflicts: Array<{
    mutation_id: string;
    reason: string;
    resolved_with: 'server_state' | 'client_state';
  }>;
  deltas: {
    books: any[];
    annotations: any[];
    flashcards: any[];
    canvas: any[];
    streaks: any[];
    deleted_ids: {
      [entity_type: string]: string[];
    };
  };
}
```

---

## 3. Repositórios Locais e Injeção de Dependência

Criação de interfaces unificadas em `front/app/adapters/database/`:
- `IDatabaseAdapter`: define métodos atômicos `query()`, `execute()`, `transaction()`.
- Implementação `TauriSqliteAdapter` (usando `@tauri-apps/plugin-sql`).
- Implementação `DexieIndexedDbAdapter` (usando `dexie`).
- Factory automática que detecta `window.__TAURI_INTERNALS__` para instanciar o driver correto de forma transparente.

---

## 4. Setup e Configuração do Tauri v2

1. **Configuração de Pacote (`front/src-tauri/tauri.conf.json`)**:
   - `identifier`: `com.aresta.app`
   - `build.beforeDevCommand`: `npm run dev`
   - `build.devUrl`: `http://localhost:3000`
   - `build.beforeBuildCommand`: `npm run generate`
   - `build.frontendDist`: `../dist`
2. **Plugins Nativos**:
   - `@tauri-apps/plugin-sql` (driver SQLite)
   - `@tauri-apps/plugin-fs` (gestão de diretórios de livros)
   - `@tauri-apps/plugin-dialog` (seleção de arquivos nativos)
   - `@tauri-apps/plugin-store` (persistência de preferências)
3. **Targets de Compilação**:
   - `x86_64-pc-windows-msvc` (Windows x64)
   - `x86_64-unknown-linux-gnu` (Linux x64)
