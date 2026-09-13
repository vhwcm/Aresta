# Arquitetura de Livretos Didáticos com IA (`Didactic AI Booklets`)

O subsistema de **Livretos Didáticos com IA** do Aresta é responsável por gerar, estruturar, compor e renderizar cadernos pedagógicos de alta densidade cognitiva sob demanda, utilizando Inteligência Artificial generativa multimodal (Google Gemini) e o leitor imersivo com virada de página física (2D/3D).

---

## 1. Visão Geral e Diagrama Topológico de Ponta a Ponta

```text
========================================================================================================
                          ARQUITETURA DE LIVRETOS DIDÁTICOS COM IA (ARESTA)
========================================================================================================

    [ PONTOS DE ENTRADA (FRONTEND) ]
    ┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐
    │     Estante / Acervo      │  │    Central de Revisão     │  │   Grafo de Conhecimento   │
    │      (/library.vue)       │  │       (/revisao.vue)      │  │     (NodeDrawer.vue)      │
    │  "Novo Livreto Didático"  │  │   "Explicar com IA Tutor" │  │   "Aprofundar Tópico"     │
    └─────────────┬─────────────┘  └─────────────┬─────────────┘  └─────────────┬─────────────┘
                  │                              │                              │
                  └──────────────────────┬───────┴──────────────────────────────┘
                                         ▼
                         ┌───────────────────────────────┐
                         │   useDidacticBooklet.ts       │
                         │   - createBooklet()           │
                         │   - appendChapter()           │
                         │   - fetchBooklets()           │
                         └───────────────┬───────────────┘
                                         │ HTTP REST (JSON / Bearer Token)
                                         ▼
════════════════════════════════════════════════════════════════════════════════════════════════════════
    [ BACKEND MODULAR (EXPRESS + PRISMA - apps/api) ]
                                         │
                                         ▼
    ┌───────────────────────────────────────────────────────────────────────────────────────────┐
    │  didacticRouter (/api/didactic)                                                           │
    │  ├─► POST   /booklets             -> didacticController.create                           │
    │  ├─► POST   /booklets/:id/append  -> didacticController.append                           │
    │  ├─► GET    /booklets             -> didacticController.list                             │
    │  ├─► GET    /booklets/:id         -> didacticController.getById                          │
    │  └─► DELETE /booklets/:id         -> didacticController.delete                          │
    └────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                         ▼
    ┌───────────────────────────────────────────────────────────────────────────────────────────┐
    │  DidacticBookletService                                                                   │
    │  ├─► 1. Validação de Regras (Append exclusivo "Livreto em Livreto")                       │
    │  ├─► 2. Orquestração de Prompt & Síntese Pedagógica                                       │
    │  │       │                                                                                │
    │  │       ▼                                                                                │
    │  │   [ AIService / Gemini Flash ] ──► Cascata: gemini-3.7 -> 3.6 -> 3.5 -> APIs externas  │
    │  │                                    - Analogia Visual                                   │
    │  │                                    - Princípio Fundamental (First Principles)          │
    │  │                                    - Diagramas Mermaid.js                              │
    │  │                                    - Callouts Didáticos Pedagógicos                    │
    │  │                                    - Perguntas Active Recall                           │
    │  │                                                                                        │
    │  ├─► 3. Tratamento Estrito de Erro (SEM fallback offline mockado: HTTP 503 com mensagem) │
    │  └─► 4. Transações Prisma (Book, UserBook, DidacticBooklet, DidacticBookletChapter)       │
    └────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                         ▼
    ┌───────────────────────────────────────────────────────────────────────────────────────────┐
    │  PostgreSQL 16 Database                                                                   │
    │  ├─► books: { file_type: 'didactic', file_path: 'virtual://didactic/...' }                │
    │  ├─► user_books: { status: 'LENDO', current_page: 0 }                                    │
    │  ├─► didactic_booklets: { title, target_audience, theme_id }                              │
    │  └─► didactic_booklet_chapters: { order_index, raw_markdown, diagram_count }              │
    └───────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
════════════════════════════════════════════════════════════════════════════════════════════════════════
    [ RENDERIZAÇÃO & LEITURA IMERSIVA (apps/web) ]
                                         │
                                         ▼
    ┌───────────────────────────────────────────────────────────────────────────────────────────┐
    │  GET /api/books/:id/file (Entrega JSON estruturado com metadados e capítulos ordenados)  │
    └────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                         ▼
    ┌───────────────────────────────────────────────────────────────────────────────────────────┐
    │  DidacticDocumentAdapter (Strategy Pattern: IBookDocument)                                │
    │  ├─► 1. Parse JSON -> DidacticBookletData                                                 │
    │  ├─► 2. Paginação Virtual Inteligente (split por '---' e densidade de texto)             │
    │  ├─► 3. Compilação Markdown + Callouts (<div class="didactic-callout callout-*">)        │
    │  ├─► 4. Injeção de Âncoras Textuais: data-anchor="didactic://c{chap}/p{page}#b{block}"   │
    │  └─► 5. Renderização Client-side de Diagramas Mermaid (SVG responsivo)                   │
    └────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                         ▼
    ┌───────────────────────────────────────────────────────────────────────────────────────────┐
    │  Leitor Imersivo Aresta (/reader/[id].vue)                                                │
    │  ├─► Motor de Virada de Página Física 2D/3D (Three.js / Turn / Swipe Mobile)              │
    │  ├─► Sistema de Anotações & Grifos Coloridos Integrado                                    │
    │  └─► Sumário Dinâmico por Capítulos & Sincronização de Progresso                          │
    └───────────────────────────────────────────────────────────────────────────────────────────┘
========================================================================================================
```

