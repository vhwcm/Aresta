# Requisitos: Sincronização de Temas e Conexões do Grafo com CRDT LWW e Semântica Unificada

## 1. Objetivo Geral
Resolver integralmente as anomalias e falhas estruturais de sincronização entre dispositivos no Grafo de Conhecimento e temas (15 achados diagnosticados), estabelecendo identidade canônica e determinística para temas, reconciliação CRDT Last-Write-Wins (LWW) com tombstones para temas e arestas em `graph_meta`, semântica unificada de vínculos (tags, themes, links, edges), unificação do serviço de mutação de temas entre sidebar e grafo, blindagem do ciclo de vida de auto-sync e testes automatizados TDD.

## 2. Escopo
- **Incluído**:
  - Identidade determinística canônica de temas `hash(nome normalizado)` em todos os pontos de criação (useGraph, useWorkspaceSidebar, upload, reader) com migração retrocompatível de IDs legados.
  - Formato `GraphMeta v2` com campos CRDT (`updated_at`, `updated_by`, `deleted_at`) por tema e por aresta (`EdgeRecord`).
  - IDs canônicos de arestas orientadas ou não-orientadas `min(src,tgt)---max(src,tgt)` evitando arestas duplicadas/invertidas.
  - Algoritmo de merge LWW de 3 vias com tombstones em `DriveSyncService.ts` para `graph_meta.json` e `library.json` (resolvendo ressurreição de temas/arestas e remoção de temas em livros).
  - Semântica única e estrita por vínculo de nó:
    - Nota/Desenho/Link/Quadro ↔ Tema: grava/remove em `tags[]`.
    - Livro/Anotação ↔ Tema: grava/remove em `themes[]`.
    - Nota ↔ Livro/Quadro: grava/remove em `links[]`.
    - Tema ↔ Tema e Livro ↔ Livro: grava/remove em `graphMeta.edges`.
  - Atualização completa de `unlinkEdge` e conexões manuais/drag-and-drop para respeitar a tabela de semântica sem deixar arestas fantasmas ou órfãs.
  - Serviço unificado de mutação de temas (`ThemeMutationService` / composable compartilhado) para renomear e excluir temas atualizando atomicamente `graph_meta`, livros (`book.themes`), anotações (`annotation.themes`), notas/quadros/desenhos/links (`tags`) e arestas (`edges`).
  - Limpeza de `fetchGraph` eliminando reinjeção de arestas obsoletas em memória e rollback atômico de `localCustomEdges` em caso de erro.
  - Gerenciamento seguro do ciclo de vida do auto-sync global (singleton / ref-counting ou registrado no nível de app), debounce de mutações de grafo e re-execução pendente caso sync seja acionado durante execução.
  - Deduplicação de eventos e listeners no `GraphCanvas.vue` e `AppKnowledgeGraph.vue` (@connect-nodes e @delete-edge).
  - Bateria de testes TDD cobrindo os 15 achados.
- **Não Incluído**:
  - Alterações no schema Prisma / backend PostgreSQL (a sincronização em nuvem é local-first via Google Drive AppData / DriveSyncService).

## 3. Requisitos Funcionais

### R1. Identidade Canônica e Determinística de Tema
- **Descrição**: Todo tema/tag criado em qualquer interface (useGraph, useWorkspaceSidebar, FolderTagSidebar, upload, reader) deve gerar o ID idêntico determinístico a partir do nome normalizado (lowercase, trimmed, sem acentos supérfluos ou hash SHA-256/FNV-1a curto determinístico).
- **Atores**: Sistema / Usuário em qualquer dispositivo.
- **Regra de Validação**: Ao criar a tag "Filosofia" no celular e no desktop, ambas devem produzir o ID `theme-hash("filosofia")`. Na sincronização e no buildLocalGraph, a migração automática remapeia referências antigas em `book.themes`, `annotation.themes`, `tags` e `meta.edges`.

### R2. CRDT LWW com Tombstones para GraphMeta
- **Descrição**: `GraphThemeRecord` e `GraphEdgeRecord` devem possuir `updated_at: number`, `updated_by: string` (device/client ID) e `deleted_at?: number | null`.
- **Atores**: DriveSyncService / useGraph.
- **Regra de Validação**: Ao excluir um tema ou aresta, registra-se `deleted_at = Date.now()`. O merge compara o timestamp do registro local e remoto: o maior `updated_at`/`deleted_at` vence. Registros deletados nunca ressuscitam por união cega.

