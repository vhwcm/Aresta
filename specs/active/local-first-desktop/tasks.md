# Checklist de Tarefas: Local-First & Aplicativos Desktop (Windows e Linux)

## Fase 1: Camada de Repositório Local e Persistência no Frontend
- [x] 1.1. Instalar `dexie` no frontend para gerenciamento tipado do IndexedDB.
- [x] 1.2. Criar interfaces abstratas de banco e repositórios em `front/app/adapters/database/`:
  - `IDatabaseAdapter.ts`, `IBookRepository.ts`, `IAnnotationRepository.ts`, `IFlashcardRepository.ts`, `ICanvasRepository.ts`, `IStreakRepository.ts`.
- [x] 1.3. Implementar driver Dexie IndexedDB (`DexieAdapter.ts`) com schema e tabelas locais.
- [x] 1.4. Refatorar composables (`useUserBooks.ts`, `useAnnotations.ts`, `useFlashcards.ts`, `useCanvas.ts`, `useReadingStreak.ts`) para ler/gravar localmente primeiro.
- [x] 1.5. Adicionar funcionalidade para transformar anotações/destaques de leitura em flashcards de revisão manuais 100% offline.

## Fase 2: Configuração e Setup do Tauri v2 (Desktop Windows e Linux)
- [x] 2.1. Inicializar estrutura do Tauri v2 em `front/src-tauri` com `tauri.conf.json` e dependências Rust.
- [x] 2.2. Adicionar plugins oficiais do Tauri: `@tauri-apps/plugin-sql` (SQLite), `@tauri-apps/plugin-fs` e `@tauri-apps/plugin-dialog`.
- [x] 2.3. Implementar driver `TauriSqliteAdapter.ts` que implementa `IDatabaseAdapter` para desktop.
- [x] 2.4. Configurar scripts de build no `front/package.json` (`tauri:dev`, `tauri:build`) para Windows (.exe NSIS, .msi) e Linux (.AppImage, .deb).

## Fase 3: Motor de Sincronização Bidirecional (Sync Engine)
- [x] 3.1. Criar tabela local `mutation_queue` e serviço `MutationQueueService.ts`.
- [x] 3.2. Criar composable `useSyncEngine.ts` com listener de eventos online/offline e agendamento de sincronização em lote.
- [x] 3.3. Adicionar campos de auditoria no `schema.prisma` do backend se necessário (`updated_at`, `deleted_at`).
- [x] 3.4. Implementar controller e rota `POST /api/sync` no Backend Node.js com resolução Last-Write-Wins (LWW) e envio de deltas.

## Fase 4: Gestão de Arquivos Binários (EPUBs/PDFs e Capas)
- [ ] 4.1. Criar `TauriFsStorageAdapter.ts` para salvar e recuperar binários na pasta `$APP_DATA/books/`.
- [ ] 4.2. Criar `OpfsStorageAdapter.ts` para persistência via OPFS no navegador.
- [ ] 4.3. Atualizar `readerStore.ts` e leitor digital para abrir arquivos diretamente do caminho local nativo.

## Fase 5: Testes, Validação e Atualização da Documentação
- [ ] 5.1. Escrever testes unitários para a camada de repositório e resolução de conflitos de sincronização.
- [ ] 5.2. Testar o fluxo completo offline -> alteração -> reconexão -> sincronização no backend.
- [ ] 5.3. Atualizar `docs/architecture/` e criar ADR para a arquitetura Tauri + Local-First.
