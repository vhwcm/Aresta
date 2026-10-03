# Design Técnico: Sincronização de Temas e Conexões do Grafo com CRDT LWW e Semântica Unificada

## 1. Visão Geral da Arquitetura

O sistema de temas e grafo de conhecimento do Aresta é local-first, utilizando armazenamento desacoplado (Dexie/IndexedDB, localStorage e SQLite no Tauri) com sincronização em nuvem peer-to-peer via Google Drive AppData (`DriveSyncService.ts`).

Esta arquitetura introduz:
1. **Identidade Canônica Determinística**: `getCanonicalThemeId(name)` mapeia qualquer nome para `theme-hash(normalize(name))`, unificando a chave de identidade entre todos os dispositivos.
2. **GraphMeta v2 com CRDT LWW e Tombstones**:
   - `themes: Record<string, GraphThemeRecord>` e `edges: Record<string, GraphEdgeRecord>` onde cada item possui `updated_at: number`, `updated_by: string`, `deleted_at?: number | null`.
   - `canonicalEdgeId(source, target)` ordenado lexicograficamente `min(src, tgt)---max(src, tgt)`.
3. **Merge de 3 Vias (Three-Way Snapshot Merge)**:
   - Snapshot inicial local no início do sync.
   - Download e merge LWW com o snapshot remoto.
   - Re-leitura do snapshot local corrente e merge das mutações ocorridas durante a chamada de rede antes da gravação final.
4. **Tabela de Semântica Estrita de Vínculos**:
   - Vínculos entre nós e temas/pastas são projetados diretamente nas propriedades das entidades subjacentes (`tags[]`, `themes[]`, `links[]`).
   - Arestas customizadas em `graphMeta.edges` existem exclusivamente para relações não suportadas nativamente nas entidades (ex: Tema ↔ Tema).
5. **Serviço Centralizado de Mutação de Temas (`ThemeManagementService`)**:
   - Coordena renomeações e exclusões em cascata com atomicidade em todos os repositórios locais e dispara reconciliação debounced no DriveSyncService.
6. **Gerenciamento de Ciclo de Vida Singleton para o Drive Sync**:
   - `useDriveSync` atua como bridge reativo para uma instância persistente global de listeners, garantindo que a desmontagem de componentes de página não encerre o auto-sync.

## 2. Diagrama Visual de Fluxo
Consulte o diagrama detalhado em: `diagrams/flow.txt`

## 3. Contratos de Dados e Tipos TypeScript

### 3.1. Estrutura GraphMeta v2
```typescript
export interface GraphThemeRecord {
  id: string; // theme-<hash>
  name: string;
  color?: string;
  description?: string;
  updated_at: number;
  updated_by: string;
  deleted_at?: number | null;
}

export interface GraphEdgeRecord {
  id: string; // min(source, target)---max(source, target)
  source: string;
  target: string;
  type?: string;
  updated_at: number;
  updated_by: string;
  deleted_at?: number | null;
}

export interface GraphMetaV2 {
  version: 2;
  themes: Record<string, GraphThemeRecord>;
  edges: Record<string, GraphEdgeRecord>;
  schema_version: number;
  updated_at: number;
}
```

### 3.2. Funções Canônicas Utilitárias
```typescript
export function normalizeThemeName(name: string): string {
  return name.trim().toLowerCase();
}

export function generateDeterministicHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function getCanonicalThemeId(name: string): string {
  return `theme-${generateDeterministicHash(normalizeThemeName(name))}`;
}

export function getCanonicalEdgeId(source: string, target: string): string {
  const [a, b] = [source, target].sort();
  return `${a}---${b}`;
}
```

### 3.3. Tabela de Semântica de Vínculos
| Origem / Destino | Alvo / Destino | Onde Persistir | Como Desvincular (`unlinkEdge`) |
| :--- | :--- | :--- | :--- |
| `note-<id>` / `drawing-<id>` | `theme-<id>` | `tags[]` no registro da nota/desenho | Remove nome do tema de `tags[]` |
| `canvas-<id>` / `link-<id>` | `theme-<id>` | `tags[]` no registro do quadro/link | Remove nome do tema de `tags[]` |
| `book-<id>` / `annotation-<id>` | `theme-<id>` | `themes[]` em Book / Annotation | Remove theme object/id de `themes[]` |
| `note-<id>` | `book-<id>` / `canvas-<id>` | `links[]` no NoteRepository | Remove link para a entidade em `links[]` |
| `theme-<id>` | `theme-<id>` | `graphMeta.edges` (GraphEdgeRecord) | Seta `deleted_at = now()` em `graphMeta.edges` |
| `book-<id>` | `book-<id>` | `graphMeta.edges` (GraphEdgeRecord) | Seta `deleted_at = now()` em `graphMeta.edges` |