### R3. Merge de Três Vias e Prevenção de Lost Update
- **Descrição**: Antes de persistir o resultado do download remoto de `graph_meta.json` ou `library.json`, o serviço deve reler o estado local imediatamente antes da escrita para reconciliar mutações concorrentes ocorridas durante o download de rede.
- **Atores**: DriveSyncService.
- **Regra de Validação**: Se uma conexão for criada enquanto o download de sync estava em voo, a aresta recém-criada é incorporada ao merge final e não sobrescrita.

### R4. Semântica Estrita de Conexão e Desconexão (`unlinkEdge`)
- **Descrição**: Arestas visuais refletem com fidelidade a fonte de verdade do tipo de dado correspondente.
- **Atores**: GraphCanvas / useGraph / AppKnowledgeGraph.
- **Regra de Validação**:
  - Conectar e desconectar Nota/Desenho/Link/Quadro ↔ Tema atualiza estritamente `tags[]` no repositório correspondente e propaga reatividade.
  - Conectar e desconectar Livro/Anotação ↔ Tema atualiza `themes[]` em BookRepository e AnnotationRepository.
  - Conectar e desconectar Nota ↔ Livro/Quadro atualiza `links[]`.
  - Arestas puras em `graphMeta.edges` ficam restritas a conexões arbitrárias entre entidades sem campo de vínculo nativo (ex: Tema ↔ Tema).
  - `unlinkEdge` cobre todas as permutações e sentidos (A -> B e B -> A) sem falhas silenciosas.

### R5. Serviço Unificado de Mutação de Temas
- **Descrição**: Centralizar a lógica de renomear e excluir temas em um serviço/composable único usado tanto pela barra lateral (`useWorkspaceSidebar`) quanto pelo grafo (`useGraph`).
- **Atores**: Sidebar / Grafo / Reader.
- **Regra de Validação**: Ao renomear um tema, o serviço atualiza `graph_meta`, substitui o nome nas tags de notas, desenhos, quadros e links, atualiza o nome em `book.themes` e `annotation.themes`, e atualiza as arestas em `graph_meta.edges`. Ao excluir, aplica tombstone no meta e desvincula de todas as entidades.

### R6. Blindagem do Ciclo de Vida do Auto-Sync e Reatividade
- **Descrição**: O ciclo de auto-sync (intervalo, listeners de foco e online, BroadcastChannel) deve ter ciclo de vida singleton gerenciado no nível da aplicação ou com contagem de referências, evitando destruição prematura ao desmontar telas específicas. Mutações de grafo devem enfileirar gatilho debounced de sync. Se um sync estiver em execução, uma nova solicitação deve ser marcada como pendente e executada sequencialmente.
- **Atores**: useDriveSync / DriveSyncService.
- **Regra de Validação**: Navegar para fora do Grafo de Conhecimento mantém o polling de sync ativo. Mutações em conexões e temas agendam sync em background.

### R7. Limpeza de Eventos e Rollback no Canvas
- **Descrição**: Unificar eventos no `GraphCanvas.vue` e remover bindings duplicados no template de pais. Adicionar rollback para `localCustomEdges` caso a persistência assíncrona falhe.
- **Atores**: GraphCanvas / AppKnowledgeGraph / SidebarGraph.

## 4. Requisitos Não Funcionais
- **Performance**: Merge CRDT O(N) eficiente em memória, sem travamentos de UI.
- **Confiabilidade Local-First**: Operação offline total, reconciliação determinística sem perda de dados.
- **Testabilidade**: 100% de cobertura nos cenários de concorrência, tombstones, merge de 3 vias e unlinking.

## 5. Critérios de Aceite
- [ ] Criar e excluir arestas entre nós e temas no grafo sincroniza com Google Drive sem ressuscitação pós-ciclo de sync.
- [ ] Edição de nome e cor de tema propaga corretamente entre múltiplos dispositivos via LWW.
- [ ] IDs de temas gerados em dispositivos diferentes convergem para o mesmo hash canônico.
- [ ] Arrastar para vincular nota/livro a tema atualiza a entidade real e permite desvincular via `unlinkEdge`.
- [ ] Remover o último tema de um livro sincroniza a lista vazia sem ressuscitar vínculos antigos.
- [ ] Renomear ou excluir tema pela sidebar atualiza livros, anotações, notas, quadros e arestas sem duplicar nós.
- [ ] Ciclo de auto-sync continua operando normalmente após navegação entre páginas.
- [ ] Mutações simultâneas durante sincronização não sofrem Lost Update.
- [ ] Todos os testes unitários e de integração passam com 100% de sucesso.
