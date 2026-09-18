# ADR-021: Tombstone Propagation and Raw Queries in Local-First Sync

## Status
Aceito

## Data
2026-09-18

## Contexto
No modelo mental Local-First do Aresta, o banco de dados cliente (Dexie/IndexedDB no navegador e SQLite nativo no Tauri Desktop) é a fonte imediata de verdade para operações de escrita e leitura de baixa latência (0ms). 

Anteriormente, quando um usuário excluía um recurso (como notas, quadros, livros, anotações ou flashcards), o banco gravava `deleted_at: timestamp`. Contudo, as consultas de leitura da interface visual (`getNotes()`, `getAnnotations()`, `getFlashcards()`, etc.) filtravam esses itens. Quando o serviço de sincronização (`DriveSyncService`) consultava os dados locais para mesclagem com o Google Drive/OneDrive, os itens excluídos não eram retornados.

Consequentemente, ao comparar um estado local vazio com o estado remoto na nuvem (que ainda continha os registros pré-exclusão), o algoritmo interpretava erroneamente que se tratava de uma nova entidade criada em outro dispositivo, disparando um salvamento local e ressuscitando os itens excluídos ("Zombie/Resurrection Bug").

## Decisão
1. **Separação entre Consultas de Interface e de Sincronização (`*Raw`)**:
   - Manter as funções convencionais (`getNotes()`, `getAnnotations()`, etc.) retornando apenas registros ativos (`deleted_at IS NULL`).
   - Adicionar métodos dedicados (`getNotesRaw()`, `getAnnotationsRaw()`, `getFlashcardsRaw()`, `getCanvasesRaw()`, `getDrawingNotesRaw()`, `getDidacticBookletsRaw()`) em `IDatabaseAdapter`, `DexieAdapter`, `InMemoryAdapter` e `TauriSqliteAdapter`, retornando a totalidade dos registros locais incluindo tombstones.

2. **LWW (Last-Write-Wins) com Suporte a Tombstones**:
   - No `DriveSyncService`, tanto em arquivos de coleção (`annotations.json`, `flashcards.json`, `library.json`) quanto em subpastas individuais (`notes/*.json`, `canvas/*.json`, `drawing_notes/*.json`), o reconciliador compara os timestamps de mutação e exclusão.
   - Quando `winner.deleted_at` estiver presente:
     - Se o tombstone local for mais recente: o envelope com `deleted_at` é propagado para o Drive.
     - Se o tombstone remoto for mais recente: a exclusão local é aplicada via `deleteLocal(id)` sem ressuscitar a entidade.

3. **Reconciliação Determinística**:
   - Entidades marcadas com `deleted_at` não são re-injetadas no banco de dados local durante as passagens de download.

## Diagrama de Fluxo LWW com Tombstones

```
+-------------------+                          +-------------------+
|  Dispositivo A    |                          |   Google Drive    |
| (Exclui Recurso)  |                          | (Nuvem de Backup) |
+-------------------+                          +-------------------+
          |                                              |
     Grava local:                                        |
  deleted_at: 19:30                                      |
  updated_at: 19:30                                      |
          |                                              |
     Executa Sync                                        |
  (DriveSyncService)                                     |
          |                                              |
   Lê getNotesRaw()                                      |
  (Local Tombstone)                                      |
          |                                              |
          |-------- Envia envelope com deleted_at ------>|
          |                                              |
                                                         |
+-------------------+                                    |
|  Dispositivo B    |                                    |
| (Sync Periódico)  |                                    |
+-------------------+                                    |
          |                                              |
          |<------- Baixa envelope com deleted_at -------|
          |                                              |
   Detecta winner:                                       |
    deleted_at                                           |
          |                                              |
   Aplica local:                                         |
  deleteLocal(id)                                        |
(Sem ressurreição)                                       |
```

## Consequências
- **Positivas**:
  - Eliminação total de ressurreições de entidades deletadas após sincronização.
  - Consistência eventual garantida entre múltiplos dispositivos (web e desktop).
  - Propagação transparente de exclusões através de provedores em nuvem (Google Drive, OneDrive, iCloud Folder).
- **Negativas / Cuidados**:
  - Necessidade futura de um processo de Garbage Collection (expurgo de tombstones após 30/60 dias) para manter os arquivos JSON enxutos.