---

## 2. Modelo de Dados e Relacionamentos no Prisma

O livreto didático se integra nativamente ao catálogo unificado de livros da plataforma, permitindo que a estante, o progresso de leitura e as anotações funcionem de forma idêntica a PDFs e EPUBs.

```text
┌─────────────────────────┐
│          User           │
└────────────┬────────────┘
             │ 1:N
             ├─────────────────────────────────────────┐
             │ 1:N                                     │ 1:N
             ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│        UserBook         │◄──────────────┤          Book           │
│ (status, progresso, etc)│     N:1       │(file_type = 'didactic') │
└─────────────────────────┘               └────────────┬────────────┘
                                                       │ 1:1
                                                       ▼
                                          ┌─────────────────────────┐
                                          │     DidacticBooklet     │
                                          │ (title, target_audience)│
                                          └────────────┬────────────┘
                                                       │ 1:N
                                                       ▼
                                          ┌─────────────────────────┐
                                          │ DidacticBookletChapter  │
                                          │  - order_index (1..N)   │
                                          │  - topic                │
                                          │  - raw_markdown         │
                                          │  - diagram_count        │
                                          │  - depth_level          │
                                          │  - flashcard_id (opt)   │
                                          │  - annotation_id (opt)  │
                                          └─────────────────────────┘
```

### Detalhamento das Entidades:

1. **`Book` (`books`)**:
   - Representação polimórfica de obras no Aresta.
   - Para livretos didáticos, `file_type = 'didactic'` e `file_path = 'virtual://didactic/<titulo>'`.
2. **`UserBook` (`user_books`)**:
   - Mantém o estado da estante do usuário: `status` (`QUERO_LER`, `LENDO`, `LIDO`), página atual (`current_page`), porcentagem concluída e data de último acesso.
3. **`DidacticBooklet` (`didactic_booklets`)**:
   - O agregador de capítulos e metadados didáticos. Vincula-se a `user_id`, `book_id` e opcionalmente `theme_id`.
4. **`DidacticBookletChapter` (`didactic_booklet_chapters`)**:
   - Unidade de conteúdo gerada pela IA. Possui chave única `@@unique([booklet_id, order_index])` garantindo ordenação estrita. Pode referenciar a anotação ou flashcard que originou a explicação.

---

## 3. Regra Inegociável: Append Exclusivo "Livreto em Livreto"

Para manter a integridade editorial da biblioteca, **apenas livretos didáticos podem receber novos capítulos (append)**. Livros externos (EPUBs e PDFs) são imutáveis.

