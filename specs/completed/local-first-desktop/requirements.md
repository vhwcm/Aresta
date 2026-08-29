# Requisitos: Local-First & Aplicativos Desktop (Windows e Linux)

## 1. Visão Geral e Objetivo
O objetivo desta funcionalidade é transformar o **Aresta** em uma aplicação **Local-First**, permitindo que os usuários realizem leitura de livros (.epub/.pdf), criação de anotações, gestão de flashcards, organização do Canvas e rastreamento de leitura com autonomia **100% offline**, persistindo dados localmente em banco de dados e arquivos locais, sincronizando de forma bidirecional com a nuvem quando houver conexão, além de empacotar o cliente nativo para **Windows** e **Linux** usando **Tauri v2**.

---

## 2. Requisitos Funcionais

### RF01: Persistência de Dados Local Unificada (Repository Pattern)
- O frontend deve persistir todas as entidades essenciais (livros, posições de leitura, anotações, destaques, flashcards, canvas nodes/edges, configurações de leitura, streaks) localmente antes de qualquer comunicação de rede.
- O driver local deve utilizar **SQLite nativo** via plugin Tauri no Desktop e **IndexedDB** (`Dexie.js`) na Web/PWA, compartilhando interfaces de repositório idênticas.

### RF02: Armazenamento Local de Arquivos Binários
- Arquivos `.epub`, `.pdf` e capas devem ser salvos diretamente no sistema de arquivos do sistema operacional (`$APP_DATA/books/`) no Desktop e via *OPFS / IndexedDB* no navegador.
- Os arquivos devem conter checksum de integridade (SHA-256) e permitir abertura instantânea (<50ms) sem requisições HTTP.

### RF03: Fila de Mutações e Sincronização Bidirecional (Sync Engine)
- Qualquer criação, edição ou exclusão local deve gerar um registro na tabela `mutation_queue` com UUID, timestamp e flag de pendência.
- O motor de sincronização deve detectar o estado de conectividade (`online`/`offline`) e, ao reconectar, despachar as mutações pendentes em lote para o endpoint `POST /api/sync`.
- O servidor e o cliente devem resolver conflitos utilizando a estratégia **Last-Write-Wins (LWW)** baseada no timestamp `updated_at`, com suporte a exclusões lógicas via `deleted_at`.
- O cliente deve solicitar ao servidor deltas de dados remotos ocorridos após seu último `last_sync_timestamp`.

### RF04: Flashcards e Revisão Offline
- O sistema de flashcards deve permitir a criação e revisão manual de flashcards baseados em anotações e destaques do leitor de forma 100% offline.
- A geração automatizada de flashcards via IA (Google Gemini) deve ser realizada pelo backend quando online e transmitida ao cliente via sincronização.

### RF05: Empacotamento Desktop com Tauri v2
- A aplicação desktop deve ser compilada com Tauri v2 integrando o frontend Nuxt 4 em modo SPA/SSG.
- Devem ser gerados instaladores nativos para:
  - **Windows**: `.exe` (NSIS) e `.msi`.
  - **Linux**: `.AppImage` e `.deb`.
- A janela do aplicativo desktop deve suportar salvar e restaurar tamanho, tema nativo escuro/claro e controle nativo de janelas.

---

## 3. Critérios de Aceite

- [ ] **Leitura e Anotações Offline**: É possível carregar um livro, alterar página, criar anotações e highlights com a rede totalmente desconectada (ou sem backend rodando).
- [ ] **Flashcards e Canvas Offline**: É possível criar e revisar flashcards, bem como editar nós do Canvas no ambiente desktop/navegador sem internet.
- [ ] **Sincronização com o Backend**: Ao reestabelecer conexão, as mutações criadas offline são propagadas para o backend e persistidas no PostgreSQL central sem erros.
- [ ] **Resolução de Conflitos**: Conflitos de alteração simultânea são resolvidos de forma determinística seguindo a regra Last-Write-Wins.
- [ ] **Builds Desktop**: O comando `npm run tauri:build` produz instaladores funcionais e testados para Windows (`.exe` / `.msi`) e Linux (`.AppImage` / `.deb`).
