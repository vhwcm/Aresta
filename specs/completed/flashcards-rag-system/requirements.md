# Requisitos: Sistema de Flashcards com RAG e Repetição Espaçada

## 1. Objetivo Geral
Implementar um sistema inteligente de flashcards por usuário baseado em suas anotações e destaques de leitura. Utilizando RAG (*Retrieval-Augmented Generation*) sobre o espaço vetorial de embeddings das anotações, a IA especializada do Gemini gera flashcards em 3 arquétipos pedagógicos (Situação Real, Relembração de Conceito e União de Conceitos). Os flashcards gerados são persistidos 1:1 com as anotações para reutilização com custo zero de IA em dias subsequentes. Um job agendado às 22:00 gera cards para novas anotações, e às 00:00 prepara o deck diário de até 50 flashcards combinando Repetição Espaçada e balanceamento por temas. O primeiro flashcard do dia é exibido na Home do leitor e as revisões alimentam a ofensiva (*streak*) do usuário.

---

## 2. Escopo

- **Incluído**:
  - Geração e persistência de embeddings vetoriais para as anotações do usuário.
  - Microsserviço gRPC (`aresta-ocr` / Gemini) com suporte a `GenerateEmbedding` e `GenerateFlashcard` com prompt few-shot especializado em 3 arquétipos pedagógicos.
  - RAG local no backend Node: busca por vizinhos mais próximos no espaço vetorial de anotações do usuário via cosine similarity para enriquecimento contextual.
  - Geração incremental 1:1 (cada anotação gera 1 flashcard persistente, evitando regeneração dispendiosa).
  - Scheduler/Cron no backend Node: execução às 22:00 para gerar flashcards de anotações pendentes e às 00:00 para compor o deck diário de até 50 cards.
  - Fallback sob demanda: geração automática do deck/cards caso o usuário acesse antes da execução do job diário.
  - Deck diário de até 50 flashcards (ou total de anotações se < 50) priorizando repetição espaçada (curva do esquecimento / cards difíceis) e completando com sorteio balanceado por temas.
  - Exibição do 1º flashcard do dia na Home com redirecionamento para a página de revisão.
  - Interface interativa na página `/revisao` com autoavaliação (Difícil, Bom, Fácil) que atualiza os intervalos de repetição e incrementa a ofensiva (`streak`).
  - Endpoints REST documentados com Swagger.

- **Não Incluído**:
  - Geração de flashcards para usuários sem nenhuma anotação cadastrada (nestes casos exibe estado amigável orientando o usuário a ler e destacar trechos).
  - Compartilhamento social público de flashcards entre diferentes usuários (escopo isolado por usuário).

---

## 3. Requisitos Funcionais

### R1. Embeddings de Anotações & Espaço Vetorial
- **Descrição**: O sistema deve gerar e armazenar os embeddings vetoriais (vetor de float) de cada anotação criada (`selected_text` + `note`).
- **Atores**: Sistema / Usuário Autenticado.
- **Regra de Validação**: Caso uma anotação seja editada, o embedding deve ser invalidado e recalculado. O embedding é serializado como JSON na coluna `embedding` do modelo `Annotation`.

### R2. Geração Incremental 1:1 de Flashcards via RAG e IA Especializada
- **Descrição**: Cada anotação do usuário dá origem a exatamente 1 flashcard persistido no banco de dados (`Flashcard`).
- **Atores**: Sistema (Job das 22h / Fallback On-Demand).
- **Regra de Validação**: 
  - Ao gerar o flashcard para uma anotação alvo, o sistema busca no espaço vetorial do usuário até 3 anotações vizinhas com maior similaridade de cosseno.
  - O prompt enviado ao Gemini (via gRPC) inclui a anotação alvo, as anotações vizinhas de contexto, o tema e o livro, utilizando small-shot com 3 arquétipos pedagógicos:
    1. **Situação Real**: Aplicação prática do conceito em cenário verossímil.
    2. **Relembração de Conceito**: Pergunta direta e instigante sobre o mecanismo conceitual.
    3. **União de Conceitos**: Conexão entre o conceito da anotação e os conceitos vizinhos trazidos pelo RAG.
  - O flashcard gerado é salvo com vínculo `annotation_id` único, pergunta, resposta, arquétipo (`card_type`) e estado inicial de repetição espaçada.

