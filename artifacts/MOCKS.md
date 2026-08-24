# Registro de Recursos Mockados & Roadmap de Integração de Backend

Este documento mapeia todas as funcionalidades que foram mockadas no front-end do **Aresta** devido à ausência temporária de endpoints no backend, fornecendo a especificação dos contratos de API para implementação futura.

---

## 1. Conversor de PDF para EPUB

### Estado Atual no Front-end:
- Simulação de pipeline de processamento em 4 etapas:
  1. *Análise estrutural e validação de páginas*;
  2. *Extração de texto e segmentação de capítulos*;
  3. *Otimização de tipografia e remoção de cabeçalhos/rodapés repetitivos*;
  4. *Empacotamento do container EPUB3*.
- Geração de um arquivo EPUB funcional no cliente ou download de placeholder formatado.

### Endpoint Futuro Necessário:
- **POST** `/api/converter/pdf-to-epub`
  - **Payload (Multipart Form):**
    ```typescript
    {
      file: File, // PDF original
      options: {
        ocrEnabled: boolean,
        extractImages: boolean,
        chapterDetection: 'auto' | 'strict' | 'headings',
        fontSizeRatio: number
      }
    }
    ```
  - **Resposta (SSE ou polling via Job ID):**
    ```json
    {
      "jobId": "conv_9823f9a",
      "status": "processing",
      "progress": 45,
      "currentStep": "Extraindo texto dos capítulos",
      "resultUrl": "/storage/converted/conv_9823f9a.epub"
    }
    ```

---

## 2. Sistema de Revisão (Flashcards & Resumos Inteligentes)

### Estado Atual no Front-end:
- Flashcards mockados com base nos livros da biblioteca (`Sapiens`, `A Estrutura das Revoluções Científicas`, `O Design do Dia a Dia`).
- Algoritmo de repetição espaçada simulado em memória local (`localStorage` / estado reativo).
- Resumos de anotações e citações agrupados por obra gerados estaticamente.

### Endpoints Futuros Necessários:
1. **GET** `/api/reviews/flashcards`
   - Retorna os cards agendados para o dia com metadados de intervalo (`easeFactor`, `intervalDays`, `dueDate`).
2. **POST** `/api/reviews/flashcards/:id/answer`
   - Registra a resposta do usuário (`again`, `hard`, `good`, `easy`) e atualiza o agendamento de repetição espaçada (SM-2 / FSRS).
3. **GET** `/api/reviews/summaries`
   - Retorna os resumos consolidados por livro e capítulos.
4. **POST** `/api/reviews/generate-from-highlight`
   - Aciona IA no backend para converter um trecho destacado em um flashcard de pergunta/resposta.

---

## 3. Gerenciamento de Conta & Upgrade Premium

### Estado Atual no Front-end:
- Estatísticas do usuário (horas de leitura, livros lidos, nós de grafo, taxa de retenção) calculadas ou mockadas via `useAccount`.
- Modal e fluxo de Upgrade para o plano **Aresta Pro** simulado com feedback de sucesso.

### Endpoints Futuros Necessários:
1. **GET** `/api/users/me/stats`
   - Métricas consolidadas de leitura, tempo ativo, revisões e nós.
2. **POST** `/api/billing/create-checkout-session`
   - Integração com Stripe / MercadoPago / Asaas para assinatura do plano Pro.
3. **GET** `/api/billing/subscription-status`
   - Status da assinatura (`active`, `canceled`, `past_due`), data de renovação e limites de uso.

---

## 4. Ofensiva de Leitura (Streak)

### Estado Atual no Front-end:
- Ofensiva calculada no cliente com base em leituras registradas nos últimos 7 dias (mock com 14 dias ativos).

### Endpoints Futuros Necessários:
1. **GET** `/api/users/me/streak`
   ```json
   {
     "currentStreak": 14,
     "longestStreak": 28,
     "lastReadDate": "2026-08-24T10:00:00Z",
     "dailyGoalMinutes": 20,
     "todayMinutesRead": 25,
     "weekActivity": [true, true, true, true, true, true, true]
   }
   ```
2. **POST** `/api/users/me/reading-heartbeat`
   - Envia pulso de leitura a cada minuto lido no Reader para atualizar o streak em tempo real.

---

## 5. Loja & Catálogo de Obras Recomendadas

### Estado Atual no Front-end:
- Catálogo de livros clássicos em domínio público e títulos recomendados com metadados editoriais mockados no composable `useCatalog`.

### Endpoints Futuros Necessários:
1. **GET** `/api/catalog/books`
   - Lista paginada com filtros por categoria, idioma e relevância.
2. **POST** `/api/catalog/books/:id/add-to-library`
   - Copia o livro do catálogo público diretamente para a estante privada do usuário autenticado.
