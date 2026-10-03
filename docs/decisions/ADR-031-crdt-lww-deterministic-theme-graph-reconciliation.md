# ADR-031: Reconciliação CRDT LWW, Identidade Canônica e Tombstones para o Grafo de Conhecimento e Temas

## Contexto
O ecossistema Local-First do Aresta sincroniza coleções de livros, anotações, notas markdown, quadros conceituais, desenhos vetoriais e metadados visuais do grafo de conhecimento através de arquivos JSON no Google Drive AppData.

Anteriormente, a sincronização de temas e conexões do grafo apresentava 15 vulnerabilidades estruturais críticas e de alta prioridade:
1. **Ressurreição de Itens Excluídos**: `graph_meta` operava com união ingênua sem tombstones (`deleted_at`). Arestas e temas excluídos em um dispositivo retornavam ao sincronizar com o remoto.
2. **Conflito e Perda de Edições (Lost Updates)**: Renomear ou trocar a cor de um tema não propagava (o local sempre vencia sem timestamps de modificação `updated_at`).
3. **IDs Divergentes**: Temas eram criados com `Date.now()` no grafo e por hash na sidebar, gerando nós duplicados e desconectados entre múltiplos dispositivos.
4. **Semântica Inconsistente de Vínculos**: Arrastar nós criava arestas extras em `graphMeta.edges` em vez de persistir tags ou referências nas entidades correspondentes, impossibilitando a exclusão correta via UI.
5. **Vazamento do Ciclo de Vida do Auto-Sync**: O desmonte de qualquer componente com `useDriveSync` destruía listeners globais, pausando o polling e sincronização em segundo plano.

## Decisão
Implementamos uma arquitetura robusta de reconciliação baseada em CRDT LWW (Last-Write-Wins), tombstones explícitos e identificação determinística canônica:

1. **Identidade Canônica Determinística de Temas**:
   - `getCanonicalThemeId(name)` gera IDs universais usando hash numérico FNV-1a de 32 bits a partir do nome normalizado (trimmed, lowercased e sem acentos).
   - Elimina divergências entre dispositivos para temas de mesmo nome.
   - Arestas canônicas utilizam formato ordenado `min(src, tgt)---max(src, tgt)`.

2. **GraphMeta v2 com CRDT LWW e Tombstones**:
   - Cada tema e aresta em `graph_meta` possui `updated_at`, `updated_by` e `deleted_at: number | null`.
   - `DriveSyncService.mergeGraphMetaCRDT` executa um merge de 3 vias com snapshot local prévio, garantindo que mutações concorrentes não sejam perdidas durante transferências de rede e que exclusões (`deleted_at`) prevaleçam sobre registros obsoletos.
   - Correção na sincronização de livros ao esvaziar a lista de temas (`themes: []`).

3. **Centralização Atômica no `ThemeManagementService`**:
   - Todas as mutações de criação, renomeação, exclusão, vinculação e desvinculação em **todas as 6 entidades** (Livros, Anotações, Notas, Quadros, Desenhos, Links) e no `graph_meta` são processadas através de um único serviço universal.
   - `unlinkEdge` desfaz qualquer vínculo de acordo com a sua tipagem canônica nativa (tags em notas/quadros/desenhos/links; themes em livros/anotações; links em notas; e arestas em `graphMeta.edges`).

4. **Gerenciamento do Ciclo de Vida do Auto-Sync**:
   - `useDriveSync` adota contagem de referências (*ref-counting*) para os listeners globais de storage e janela, garantindo que o ciclo de sincronização permaneça ativo enquanto o app estiver em execução.
   - Enfileiramento de `hasPendingSync` para mutações ocorridas durante uma sincronização em andamento.

## Consequências
- **Consistência Multi-Dispositivo**: Temas e conexões criados, editados ou excluídos em qualquer dispositivo convergem de forma determinística e livre de conflitos.
- **Isolamento e Desacoplamento**: O grafo visual (`useGraph`, `GraphCanvas`) não manipula estruturas de persistência ad-hoc; todas as operações delegam para `ThemeManagementService`.
- **Rastreabilidade e Resiliência**: Testes unitários cobrem 100% dos fluxos de reconciliação CRDT, garantindo que futuras extensões preservem os invariantes de consistência eventual.
