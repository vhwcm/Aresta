# Tarefas de Implementação: Unificação de Tags e Pastas

## Checklist de Execução

- [x] **1. Modelo de Dados & Migração Local-First**
  - [x] 1.1 Criar função de migração de `folder` para `tags` em `apps/web/app/adapters/database/migrations/folderToTagsMigration.ts`
  - [x] 1.2 Atualizar repositórios locais (`NoteRepository`, `CanvasRepository`, `DrawingNoteRepository`, `LinkRepository`) para persistir `tags` de forma consistente e migrar registros no carregamento
  - [x] 1.3 Garantir que os schemas da API (`apps/api/src/modules/*/schemas/`) aceitem múltiplos `tags` sem depender exclusivamente de `folder`

- [x] **2. Composable e Lógica Central (`useWorkspaceSidebar.ts`)**
  - [x] 2.1 Refatorar a geração de itens unificados para extrair todas as tags únicas como pastas (`unifiedFolders`)
  - [x] 2.2 Implementar projeção multi-referência: duplicar entradas lógicas de itens com mais de uma tag na árvore de arquivos da barra lateral
  - [x] 2.3 Implementar suporte a subpastas/hierarquia de tags (`#pai/filho`)
  - [x] 2.4 Implementar métodos atômicos:
    - `moveItemToFolder(itemId, fromTag, toTag)`
    - `addReferenceToFolder(itemId, toTag)`
    - `removeReferenceFromFolder(itemId, tag)`
    - `deleteItemCompletely(itemId)`

- [x] **3. Interface da Barra Lateral (`FolderTagSidebar.vue`)**
  - [x] 3.1 Remover a seção segregada de "Filtro por Tags" (`isTagsExpanded`, chips de filtro superior)
  - [x] 3.2 Remover título textual da árvore de arquivos, preservando exatamente o estilo visual e responsividade atuais
  - [x] 3.3 Adicionar indicador visual de link/referência e tooltip para itens presentes em múltiplas tags
  - [x] 3.4 Implementar menu contextual de drag-and-drop ao soltar um arquivo em uma pasta ("Mover" vs "Adicionar referência")
  - [x] 3.5 Implementar opções no menu de arquivo: "Remover desta pasta (#tag)" e "Excluir definitivamente"

- [x] **4. Integração com o Grafo de Conhecimento (`useGraph.ts` e `buildLocalGraph.ts`)**
  - [x] 4.1 Unificar a criação de nós de temas/tags para refletir a mesma taxonomia da árvore
  - [x] 4.2 Suportar arestas hierárquicas para tags aninhadas (`pai/filho`) no visualizador 3D/2D do Grafo

- [x] **5. Testes Automatizados**
  - [x] 5.1 Criar testes unitários para a lógica de multi-referência e árvore de pastas em `apps/web/tests/unit/composables/useWorkspaceSidebar.test.ts`
  - [x] 5.2 Criar testes unitários para o componente `FolderTagSidebar.vue` garantindo exibição de referências e ausência de títulos redundantes
  - [x] 5.3 Executar Quality Gates completos (`npm test` no frontend e backend)

- [x] **6. Documentação & Conclusão**
  - [x] 6.1 Atualizar documentação em `docs/decisions/ADR-027-unification-of-tags-and-file-folders.md`
  - [x] 6.2 Mover spec para `specs/completed/`
  - [x] 6.3 Atualizar `checklist.md` marcando a tarefa como `[Concluído]`