```text
               Tentativa de Anexar Capítulo (POST /api/didactic/booklets/:id/append)
                                         │
                                         ▼
                      ┌────────────────────────────────────┐
                      │  Verificar se o alvo existe e é    │
                      │  um DidacticBooklet do usuário     │
                      └──────────────────┬─────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                   [ É Livreto? ]                 [ É PDF/EPUB ou ]
                      (SIM)                       [ Não Encontrado]
                         │                               │
                         ▼                               ▼
      ┌────────────────────────────────────┐   ┌────────────────────────────────────┐
      │ 1. Calcula max(order_index) + 1    │   │ Retorna HTTP 422 Unprocessable     │
      │ 2. Chama AI Tutor para novo tópico │   │ Code: CANNOT_APPEND_TO_NON_BOOKLET │
      │ 3. Salva novo DidacticChapter      │   │ "Só é permitido anexar capítulos   │
      │ 4. Atualiza sumário do livreto     │   │  em livretos gerados por IA."      │
      └────────────────────────────────────┘   └────────────────────────────────────┘
```

---

## 4. Prompt Engineering & Estrutura Pedagógica (Didactic AI Tutor)

Quando o serviço de IA é acionado (`AIService.generateDidacticExplanation`), o modelo Gemini recebe instruções estruturadas para produzir uma aula completa dividida por seções e callouts:

```text
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ ESTRUTURA DO MARKDOWN DIDÁTICO GERADO PELA IA                                         │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│ # [Título Cativante e Intuitivo]                                                     │
│                                                                                       │
│ > [!ANALOGY]                                                                          │
│ > Analogia do mundo real para ancoragem intuitiva do conceito.                        │
│                                                                                       │
│ ---                                                                                   │
│                                                                                       │
│ ## 1. O Princípio Fundamental (First Principles)                                      │
│ > [!KEY_CONCEPT]                                                                      │
│ > Definição cristalina e sem jargões desnecessários.                                  │
│                                                                                       │
│ ---                                                                                   │
│                                                                                       │
│ ## 2. Mapa Mental & Fluxo Visual                                                      │
│ ```mermaid                                                                            │
│ flowchart TD                                                                          │
│     A[Conceito Raiz] --> B[Processamento Intermediário]                               │
│     B --> C[Resultado / Impacto Prático]                                              │
│ ```                                                                                   │
│                                                                                       │
│ ---                                                                                   │
│                                                                                       │
│ ## 3. Aplicação no Mundo Real                                                         │
│ Exemplos concretos e conexões práticas com problemas reais.                           │
│                                                                                       │
│ > [!TIP]                                                                              │
│ > Dica de fixação e boas práticas.                                                    │
│                                                                                       │
│ > [!WARNING]                                                                          │
│ > Armadilhas comuns e o que NÃO fazer.                                                │
│                                                                                       │
│ ---                                                                                   │
│                                                                                       │
│ ## 4. Autoavaliação (Active Recall)                                                   │
│ 1. Pergunta de reflexão 1                                                             │
│ 2. Pergunta de reflexão 2                                                             │
│ 3. Pergunta de reflexão 3                                                             │
│                                                                                       │
│ > [!NOTE]                                                                             │
│ > Síntese em uma frase memorável (Key Takeaway).                                      │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Padrão Strategy no Frontend: `DidacticDocumentAdapter`

Para unificar o leitor e permitir que livretos funcionem no mesmo motor de virada de página (Three.js 3D / 2D Canvas) que EPUBs e PDFs, o frontend adota a interface `IBookDocument`:

```text
                         ┌─────────────────────────┐
                         │      IBookDocument      │
                         │ (Interface do Leitor)   │
                         └────────────▲────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
