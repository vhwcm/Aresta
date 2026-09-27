# Design Técnico: Unificação Arquitetural de Tags e Pastas

## 1. Visão Geral da Arquitetura
Historicamente, o sistema mantinha duas taxonomias paralelas:
1. `folder?: string`: campo plano usado para agrupar arquivos em uma árvore de diretórios tradicional (1 item $\rightarrow$ 1 pasta).
2. `tags?: string[]` (ou `themes`): array de identificadores para categorização semântica e conexões no Grafo de Conhecimento.

Com esta unificação, a taxonomia converge para o **Modelo de Grafo Unificado**:
- **Toda pasta é uma Tag**: Pastas são projeções em árvore dos nós de Tags.
- **Hierarquia via Delimitador ou Relação**: Tags contendo `/` (ex: `Faculdade/Calculo`) ou nós filhos com aresta hierárquica formam nós pais e nós filhos na árvore.
- **Itens como Nós Referenciados**: Os arquivos (Notas, Livros, Canvas, Desenhos, Links) são nós folha conectados aos nós de Tags. Na visualização em árvore, cada conexão (aresta) entre um arquivo e uma tag gera uma entrada de referência na pasta correspondente.

---

## 2. Diagrama Visual de Fluxo
Consulte o diagrama visual detalhado em: `specs/active/unified-tags-and-folders/diagrams/flow.txt`

---

## 3. Modelo de Dados e Interfaces

### 3.1. Estrutura Unificada de Nós e Referências no Frontend
```typescript
// Interface refinada de item projetado na árvore da barra lateral
export interface SidebarTreeItem {
  id: string              // ID único da entidade (ex: 'note-12', 'canvas-4')
  title: string           // Título da nota/canvas/livro/link
  kind: 'canvas' | 'note' | 'drawing' | 'link' | 'book'
  tags: string[]          // Todas as tags/pastas associadas ao item
  referenceCount?: number // Número total de tags associadas (calculado)
  bookId?: number | string
}

// Estrutura de nó hierárquico da árvore (Pasta = Tag)
export interface FolderTreeNode {
  name: string            // Nome do segmento (ex: "Calculo")
  fullPath: string        // Tag completa (ex: "Faculdade/Calculo")
  children: FolderTreeNode[] // Subpastas filhas
  items: SidebarTreeItem[]   // Arquivos referenciados nesta tag específica
  totalItemsCount: number    // Contagem recursiva de itens
}
```

### 3.2. Migração de Dados no DatabaseManager / Repositórios Locais
Ao inicializar o banco local (`DatabaseManager` ou `useWorkspaceSidebar`):
```typescript
export function migrateEntityFoldersToTags(entity: { folder?: string | null; tags?: string[] }) {
  const currentTags = Array.isArray(entity.tags) ? [...entity.tags] : []
  if (entity.folder && entity.folder.trim()) {
    const trimmedFolder = entity.folder.trim()
    if (!currentTags.includes(trimmedFolder)) {
      currentTags.push(trimmedFolder)
    }
  }
  return currentTags
}
```

### 3.3. Schemas de Validação Zod (`apps/api/src/modules/*/schemas/`)
Garantir que schemas de criação/atualização de notas, canvas e links aceitem `tags` como fonte primária:
```typescript
export const updateEntityTagsSchema = z.object({
  id: z.union([z.string(), z.number()]),
  tags: z.array(z.string().min(1).max(100)),
  addTag: z.string().optional(),
  removeTag: z.string().optional(),
})
```

---

## 4. Componentes Frontend & Gerenciamento de Estado

### 4.1. Composable `useWorkspaceSidebar.ts`
- **Responsabilidades**:
  - `buildFolderTree(items: SidebarTreeItem[]): FolderTreeNode[]`: Agrupa os itens em uma árvore baseada em suas tags. Se um item possui as tags `['Aresta', 'Design']`, ele é injetado tanto na coleção de itens do nó `Aresta` quanto no nó `Design`.
  - `moveItemToFolder(itemId: string, fromTag: string, toTag: string)`: Remove `fromTag` e adiciona `toTag` às tags do item.
  - `addReferenceToFolder(itemId: string, toTag: string)`: Adiciona `toTag` às tags do item sem remover as existentes.
  - `removeReferenceFromFolder(itemId: string, tag: string)`: Remove `tag` do array de tags do item.
  - `deleteItemCompletely(itemId: string)`: Chama o repositório correspondente (ex: `noteRepo.delete`, `canvasRepo.delete`) apagando o item por definitivo.

### 4.2. Componente `FolderTagSidebar.vue`
- **Ajustes de Layout**:
  - Ocultar cabeçalhos redundantes sobre a lista de pastas.
  - Remover o bloco segregado de "Filtro por Tags" (`isTagsExpanded`, chips de filtro superior).
  - Cada pasta é diretamente uma tag. Clicar na pasta seleciona-a; clicar no chevron expande/recolhe a lista de arquivos.
  - Quando um item tiver `tags.length > 1`:
    - Exibe um ícone de link/atalho (`Share2Icon` ou `ExternalLinkIcon` ou badge sutil `#N`).
    - Tooltip: `"Presente em: #tag1, #tag2"`.
- **Drag-and-Drop Contextual**:
  - Evento `dragstart` armazena `{ itemId, sourceFolder }`.
  - Evento `drop` na pasta alvo abre modal/popover rápido nas coordenadas do mouse:
    - Botão 1: *"Mover para [Pasta]"*
    - Botão 2: *"Adicionar referência em [Pasta]"*
- **Menu de Ações do Arquivo**:
  - Três pontos ou clique direito em um arquivo:
    - *"Remover desta pasta (#tag)"*
    - *"Excluir arquivo definitivamente"* (destacado em vermelho com confirmação).

---

## 5. Estratégia do Grafo de Conhecimento (`useGraph` & `buildLocalGraph`)
- Como cada pasta agora é um nó de tag no Grafo:
  - Tags hierárquicas criam arestas direcionadas do tipo `child_of` (ex: `Nó: Faculdade/Calculo` $\rightarrow$ `Nó: Faculdade`).
  - Cada arquivo possui uma aresta `has_tag` para o nó da tag.
  - A coerência 1:1 entre a árvore de arquivos e o mapa mental do grafo se torna matematicamente perfeita.

---

## 6. Tratamento de Erros & Fallbacks
- **Conflito de Nomes**: Tags são comparadas sem diferenciar maiúsculas/minúsculas para evitar pastas duplicadas como `livros` e `Livros`.
- **Itens sem Tag**: Agrupados sob a pseudo-pasta `"Sem pasta"` (`__uncategorized__`). A exclusão de um item daqui exclui-o definitivamente.
- **Rollback de Operações**: Se a atualização no banco local/remoto falhar durante um drag-and-drop, o estado reativo reverte imediatamente ao snapshot anterior.

---

## 7. Estratégia de Testes
- **Testes Unitários no Frontend (`apps/web/tests/unit/`)**:
  - Testar `buildFolderTree` validando multi-projeção de itens em múltiplas tags.
  - Testar `moveItemToFolder` e `addReferenceToFolder`.
  - Testar `removeReferenceFromFolder` vs `deleteItemCompletely`.
  - Testar renderização de `FolderTagSidebar.vue` sem seção de tags duplicada e com ícones de referência.
