# Domínio: Central de Revisão & Flashcards RAG

## 1. Propósito & Arquitetura Geral
O sistema de flashcards do Aresta transforma anotações e destaques de leitura em cartões de estudo ativos utilizando **RAG local** (*Retrieval-Augmented Generation*) com similaridade de cosseno e IA especializada do Gemini com prompt few-shot em 3 arquétipos pedagógicos. Os cartões gerados são persistidos 1:1 com as anotações do usuário para reutilização com custo zero em dias subsequentes.

```
                  ┌──────────────────────────────┐
                  │    Anotações & Destaques     │
                  │   (Embeddings float[768])    │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │          RAG Local           │
                  │   (Busca k-NN de Contexto)   │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │     Microsserviço Go / AI    │
                  │  3 Arquétipos Pedagógicos    │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Flashcards Persistidos    │
                  │  1:1 com Anotações (Custo 0) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │     Deck Diário de 50        │
                  │  Repetição Espaçada + Temas  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Home & Central de Revisão 3D │
                  │     Incremento no Streak     │
                  └──────────────────────────────┘
```

---

## 2. Os 3 Arquétipos Pedagógicos de Flashcards

1. **Situação Real (`REAL_SITUATION`)**:
   - Cria um cenário prático ou estudo de caso hipotético verossímil onde o conceito precisa ser identificado ou aplicado.
2. **Relembração de Conceito (`CONCEPT_RECALL`)**:
   - Pergunta direta, socrática e reflexiva sobre o mecanismo ou definição essencial destacado pelo leitor.
3. **União de Conceitos (`CONCEPT_UNION`)**:
   - Conexão entre a anotação alvo e as anotações vizinhas trazidas pelo RAG semântico, estimulando síntese transversal.

---

## 3. Repetição Espaçada & Curva do Esquecimento

Na autoavaliação (`/api/v1/flashcards/:id/review`):
- **Difícil (`hard`)**: Reinicia para nível 1, agendando próxima revisão para amanhã (+1 dia) e ajustando fator de dificuldade.
- **Bom (`good`)**: Incrementa nível (+1), agendando próxima revisão para 3 dias (ou escalonado por nível).
- **Fácil (`easy`)**: Salto de nível (+2), agendando próxima revisão para 7 dias (ou escalonado por nível).

---

## 4. Agendamento & Composição do Deck Diário

- **Job das 22:00 (`FlashcardSchedulerService.run22hJob`)**:
  - Varre anotações pendentes que ainda não possuem flashcard e gera os cards 1:1 via RAG.
- **Job das 00:00 (`FlashcardSchedulerService.run00hJob`)**:
  - Prepara antecipadamente o deck diário de até 50 cards balanceados (Prioridade 1: Vencidos / Hoje; Prioridade 2: Sorteio balanceado por temas).
- **Fallback On-Demand**:
  - Se o usuário acessar a Home ou `/revisao` antes da execução dos jobs, o deck e os flashcards são gerados em tempo real com tolerância total a falhas.

---

- `POST /api/v1/flashcards`: Criação/persistência direta de flashcard vinculado a anotação ou nota.
- `DELETE /api/v1/flashcards/:id`: Exclui flashcard por ID.
- `DELETE /api/v1/flashcards/by-annotation/:annotationId`: Exclusão em cascata ao remover a anotação-fonte.

---

## 6. Integração Multiorigem (Livros e Trechos de Notas do Canvas)

1. **Anotações no Leitor de Livros**:
   - Criação com toggle de flashcard direto no modal `ReaderAnnotationModal`.
   - Gera flashcard pedagógico via IA e associa com `sourceType: 'book'`, `bookId` e `cfi`.
2. **Trechos de Notas do Canvas**:
   - Ao selecionar texto em notas do Canvas (`CanvasNodeNote`), o leitor exibe tooltip com "Gerar Flashcard com Trecho (IA)".
   - Cria uma anotação com `cfi: 'note:${noteId}'` e associa `sourceType: 'canvas_note'` e `noteId`.
3. **Navegação para a Fonte ("Ver Fonte ↗")**:
   - Na página de revisão (`/revisao`), os flashcards possuem botão direto apontando para o leitor de livros ou para o Canvas focando na nota.
4. **Exclusão em Cascata Garantida**:
   - Ao excluir a nota no Canvas ou a anotação no leitor, os flashcards correspondentes são deletados automaticamente no banco local e remoto via trigger/serviço.

---

## 7. Código e Arquivos Relacionados

- **Backend**:
  - `apps/api/src/modules/memory/services/flashcard.service.ts`: Composição do deck, repetição espaçada e remoção em cascata.
  - `apps/api/src/modules/canvas/services/note.service.ts`: Cascata de remoção de flashcards e anotações originadas de notas.
  - `apps/api/src/modules/memory/routes/flashcard.routes.ts`: Endpoints REST unificados.
- **Frontend**:
  - `apps/web/app/composables/useFlashcards.ts`: Deck diário, geração com IA e exclusão por fonte.
  - `apps/web/app/composables/useAnnotations.ts`: Ciclo de vida de anotações, alternância de flashcard e persistência local-first.
  - `apps/web/app/components/canvas/CanvasNodeNote.vue`: Seleção de trecho e trigger de anotação com flashcard.
  - `apps/web/app/components/reader/ReaderAnnotationModal.vue`: Modal unificado com toggle de geração por IA.
  - `apps/web/app/pages/revisao.vue`: Revisão 3D, link "Ver Fonte ↗", listagem agrupada por temas e filtros rápidos.
