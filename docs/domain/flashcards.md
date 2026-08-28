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

## 5. Endpoints REST da API

- `GET /api/v1/flashcards/daily`: Retorna o deck diário de até 50 cards para o usuário logado.
- `GET /api/v1/flashcards/daily/first`: Retorna o 1º card do dia para o feed da Home.
- `POST /api/v1/flashcards/:id/review`: Registra a autoavaliação, atualiza a repetição espaçada e pontua no Streak.
- `POST /api/v1/flashcards/generate-batch`: Trigger administrativo para geração em lote de anotações pendentes.

---

## 6. Código e Arquivos Relacionados

- **Backend**:
  - `src/services/flashcardRAG.service.ts`: Cosine similarity e recuperação de vizinhos.
  - `src/services/flashcard.service.ts`: Composição do deck de 50 cards e motor de repetição espaçada.
  - `src/services/flashcardScheduler.service.ts`: Agendamento dos jobs das 22:00 e 00:00.
  - `src/controllers/flashcard.controller.ts` & `src/routes/flashcard.routes.ts`: Endpoints REST e Swagger.
- **Frontend**:
  - `front/app/composables/useFlashcards.ts`: Composable reativo de deck e revisão.
  - `front/app/pages/index.vue`: Widget do 1º Flashcard do Dia.
  - `front/app/pages/revisao.vue`: Interface 3D flip com autoavaliação e progresso diário.
- **Microsserviço Go**:
  - `aresta-ocr/proto/ai/v1/ai.proto`: Definições gRPC de `GenerateEmbedding` e `GenerateFlashcard`.
  - `aresta-ocr/internal/adapters/gemini/analyzer.go`: Prompts few-shot especializados nos 3 arquétipos.
