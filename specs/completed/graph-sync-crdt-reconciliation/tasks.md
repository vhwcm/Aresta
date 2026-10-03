# Tarefas de Implementação: Sincronização de Temas e Conexões do Grafo com CRDT LWW e Semântica Unificada

## Checklist de Execução

- [ ] **1. Identidade Canônica e Estruturas de Dados (`utils/graphMeta.ts` & `utils/themeIdentity.ts`)**
  - [ ] 1.1 Criar utilitário de identidade determinística `getCanonicalThemeId`, `normalizeThemeName` e `getCanonicalEdgeId`.
  - [ ] 1.2 Refatorar `graphMeta.ts` para interface `GraphMetaV2` com tombstones (`deleted_at`), timestamps (`updated_at`, `updated_by`) e migração automática de v1 para v2.
  - [ ] 1.3 Adicionar testes unitários para a geração determinística de IDs e normalização.

- [ ] **2. Reconciliação CRDT LWW e 3-Way Merge (`DriveSyncService.ts`)**
  - [ ] 2.1 Implementar função de merge LWW de 3 vias com tombstones para `graph_meta.json`.
  - [ ] 2.2 Implementar merge seguro para `library.json` tratando remoção completa de temas em livros sem fallback cego.
  - [ ] 2.3 Implementar re-leitura do snapshot local imediatamente antes do salvamento final prevenindo Lost Update.
  - [ ] 2.4 Criar testes TDD abrangentes para todos os casos de merge (tombstones, renomeação, concorrência, deleção de tema em livros).

- [ ] **3. Semântica Estrita de Vínculos e Desconexão (`useGraph.ts` & `AppKnowledgeGraph.vue`)**
  - [ ] 3.1 Atualizar `createConnection` e drag-and-drop para gravar nas entidades nativas (`tags[]`, `themes[]`, `links[]`) e apenas arestas customizadas em `graphMeta.edges`.
  - [ ] 3.2 Reformular `unlinkEdge` para desvincular bidirecionalmente conforme a tabela de semântica estrita para todos os tipos (notas, livros, anotações, desenhos, quadros, links).
  - [ ] 3.3 Eliminar reinjeção de arestas obsoletas em memória dentro de `fetchGraph`.
  - [ ] 3.4 Implementar rollback atômico em `localCustomEdges` no caso de erro de persistência.

- [ ] **4. Serviço Unificado de Mutação de Temas (`ThemeManagementService.ts`)**
  - [ ] 4.1 Criar `ThemeManagementService` centralizando renomeação e exclusão atômica em `graph_meta`, livros, anotações, notas, quadros, desenhos e links.
  - [ ] 4.2 Refatorar `useWorkspaceSidebar.ts` e `useGraph.ts` para consumir o serviço unificado.
  - [ ] 4.3 Garantir que listeners do `localStorage` e eventos reativos atualizem o grafo e a sidebar simultaneamente.

- [ ] **5. Ciclo de Vida do Auto-Sync e Deduplicação de Handlers UI**
  - [ ] 5.1 Blindar `useDriveSync.ts` com gerenciamento de ciclo de vida persistente (singleton) e debounce de mutações de grafo.
  - [ ] 5.2 Implementar enfileiramento de sync pendente quando um ciclo já estiver em execução.
  - [ ] 5.3 Deduplicar emissões de eventos (`connectNodes` / `connect-nodes`) e binds no `GraphCanvas.vue` e componentes pais.

- [ ] **6. Quality Gates, ADR & Documentação**
  - [ ] 6.1 Executar suíte completa de testes (`npm test`) garantindo 100% de aprovação.
  - [ ] 6.2 Criar ADR documentando a arquitetura CRDT LWW e identidade canônica.
  - [ ] 6.3 Atualizar documentação em `docs/domain/` ou `docs/architecture/`.
  - [ ] 6.4 Mover spec para `specs/completed/` e atualizar `checklist.md`.
