# ADR-003: Arquitetura Local-First e Distribuição Desktop Multiplataforma com Tauri v2

## Status
**Aceito e Implementado** (2026-08-29)

---

## Contexto
O **Aresta** é uma plataforma focada em leitura digital, retenção e síntese de conhecimento. Para oferecer uma experiência contínua, sem atrito e resiliente a falhas de rede, era imperativo transformar o sistema em **Local-First**, garantindo:
1. Leitura 100% offline de arquivos EPUB e PDF.
2. Criação, edição e revisão de notas, destaques, flashcards (SRS) e Canvas sem depender de conexão ativa com a internet.
3. Distribuição de executáveis desktop nativos, leves e seguros para **Windows** (`.exe` NSIS, `.msi`) e **Linux** (`.AppImage`, `.deb`).
4. Sincronização bidirecional em nuvem com resolução determinística de conflitos.

---

## Decisão

### 1. Framework Desktop: Tauri v2
- Adotamos **Tauri v2** em vez de Electron devido ao binário ultraleve (<20MB), consumo mínimo de memória RAM (WebView nativo do sistema operacional), segurança sandbox por padrão e ecossistema oficial de plugins Rust.

### 2. Persistência Local Unificada (Repository Pattern)
- **Desktop (Tauri)**: SQLite nativo através do plugin `@tauri-apps/plugin-sql` no banco local `$APP_DATA/aresta.db`.
- **Web / PWA**: IndexedDB tipado via `Dexie.js` com schemas relacionais e índices equivalentes.
- **Detecção Transparente**: O `DatabaseManager` instancia dinamicamente o driver adequado conforme o runtime (`isTauri`).

### 3. Gestão e Cache de Binários (EPUBs/PDFs)
- **Desktop**: Armazenamento no disco local via `@tauri-apps/plugin-fs` em `$APP_DATA/books/`.
- **Web**: *Origin Private File System (OPFS)* com fallback para IndexedDB ArrayBuffer.

### 4. Motor de Sincronização Bidirecional (Sync Engine)
- Fila de Mutações (`mutation_queue`) persistida localmente com timestamps UTC e status de sincronização (`pending` / `synced`).
- Resolução de conflitos baseada em **Last-Write-Wins (LWW)** com suporte a *soft deletes* (`deleted_at`).
- Endpoint `POST /api/sync` no Backend Node.js processa lotes de mutações dentro de transações Prisma e retorna deltas remotos baseados em `last_sync_timestamp`.

### 5. Flashcards e IA no Modo Offline
- A geração automatizada por IA (Gemini) ocorre no servidor quando online.
- O estudo e a autoavaliação (SRS) operam 100% offline no cliente.
- Usuários podem converter anotações de leitura em flashcards de revisão manuais diretamente no cliente offline sem IA.

---

## Consequências

### Positivas
- **Velocidade Extrema**: Leituras e consultas locais ocorrem em menos de 10ms.
- **Autonomia Total**: Usuários podem ler e revisar em viagens, aviões ou locais sem sinal.
- **Baixo Custo de Servidor**: O backend deixa de receber requisições síncronas para cada highlight/página, processando deltas consolidados em lote.
- **Multiplataforma**: Código de frontend 100% reutilizado entre Web e Desktop nativo.

### Considerações
- O empacotamento desktop final requer o compilador Rust (`cargo`) e as dependências nativas de sistema (`webkit2gtk` no Linux, WebView2 no Windows).
