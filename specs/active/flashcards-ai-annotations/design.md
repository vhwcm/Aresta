# Design: Anotações, Notas do Canvas e Flashcards com Rastreamento de Fonte

## 1. Arquitetura e Rastreamento de Fonte

```
┌───────────────────────────┐      ┌───────────────────────────┐
│     Anotação de Livro     │      │   Bloco de Nota Canvas    │
│  (bookId, cfi, chapter)   │      │   (noteId, canvasId)      │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              └───────────────┬──────────────────┘
                              │ Gera com IA (Background)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Flashcard Persistido                      │
│  - question & answer (Gemini IA / Fallback)                  │
│  - sourceType: 'book_annotation' | 'canvas_note'             │
│  - sourceUrl: '/reader?bookId=...' | '/canvas?noteId=...'    │
│  - sourceTitle: Título da Obra ou Nome da Nota               │
└─────────────────────────────┬────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   Estudo do Flashcard     │   │     Exclusão da Fonte     │
│  Botão: "Ver Fonte ↗"     │   │  Anotação ou Nota Apagada │
│  Direciona à fonte exata  │   │             │             │
└───────────────────────────┘   │             ▼             │
                                │   Flashcard é apagado     │
                                │    automaticamente        │
                                └───────────────────────────┘
```

## 2. Contratos e Campos

### 2.1. Flashcard Entity (Frontend & Backend)
- `sourceType`: `'book_annotation' | 'canvas_note'`
- `sourceId`: `string | number` (ID da anotação ou ID da nota)
- `sourceUrl`: URL direta para abrir no leitor ou no canvas
- `sourceTitle`: Nome legível do livro ou título da nota
