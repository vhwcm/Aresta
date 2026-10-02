# ADR-027: Unificação Arquitetural de Tags e Pastas de Arquivos com Projeção Multi-Referência

## 1. Contexto e Problema
Historicamente, o ecossistema Aresta mantinha duas taxonomias paralelas para organização de conhecimento:
1. `folder?: string`: campo plano que organizava notas, quadros e links em uma árvore de diretórios convencional (relação estrita $1:1$ entre item e pasta).
2. `tags?: string[]` (ou `themes`): identificadores semânticos associados a itens para alimentar os nós do Grafo de Conhecimento e a nuvem de filtros.

Em uma estrutura de grafo rica, um mesmo artefato (como um livro clássico, uma nota ou um canvas) conecta-se conceitualmente a múltiplos temas (ex: `#filosofia`, `#historia` e `#etica`). No modelo segregado anterior, o usuário era forçado a escolher uma única pasta física na árvore, gerando atrito cognitivo e redundância. Além disso, a presença de uma seção separada de "Tags" concorrendo visualmente com a seção de "Pastas" sobrecarregava a navegação lateral.

---

## 2. Decisão Arquitetural
Unificar integralmente as entidades de **Pastas** e **Tags** sob o modelo conceitual do Grafo de Conhecimento:
1. **Pastas são Tags**: Qualquer pasta na árvore é uma projeção de um nó de tag no Grafo. Criar uma nova pasta cria imediatamente o nó de tag correspondente.
2. **Projeção Multi-Referência**: Se um item possuir $N$ tags associadas, ele é renderizado dinamicamente dentro de cada uma das $N$ pastas na árvore lateral. Todas as instâncias apontam para o mesmo registro único de dados (edições em qualquer instância propagam imediatamente).
3. **Sinalização Visual de Vínculos**: Arquivos associados a múltiplas tags exibem um indicador discreto de vínculo (`LinkIcon`) com tooltip contextual informando todas as outras pastas onde o item reside.
4. **Drag & Drop Contextual**: Ao arrastar um arquivo para outra pasta, um menu rápido permite escolher entre:
   - *"Mover para esta pasta"* (substitui a tag de origem pela de destino).
   - *"Adicionar referência nesta pasta"* (mantém em ambas).
5. **Ações Atômicas de Exclusão**: Diferenciação clara entre:
   - *"Remover desta pasta (#tag)"*: desassocia a tag atual, mantendo o arquivo nas demais pastas ou movendo para "Sem pasta".
   - *"Excluir arquivo definitivamente"*: remove permanentemente o arquivo do repositório local e de todas as pastas/grafo.
6. **Interface Limpa**:
   - A árvore de arquivos não possui título redundante no cabeçalho.
   - A antiga seção segregada de "Filtro por Tags" foi removida.
7. **Migração Transparente**:
   - Uma rotina idempotente (`runFolderToTagsMigration`) mescla automaticamente qualquer valor existente em `folder` no array `tags` de cada entidade.
8. **Barra de Ferramentas do Editor de Notas Unificada**:
   - Remoção definitiva do seletor isolado de pasta (`📁 Sem pasta / 📁 <pasta>`) da toolbar do NoteEditorPane.
   - Exibição exclusiva do controle de Tags (`🏷️ #tag` ou `🏷️ Tags (+N)`), com popover contendo tags ativas, chips de tags existentes do workspace para adição rápida em 1 clique e input para novas tags.
   - Migração automática de qualquer valor legado em `note.folder` para `note.tags` na inicialização do editor e sincronização bidirecional transparente.

---

## 3. Consequências e Benefícios
- **Consistência 1:1 entre Árvore e Grafo**: A navegação em árvore agora espelha exatamente os nós e arestas do Grafo de Conhecimento.
- **Zero Duplicação de Arquivos**: O usuário não precisa duplicar notas ou quadros para categorizá-los em múltiplos temas.
- **Local-First & Offline**: A resolução de múltiplas referências é computada localmente via SQLite/IndexedDB sem latência de rede.
