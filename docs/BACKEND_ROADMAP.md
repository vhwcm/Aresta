# Backend Roadmap & Especificação de Funcionalidades Mockadas

Este documento serve como inventário técnico das funcionalidades que atualmente operam com dados mockados ou simulações no frontend do **Aresta**, estabelecendo as rotas, payloads e contratos esperados para a implementação definitiva no backend.

---

## 1. Conversor de PDF para EPUB

- **Página / Componente**: [`front/app/pages/conversor.vue`](file:///home/bcc/vhwcm24/Aresta/front/app/pages/conversor.vue) / [`front/app/composables/useConverter.ts`](file:///home/bcc/vhwcm24/Aresta/front/app/composables/useConverter.ts)
- **Status Atual**: Simulação client-side com timers de progresso em etapas (*Analisando estrutura*, *Extraindo texto & OCR*, *Formatando capítulos*, *Empacotando EPUB3*) e geração de Blob simulado.
- **Especificação de Backend Necessária**:
  - `POST /api/converter/upload`: Recebe arquivo multipart/form-data com parâmetros:
    - `file`: PDF binary (até 100MB)
    - `ocrEnabled`: boolean
    - `extractImages`: boolean
    - `cleanFootnotes`: boolean
    - `chapterDetection`: `'auto' | 'strict' | 'headings'`
    - *Retorno*: `{ jobId: string, status: 'queued' }`
  - `GET /api/converter/status/:jobId`: Consulta o status do processamento assíncrono via fila (Redis / BullMQ / Celery).
    - *Retorno*: `{ status: 'analyzing' | 'extracting' | 'formatting' | 'packaging' | 'completed' | 'failed', progress: number, currentStep: string, error?: string }`
  - `GET /api/converter/download/:jobId`: Download do arquivo `.epub` gerado com metadados estruturados.

---

## 2. Central de Revisão & Flashcards (Repetição Espaçada)

- **Página / Componente**: [`front/app/pages/revisao.vue`](file:///home/bcc/vhwcm24/Aresta/front/app/pages/revisao.vue)
- **Status Atual**: Mock local em memória com cartões 3D para avaliação de repetição espaçada (Difícil / Bom / Fácil) e sínteses de notas.
- **Especificação de Backend Necessária**:
  - `GET /api/reviews/flashcards`: Retorna a lista de flashcards agendados para o dia com base no algoritmo SM-2 / FSRS.
    - *Query params*: `bookId?: string, status?: string`
    - *Retorno*: `Array<{ id: string, bookId: string, bookTitle: string, chapter: string, question: string, answer: string, nextReviewDate: string, intervalDays: number, easeFactor: number }>`
  - `POST /api/reviews/flashcards/:id/rate`: Registra a avaliação do usuário.
    - *Payload*: `{ rating: 'hard' | 'good' | 'easy', responseTimeMs?: number }`
  - `POST /api/reviews/flashcards/generate-from-highlight`: Dispara prompt para LLM gerar pergunta e resposta conceituais a partir de um destaque do livro.
    - *Payload*: `{ bookId: string, chapter: string, highlightText: string, userNote?: string }`
  - `GET /api/reviews/summaries`: Lista resumos inteligentes consolidados por capítulo e tags.

---

## 3. Gestão de Contas & Assinatura Pro

- **Página / Componente**: [`front/app/pages/conta.vue`](file:///home/bcc/vhwcm24/Aresta/front/app/pages/conta.vue) / [`front/app/composables/useAuth.ts`](file:///home/bcc/vhwcm24/Aresta/front/app/composables/useAuth.ts)
- **Status Atual**: Estado local reativo de autenticação e flag `isPro` com modal de upgrade simulado.
- **Especificação de Backend Necessária**:
  - `GET /api/users/me/subscription`: Retorna plano atual (`FREE` | `PRO`), status da assinatura (`ACTIVE`, `PAST_DUE`, `CANCELED`), data de renovação e limites de uso.
  - `POST /api/subscriptions/checkout`: Inicia sessão de checkout (Stripe / Asaas / Mercado Pago).
    - *Payload*: `{ planId: 'pro_annual' | 'pro_monthly', successUrl: string, cancelUrl: string }`
    - *Retorno*: `{ checkoutUrl: string, sessionId: string }`
  - `POST /api/subscriptions/webhook`: Endpoint de webhook para processar eventos de pagamento e ativação/cancelamento do plano.
  - `GET /api/users/me/metrics`: Estatísticas agregadas (horas totais lidas, quantidade de livros na estante, nós conectados no grafo e taxa de retenção).

---

## 4. Ofensiva & Hábito de Leitura (Reading Streak)

- **Página / Componente**: [`front/app/components/ReadingStreak.vue`](file:///home/bcc/vhwcm24/Aresta/front/app/components/ReadingStreak.vue) / [`front/app/composables/useReadingStreak.ts`](file:///home/bcc/vhwcm24/Aresta/front/app/composables/useReadingStreak.ts)
- **Status Atual**: Simulação via composable com persistência local / fallback estático para ofensiva de 12 dias e histórico semanal.
- **Especificação de Backend Necessária**:
  - `GET /api/reading/streak`: Retorna a sequência ativa (`currentStreak`), recorde (`longestStreak`), meta diária em minutos (`dailyGoalMinutes`) e progresso de hoje (`todayMinutesRead`).
  - `POST /api/reading/heartbeat`: Enviado periodicamente pelo Leitor (`/reader`) a cada minuto de leitura ativa.
    - *Payload*: `{ bookId: string, page: number, durationSeconds: number }`
    - *Retorno*: `{ todayTotalMinutes: number, streakCompleted: boolean, currentStreak: number }`
  - `GET /api/reading/history`: Retorna o histórico de leitura dos últimos N dias.

---

## 5. Loja & Catálogo Aberto de Livros

- **Página / Componente**: [`front/app/pages/loja.vue`](file:///home/bcc/vhwcm24/Aresta/front/app/pages/loja.vue)
- **Status Atual**: Lista fixa em memória com obras clássicas e domínio público filtradas por categoria.
- **Especificação de Backend Necessária**:
  - `GET /api/store/books`: Lista livros disponíveis com paginação, busca e filtros.
    - *Query params*: `category?: string, search?: string, page?: number, limit?: number`
    - *Retorno*: `{ books: Array<StoreBook>, total: number, page: number, pages: number }`
  - `POST /api/store/books/:id/acquire`: Adiciona o livro do catálogo à estante do usuário logado (`UserBook`).
    - *Retorno*: `{ success: true, userBookId: number, bookId: number }`

---

## 6. Grafo de Conhecimento & Clustering com IA

- **Página / Componente**: [`front/app/pages/grafo.vue`](file:///home/bcc/vhwcm24/Aresta/front/app/pages/grafo.vue) / [`front/app/composables/useGraph.ts`](file:///home/bcc/vhwcm24/Aresta/front/app/composables/useGraph.ts)
- **Status Atual**: CRUD básico de nós e conexões com fallback local em caso de erro na API do backend Node.
- **Especificação de Backend Necessária**:
  - `POST /api/graph/auto-cluster`: Processa as anotações e livros do usuário para sugerir novas conexões conceituais via embeddings (OpenAI/Gemini + pgvector).
  - `GET /api/graph/export`: Exportação do grafo em formatos padrão (`Obsidian Markdown`, `JSON-LD`, `GraphML`).