## 4. Algoritmo de Merge CRDT LWW (3 Vias)

```typescript
export function mergeGraphMetaLWW(
  baseLocal: GraphMetaV2,
  remote: GraphMetaV2,
  currentLocal: GraphMetaV2,
  clientId: string
): GraphMetaV2 {
  // 1. Reconciliação de Temas (Remote x BaseLocal)
  const mergedThemes: Record<string, GraphThemeRecord> = {};
  const allThemeIds = new Set([
    ...Object.keys(currentLocal.themes || {}),
    ...Object.keys(remote.themes || {})
  ]);

  for (const id of allThemeIds) {
    const localTheme = currentLocal.themes?.[id];
    const remoteTheme = remote.themes?.[id];

    if (!localTheme) {
      mergedThemes[id] = remoteTheme!;
    } else if (!remoteTheme) {
      mergedThemes[id] = localTheme;
    } else {
      // LWW: o que tiver maior updated_at / deleted_at vence
      const localTime = Math.max(localTheme.updated_at, localTheme.deleted_at || 0);
      const remoteTime = Math.max(remoteTheme.updated_at, remoteTheme.deleted_at || 0);
      mergedThemes[id] = remoteTime > localTime ? remoteTheme : localTheme;
    }
  }

  // 2. Reconciliação de Arestas (Remote x BaseLocal)
  const mergedEdges: Record<string, GraphEdgeRecord> = {};
  const allEdgeIds = new Set([
    ...Object.keys(currentLocal.edges || {}),
    ...Object.keys(remote.edges || {})
  ]);

  for (const id of allEdgeIds) {
    const localEdge = currentLocal.edges?.[id];
    const remoteEdge = remote.edges?.[id];

    if (!localEdge) {
      mergedEdges[id] = remoteEdge!;
    } else if (!remoteEdge) {
      mergedEdges[id] = localEdge;
    } else {
      const localTime = Math.max(localEdge.updated_at, localEdge.deleted_at || 0);
      const remoteTime = Math.max(remoteEdge.updated_at, remoteEdge.deleted_at || 0);
      mergedEdges[id] = remoteTime > localTime ? remoteEdge : localEdge;
    }
  }

  return {
    version: 2,
    themes: mergedThemes,
    edges: mergedEdges,
    schema_version: 2,
    updated_at: Date.now()
  };
}
```

## 5. Componentes Frontend & Serviços Afetados

- **`apps/web/app/services/DriveSyncService.ts`**:
  - Implementar merge LWW e 3-way reconciliation para `graph_meta.json` e `library.json`.
  - Proteger deleção do último tema de um livro.
- **`apps/web/app/utils/graphMeta.ts`**:
  - Migração de GraphMeta v1 para v2 com geradores de IDs canônicos e tombstones.
- **`apps/web/app/services/ThemeManagementService.ts`**:
  - Serviço unificado de mutação: `renameTheme(oldName, newName, color)`, `deleteTheme(nameOrId)`.
- **`apps/web/app/composables/useGraph.ts`**:
  - Atualizar `createConnection`, `unlinkEdge`, `createNode`, `deleteNode`, `updateNode` para a nova semântica e IDs canônicos.
  - Eliminar re-injeção de arestas órfãs/antigas em `fetchGraph`.
- **`apps/web/app/composables/useWorkspaceSidebar.ts`**:
  - Delegar rename e delete para `ThemeManagementService`.
- **`apps/web/app/composables/useDriveSync.ts`**:
  - Desacoplar listeners do ciclo de vida de componentes com singleton global / ref counting.
  - Gatilho reativo/debounced para mutações no grafo.
- **`apps/web/app/components/canvas/GraphCanvas.vue`**:
  - Deduplicação de emissões de eventos `@connect-nodes` e `@delete-edge`.
  - Rollback de `localCustomEdges` em caso de erro.

## 6. Tratamento de Erros & Fallbacks
- Se `graph_meta.json` remoto for formato v1 (legado sem timestamps), executar conversão inline atribuindo timestamps correntes e IDs canônicos.
- Se a escrita local ou remota falhar, `localCustomEdges` faz rollback para o estado anterior e notifica o usuário via toast amigável.

## 7. Estratégia de Testes (TDD)
- **Unitários / Integração (`tests/unit/services/DriveSyncService.test.ts`)**:
  - Testar merge de temas com tombstones e LWW (renomeação e alteração de cor).
  - Testar merge de arestas com tombstones (deleção de conexão).
  - Testar convergência de IDs determinísticos entre dispositivos.
  - Testar remoção do último tema de um livro (evitar ressuscitação de vínculo).
  - Testar merge de 3 vias (mutação local durante download não é perdida).
  - Testar `unlinkEdge` para todos os pares da tabela de semântica.
