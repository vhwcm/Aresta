# ADR-009: Integração de Anotações Multiorigem com Geração de Flashcards via IA e Exclusão em Cascata

## Status
Aceito

## Data
12/09/2026

## Contexto
O ecossistema de aprendizado do Aresta até então possuía geração de flashcards centrada prioritariamente em destaques diretos de livros. No entanto, os usuários produzem anotações em múltiplos contextos da plataforma:
1. No leitor de livros (trechos e comentários).
2. No Canvas infinito (em trechos específicos dentro de blocos de notas do tipo Markdown).

Além disso, os usuários precisavam:
- Visualizar todas as anotações agrupadas tematicamente na Central de Revisão.
- Ter a capacidade de alternar se qualquer anotação se torna um flashcard ativo de repetição espaçada.
- Ter rastreabilidade explícita durante o estudo do flashcard, podendo clicar em "Ver Fonte ↗" e navegar com precisão de volta para o trecho do livro ou para a nota no Canvas.
- Exclusão em cascata resiliente: caso a anotação ou a nota no Canvas seja excluída, o flashcard correspondente deve ser automaticamente excluído tanto na camada de persistência local (IndexedDB/SQLite) quanto no backend PostgreSQL.

## Decisões Tomadas

### 1. Modelagem Unificada de Origem via CFI e Metadados
- Trechos selecionados em notas do Canvas são encapsulados como anotações com `cfi: 'note:${noteId}'` e `bookId: 1` (espaço de notas do usuário).
- A entidade `LocalFlashcard` e o item reativo `FlashcardItem` foram estendidos com:
  - `sourceType`: `'book_annotation' | 'canvas_note'`
  - `sourceUrl`: rota de navegação para a origem (`/reader?bookId=...&cfi=...` ou `/canvas?noteId=...`)
  - `sourceTitle`: título amigável da fonte
  - `noteId`: identificador do nó/bloco de nota do Canvas

### 2. Geração Resiliente com IA e Fallback Socrático Local
- Ao ativar a geração de flashcard, o sistema aciona a rota de IA (`/api/ai/flashcard`) utilizando o modelo Gemini com prompt pedagógico de três arquétipos.
- Se a rede ou a chave da IA estiver indisponível, o sistema recorre a um fallback socrático local baseado no trecho e na reflexão do usuário, assegurando que o flashcard seja sempre criado sem bloquear a experiência (Local-First instantâneo).

### 3. Exclusão em Cascata
- **No Backend**:
  - `Flashcard.annotation_id` possui relação com `onDelete: Cascade` no Prisma Schema.
  - `NoteService.delete` exclui todas as anotações com `cfi` iniciado em `note:${noteId}`, propagando automaticamente a exclusão de flashcards via trigger do banco de dados relacional.
  - Rota `DELETE /api/v1/flashcards/by-annotation/:annotationId` disponibilizada para exclusão cirúrgica.
- **No Frontend**:
  - `FlashcardRepository.deleteByAnnotationId` e `deleteByNoteId` limpam o banco local indexado.
  - `useNotes.deleteNote` e `useAnnotations.deleteAnnotation` acionam a limpeza de flashcards imediatamente no estado reativo e no IndexedDB/SQLite.

### 4. UI da Central de Revisão
- A aba "Resumos & Anotações" agrupa cartões por seções temáticas (`#Tema`), com filtros rápidos (pills) por tema e contador de anotações.
- Cada anotação possui badge indicativo de flashcard ativo e ação de 1-clique para alternar (ativar/desativar).
- Os flashcards 3D (frente e verso) exibem botão "Ver Fonte ↗" com deep link para a obra ou nota de origem.

## Consequências
- **Positivas**: Ciclo de estudo contínuo e integrado entre leitura, síntese visual no Canvas e retenção espaçada. Ausência de flashcards órfãos no banco de dados.
- **Observações**: O leitor de livros e o Canvas mantêm autonomia total de interface enquanto compartilham os repositórios locais e a sincronização modular de memória.
