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

### 2.1. Embed de Canvas em Notas
- Uma nota pode incorporar um ou mais quadros infinitos utilizando a sintaxe `![[canvas:<uuid>]]`.
- O renderizador (`NoteCompositeRenderer.vue`) monta uma visualização miniatura interativa (`CanvasEmbedPreview.vue`) com suporte a pan, zoom e abertura em tela cheia.

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
