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

### 2.1. Vínculo e Links de Quadros (Canvas) em Notas
- As notas operam em **Modo Único Live Preview** unificado (`MilkdownEditor`), eliminando abas e modos divididos para máxima imersão.
- Em vez de widgets pesados de canvas incorporados no meio do texto, a nota utiliza links amigáveis clicáveis: `[🎨 Nome do Quadro](canvas:<uuid>)` ou `[[canvas:<uuid>]]`.
- Links de quadros são renderizados como badges estilizados e interativos:
  - **Clique direto**: Abre o quadro imediatamente na rota `/canvas/:id`.
  - **Ctrl/Cmd + Clique**: Permite posicionar o cursor e editar o texto ou a URL do link.
- O botão **"Vincular Quadro"** na barra superior abre um modal com duas abas:
  1. **Quadro Existente**: Busca e seleção rápida entre quadros já cadastrados.
  2. **Criar Novo Quadro**: Campo para nome do quadro, com criação instantânea no banco local e inserção automática do link na nota.
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
