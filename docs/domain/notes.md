# Domínio: Notas Compostas & Canvas (Composite Notes Engine)

## 1. Visão Geral do Domínio

O módulo de **Notas Compostas** do Aresta unifica a criação de documentos lineares em Markdown e a modelagem visual em Quadros Infinitos (Canvas estilo Obsidian) sob um modelo composto flexível.

```
                  ┌───────────────────────────────┐
                  │    Composite Document Model   │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │   Markdown Note   │           │   Infinite Canvas │
       │  (Texto & Embeds) │◄─────────►│  (JSON Canvas v1) │
       └─────────┬─────────┘           └─────────┬─────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                       ┌───────────────────┐
                       │   Book / Reader   │
                       │ (/reader?bookId=) │
                       └───────────────────┘
```

---

## 2. Padrões de Composição

### 2.1. Barra Única Superior Unificada & Responsividade Mobile
- As notas operam em **Modo Único Live Preview** (`MilkdownEditor`), eliminando abas e modos divididos para máxima imersão.
- Todos os controles foram consolidados em uma **barra única** ancorada diretamente no topo do documento/folha de anotação (`NoteEditorPane.vue`), mantendo o cabeçalho superior da janela limpo apenas com o título editável e botões globais (Excluir e Fechar).
- **Design Pensado para Mobile**:
  - A barra utiliza `overflow-x-auto no-scrollbar scroll-smooth flex-nowrap shrink-0` e `touch-pan-x`, garantindo deslizamento horizontal suave no toque em qualquer tamanho de tela sem quebra de linhas.
  - Alvos de toque acessíveis e ergonomia mobile (`min-h-[32px]` a `min-h-[36px]`).
  - Popovers e modais responsivos com largura máxima `max-w-[calc(100vw-2rem)]` e rolagem vertical interna.
- **Ferramentas Integradas na Barra**:
  1. **Formatação de Texto Rica**: Seletor de Títulos (`Normal (p)`, `H1`, `H2`, `H3`), botão de **Negrito** (`B`) e botão de **Itálico** (`I`), executados via ProseMirror commands expostos no Milkdown.
  2. **Organização**: Seletor de pasta (`Folder`) dropdown com ícone de pasta.
  3. **Tags em Popover**: Botão de Tags com contador numérico que abre um painel flutuante/popover para visualização, remoção (`✕`) e adição rápida de tags com Enter ou vírgula.
  4. **Vínculo Universal**: Botão "Vincular ▾" com modal responsivo de 4 abas:
     - **🎨 Quadro**: Vínculo a quadros existentes ou criação instantânea de novos quadros.
     - **📝 Nota**: Vínculo a outras notas do banco local via `noteRepo.getAll()`.
     - **📖 Livro**: Vínculo a livros da biblioteca via `bookRepo.getAll()`.
     - **📚 Livreto**: Vínculo a livretos didáticos gerados por IA via `useDidacticBooklet().fetchBooklets()`.
- **Badges Estilizados e Navegação**:
  - Links gerados: `[🎨 Título](canvas:id)`, `[📝 Título](note:id)`, `[📖 Título](book:id)` e `[📚 Título](booklet:id)`.
  - Estilizados com cores temáticas e efeitos hover específicos no CSS `milkdown-aresta-theme.css`.
  - Clique direto no editor navega para a rota de destino (`/canvas/:id`, `/notes?id=:id` ou `/reader?bookId=:id`).
  - `Ctrl/Cmd + Clique`: Permite posicionar o cursor e editar o texto ou a URL do link no editor.
- O Grafo de Conhecimento (`buildLocalGraph` e `useNotes`) detecta automaticamente as referências a quadros presentes no Markdown e cria a aresta `note-canvas` conectando o nó da nota ao nó do quadro.

### 2.2. Cards de Notas no Canvas
- Nós do tipo `note_embed` no Canvas exibem o título e a pré-visualização formatada em Markdown da nota referenciada (`noteId`).
- Edições no conteúdo da nota sincronizam de forma reativa com o Canvas.

### 2.3. Vínculo de Livros da Estante
- Livros anexados (`![[book:<id>]]` ou nó `book`) exibem capa real, metadados e atalho de navegação com 1 clique diretamente para a leitura no leitor de EPUB/PDF.

---

## 3. Segurança e Prevenção de Ciclos (Anti-Recursion)

O composable `useCycleDetector` garante proteção estrita contra estouros de pilha no DOM:
1. **Detecção de Ciclos**: Mantém uma pilha de ancestrais `(type, id)`. Se um recurso tentar se auto-incluir (direta ou indiretamente), a renderização inline é interrompida e substituída por `CycleWarningPlaceholder.vue`.
2. **Limite de Profundidade**: Profundidade máxima de 3 níveis (`MAX_COMPOSITE_DEPTH = 3`). Embeds que excederem o limite renderizam um link de navegação para a visualização dedicada.

---

## 4. Persistência e Entidades

- **`Note`**: Entidade relacional com `id` (UUID), `title`, `content` (Markdown), `folder`, `tags` e `user_id`.
- **`NoteLink`**: Rastreamento de referências extraídas (`source_note_id`, `target_type: CANVAS | BOOK | NOTE`, `target_id`).
- **`Canvas`**: Documento JSON Canvas v1.0 compatível com nós de tipos `text`, `shape`, `book`, `loose_text`, `highlight` e `note_embed`.
