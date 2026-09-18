# ADR-018: Sincronização Cross-Origin do Grafo de Conhecimento e Biblioteca de Livros via Cloud Drive

## Status
Aceito e Implementado

## Data
2026-09-18

## Contexto
O Aresta utiliza o modelo Local-First, armazenando dados pessoais (livros, anotações, notas, temas e canvas) no IndexedDB e LocalStorage do navegador.
Devido à política de segurança de mesma origem dos navegadores (*Same-Origin Policy*), o armazenamento local de `http://localhost:3000` é completamente isolado da instância em produção na AWS (`https://...`), gerando grafos de conhecimento divergentes quando o mesmo usuário acessava a aplicação em domínios ou navegadores distintos.

Adicionalmente:
1. O `DriveSyncService` sincronizava anotações, flashcards, canvas e notas, mas não sincronizava a coleção de livros locais (`LocalBook`) nem os metadados e arestas manuais do grafo (`aresta_graph_meta`).
2. O `useDriveSync` operava apenas dentro de `DriveSettingsPanel.vue`, sem ativação no ciclo global do aplicativo.
3. Ao logar via OAuth em uma nova origem (como na AWS), o provedor de drive não era auto-vinculado no `localStorage` local.

## Decisão

1. **Inclusão de `library.json` e `graph_meta.json` no `DriveSyncService`**:
   - `syncLibrary()`: sincroniza os livros locais (`LocalBook`) com `Aresta/v1/data/library.json`, preservando títulos, capas, status de leitura, progresso e os temas associados (`themes`). O merge resolve conflitos por LWW (*Last-Write-Wins*) e faz deduplicação inteligente por `id` e `title`.
   - `syncGraphMeta()`: sincroniza os temas (`themes`) e conexões (`edges`) manuais do grafo com `Aresta/v1/data/graph_meta.json`.
2. **Ativação Global no Ciclo de Vida (`app.vue`)**:
   - O `useDriveSync` passa a ser inicializado na raiz do aplicativo com ouvintes para eventos de reconexão (`online`), visibilidade (`visibilitychange`) e verificação periódica.
3. **Auto-vínculo e Revalidação Reativa**:
   - No login/conexão OAuth, o provedor é persistido imediatamente. Se um usuário autenticado abrir uma nova origem sem cache local, o `resolveProvider` detecta a conta vinculada via backend e inicia a sincronização automaticamente.
   - Pós-sincronização bem-sucedida, `useUserBooks().fetchUserBooks()` e `useGraph().fetchGraph()` são acionados reativamente para atualizar a interface sem necessidade de reload manual.

## Consequências

### Positivas
- O Grafo de Conhecimento, Temas, Livros e Capas permanecem 100% idênticos e convergentes entre Localhost, AWS e múltiplos dispositivos.
- Continuidade da garantia de privacidade zero-knowledge: dados pessoais não são persistidos no PostgreSQL da AWS.
- Atualização transparente e reativa na interface do usuário.

### Custos e Riscos
- Mutações locais dependem de conexão com a internet para propagação ao Google Drive ou OneDrive.
- Casos de concorrência offline prolongada são resolvidos por LWW com timestamp UTC e desempate determinístico por `deviceId`.