### R3. Reutilização de Flashcards e Custo Zero em Dias Subsequentes
- **Descrição**: Flashcards já existentes no banco nunca são recriados pela IA, a menos que a anotação seja excluída ou recriada.
- **Atores**: Sistema.
- **Regra de Validação**: O job das 22h filtra apenas `annotations` onde `flashcard IS NULL`. Se o usuário tiver 50 anotações e todas já tiverem flashcard, 0 chamadas de IA são efetuadas.

### R4. Composição do Deck Diário de 50 Flashcards
- **Descrição**: Às 00:00 (ou no primeiro acesso do dia), o backend seleciona o deck diário do usuário (`DailyDeckCard`).
- **Atores**: Sistema / Usuário Autenticado.
- **Regra de Validação**:
  - Limite diário: máximo de 50 flashcards por usuário por dia (se o usuário possuir menos de 50 anotações/flashcards, o deck terá o total disponível).
  - Algoritmo de seleção:
    1. **Prioridade 1**: Flashcards agendados para revisão hoje (`next_review_at <= hoje`) ou marcados como difíceis.
    2. **Prioridade 2**: Sorteio aleatório ponderado/balanceado entre os diferentes temas de livros do usuário para completar a cota de 50.
  - O deck fica gravado para o dia (`YYYY-MM-DD`), garantindo consistência durante toda a jornada do dia.

### R5. Exibição do 1º Flashcard na Home
- **Descrição**: O primeiro flashcard do deck diário ativo deve ser retornado para o feed da Home do usuário logado.
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: A Home exibe a tag do livro/capítulo, a pergunta instigante do 1º flashcard e o botão de ação rápida "Fazer Flashcard", redirecionando para `/revisao`.

### R6. Central de Revisão & Repetição Espaçada (Curva do Esquecimento)
- **Descrição**: Na página `/revisao`, o usuário estuda os flashcards do dia com flip 3D e autoavaliação.
- **Atores**: Usuário Autenticado.
- **Regra de Validação**:
  - Opções de autoavaliação:
    - **Difícil**: `repetition_level = 1`, `next_review_at = hoje + 1 dia`.
    - **Bom**: `repetition_level = level + 1`, `next_review_at = hoje + 3 dias` (ou escalonado por nível).
    - **Fácil**: `repetition_level = level + 2`, `next_review_at = hoje + 7 dias` (ou escalonado por nível).
  - Cada resposta registra o progresso no deck diário.

### R7. Integração com Ofensiva (Streak)
- **Descrição**: Cada avaliação de flashcard realizada incrementa a atividade diária de flashcards (`flashcards_reviewed`).
- **Atores**: Sistema / Usuário Autenticado.
- **Regra de Validação**: Ao revisar flashcards, o serviço `StreakService.recordActivity` é invocado com `flashcards_reviewed += 1`. Revisar a meta estipulada contribui para manter a ofensiva ativa.

---

## 4. Requisitos Não Funcionais

- **Performance**: A recuperação do deck diário e do 1º card na Home deve responder em menos de 100ms (consultas indexadas no SQLite).
- **Eficiência de IA**: Minimização rigorosa de tokens e custos de API por meio da persistência 1:1 e reutilização contínua.
- **Tolerância a Falhas**: Fallback gracioso com log de erro se a API do Gemini estiver indisponível, sem travar a navegação do usuário.
- **Observabilidade**: Logs detalhados com timestamps, contadores de cards gerados e tempo de execução dos jobs agendados.

---

## 5. Critérios de Aceite

- [ ] Campo `embedding` persistido na tabela `annotations` e preenchido com vetor de similaridade.
- [ ] Tabela `flashcards` modelada com relação 1:1 com `annotations`, armazenando `question`, `answer`, `card_type`, `repetition_level` e `next_review_at`.
- [ ] Tabela `daily_deck_cards` modelada para registrar o deck de 50 cards diários por data e usuário.
- [ ] Microsserviço gRPC e backend Node integrados para gerar embeddings e flashcards com small-shot de 3 arquétipos (Situação Real, Relembração, União de Conceitos).
- [ ] Job agendado (22:00) gerando flashcards apenas para novas anotações sem card.
- [ ] Job agendado (00:00) / Fallback sob demanda montando o deck diário de até 50 cards balanceado por repetição espaçada e temas.
- [ ] Widget da Home consumindo o 1º flashcard real da API do deck diário do usuário.
- [ ] Página `/revisao` consumindo o deck real do usuário, permitindo flip 3D, avaliação (Difícil, Bom, Fácil) e registrando no Streak.
- [ ] Testes automatizados cobrindo geração de flashcards, seleção do deck diário, cálculo de repetição espaçada e endpoints de API.
