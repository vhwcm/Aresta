# Requisitos: Drive User Data Sync — Todos os Dados no Drive do Usuário

## 1. Objetivo Geral

Migrar o armazenamento de todos os dados pessoais do usuário (anotações, flashcards, canvas, notas, notas de desenho, streak e configurações) do banco de dados PostgreSQL na AWS para o Drive pessoal do usuário (Google Drive, Microsoft OneDrive ou iCloud Drive via pasta local). Os dados continuarão existindo localmente (SQLite/IndexedDB) e passarão a ser sincronizados com o Drive em background, adotando o padrão Local-First. O backend AWS passará a servir apenas autenticação, IA e catálogo público de livros.

## 2. Escopo

- **Incluído**:
  - Interface `IDataSyncProvider` para operações de JSON no Drive
  - Implementações para Google Drive e OneDrive
  - Adapter para iCloud via pasta local monitorada (Tauri)
  - `DriveSyncService` — motor de sincronização bidirecional
  - `useDriveSync` — composable Vue para exposição de estado de sync à UI
  - Expansão do `IDatabaseAdapter` para `Notes`, `DrawingNotes` e `UserSettings`
  - UI `DriveSettingsPanel.vue` para configuração de sync
  - Endpoint de exportação `/api/export/my-data` (migração one-shot)
  - ADR-016 documentando a decisão

- **Não Incluído**:
  - Remoção das tabelas do PostgreSQL (Fase 6 — posterior)
  - Deprecação das rotas de API do backend (Fase 5 — posterior)
  - Integração com iCloud API nativa (CloudKit) — apenas pasta local

## 3. Requisitos Funcionais

### R1. Interface IDataSyncProvider
- **Descrição**: Contrato TypeScript para operações de JSON no Drive, estendendo ICloudStorageProvider.
- **Atores**: Sistema
- **Regra de Validação**: Implementada pelos três providers. Sem breaking changes.

### R2. Sincronização de Anotações e Flashcards
- **Descrição**: Serializados como annotations.json e flashcards.json em Aresta/data/. Toda escrita local aciona sync em background.
- **Atores**: Usuário Autenticado, Sistema
- **Regra de Validação**: Conflito por updated_at (LWW). Merge field-by-field.

### R3. Sincronização de Canvas, Notas e Notas de Desenho
- **Descrição**: Um arquivo JSON por item em Aresta/data/canvas/, notes/, drawing_notes/.
- **Atores**: Usuário Autenticado, Sistema
- **Regra de Validação**: Soft delete via deleted_at. Purga após 30 dias.

### R4. Sincronização de Perfil e Configurações
- **Descrição**: Streak e UserSettings em Aresta/data/profile.json.
- **Atores**: Sistema
- **Regra de Validação**: Escritas de streak debounced 10s.

### R5. Pull Inicial (Novo Dispositivo)
- **Descrição**: Banco local vazio + Drive conectado = download completo antes de renderizar UI.
- **Atores**: Sistema
- **Regra de Validação**: Loading state visível. Timeout 30s com fallback local.

### R6. Sync Automático em Background
- **Descrição**: Sync em: (a) volta online, (b) visibilitychange, (c) intervalo 5min.
- **Atores**: Sistema
- **Regra de Validação**: Idempotente. Lock por flag isSyncing.

### R7. DriveSettingsPanel
- **Descrição**: Painel de configurações para gerenciar provider, status, trigger e desconexão.
- **Atores**: Usuário Autenticado
- **Regra de Validação**: Provider, timestamp última sync, pendentes, botões de ação.

### R8. Exportação /api/export/my-data
- **Descrição**: Endpoint que retorna JSON de todos os dados do usuário para migração.
- **Atores**: Usuário Autenticado
- **Regra de Validação**: JWT obrigatório. Dados apenas do usuário logado.

## 4. Requisitos Não Funcionais

- **Performance**: Upload de coleção JSON < 3s para 500 itens. Canvas individual < 2s.
- **Segurança**: Access tokens apenas em memória. Relay seguro via backend.
- **Compatibilidade**: Tauri v2 (Windows/Linux/macOS) e Web (Chrome, Firefox, Safari).
- **Resiliência**: Falhas de sync não bloqueiam UI. Retry com backoff exponencial (3x).

## 5. Critérios de Aceite

- [ ] Estrutura Aresta/data/ criada automaticamente ao conectar Google Drive
- [ ] Criar anotação dispara upload de annotations.json em < 5s
- [ ] Segundo dispositivo carrega anotações corretas do Drive
- [ ] Conflito de updated_at resolve corretamente (mais recente vence)
- [ ] OneDrive funciona com o mesmo fluxo do Google Drive
- [ ] iCloud funciona via pasta local em macOS com Tauri
- [ ] DriveSettingsPanel exibe provider, status e última sync corretamente
- [ ] Pull inicial mostra loading e popula banco local antes de renderizar
- [ ] Sync automático dispara ao voltar online
- [ ] /api/export/my-data retorna JSON completo do usuário autenticado