┌───────┴──────────────┐   ┌──────────┴───────────┐   ┌─────────────┴────────────┐
│  EpubDocumentAdapter │   │  PdfDocumentAdapter  │   │ DidacticDocumentAdapter  │
│    (Foliate.js)      │   │      (PDF.js)        │   │ (Markdown + Mermaid 3D)  │
└──────────────────────┘   └──────────────────────┘   └─────────────┬────────────┘
                                                                    │
                                    ┌───────────────────────────────┴───────────────────────────────┐
                                    │ 1. paginate(): Quebra seções '---' em páginas virtuais        │
                                    │ 2. convertMarkdownToHtml(): Transforma callouts e tags        │
                                    │ 3. renderTextLayer(): Monta DOM com data-anchor para grifos   │
                                    │ 4. mermaid.run(): Compila diagramas para SVG dinâmico         │
                                    └───────────────────────────────────────────────────────────────┘
```

### Mecânica de Grifos e Anotações em Livretos:
Cada bloco e parágrafo recebe um seletor determinístico:
`didactic://c{chapterIndex}/p{pageNumber}#b{blockIndex}`

Isso permite que:
1. O usuário selecione qualquer trecho no livreto e crie destaques coloridos (Amarelo, Verde, Rosa, Azul, Roxo).
2. As notas sejam salvas na tabela `annotations` vinculadas ao `book_id` do livreto.
3. A gaveta de anotações (`BookAnnotationsDrawer`) liste todas as citações e notas contextuais.

---

## 6. Resiliência e Cascata Hierárquica de Modelos (Sem Fallback Offline Mockado)

Para garantir integridade pedagógica e evitar livros "fantasma" ou com textos genéricos na estante do usuário, **o sistema não gera livros mockados em caso de falha de IA**.

Em vez disso, adota uma **estratégia de cascata em camadas**:

```text
       [ Requisição de Geração Didática ]
                       │
                       ▼
         ┌───────────────────────────┐
         │     gemini-3.7-flash      │ ──► Sucesso ──► Retorna e Salva no Banco
         └─────────────┬─────────────┘
                       │ Falha / 404 / 429
                       ▼
         ┌───────────────────────────┐
         │     gemini-3.6-flash      │ ──► Sucesso ──► Retorna e Salva no Banco
         └─────────────┬─────────────┘
                       │ Falha / 404 / 429
                       ▼
         ┌───────────────────────────┐
         │     gemini-3.5-flash      │ ──► Sucesso ──► Retorna e Salva no Banco
         └─────────────┬─────────────┘
                       │ Falha / 404 / 429
                       ▼
         ┌───────────────────────────┐
         │ Provedor Fallback .env    │ ──► Sucesso ──► Retorna e Salva no Banco
         │ (Groq, OpenAI, OpenRouter)│
         └─────────────┬─────────────┘
                       │ Falha / Não Configurado
                       ▼
         ┌───────────────────────────┐
         │ Retorna HTTP 503 com erro │
         │ genérico e amigável na UI │
         │ (Nenhum livro é criado)   │
         └───────────────────────────┘
```

1. **Prioridade Gemini Flash 3.7**: Utiliza o modelo mais moderno do Google como padrão em todo o ecossistema.
2. **Degradação Elegante (3.6 e 3.5)**: Se houver sobrecarga ou indisponibilidade, o sistema automaticamente tenta os modelos anteriores.
3. **Fallback para Provedores Adicionais (.env)**: Se configurado (`FALLBACK_AI_BASE_URL`, `FALLBACK_AI_API_KEY`, `FALLBACK_AI_MODEL`), qualquer API compatível com o padrão OpenAI / Chat Completions é acionada.
4. **Sem Poluição de Dados**: Se todas as tentativas falharem, a API retorna HTTP 503 com a mensagem:
   *"Não foi possível gerar a explicação com Inteligência Artificial no momento. Por favor, tente novamente em instantes."*
   O frontend exibe uma notificação clara em vermelho/âmbar dentro do modal, mantendo a estante limpa.

---

## 7. Quality Gates e Testes Automatizados

O subsistema possui testes unitários e de integração cobrindo:
- Criação de livretos e geração de capítulos.
- Restrição de append (`CANNOT_APPEND_TO_NON_BOOKLET`).
- Parse, paginação virtual, injeção de âncoras e renderização do `DidacticDocumentAdapter`.
- Navegação, virada de página e abertura de gavetas no leitor Nuxt 3.
