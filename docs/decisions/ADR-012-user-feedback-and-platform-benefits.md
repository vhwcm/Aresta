# ADR-012: Canal Direto de Feedback com Offcanvas Lateral e Apresentação de Benefícios da Plataforma

## Status
Aceito (Accepted)

## Data
2026-09-13

## Contexto
O Aresta evolui rapidamente integrando neurociência da leitura, repetição espaçada e organização espacial do conhecimento. Para aproximar os usuários do ciclo de melhorias e clarificar a proposta de valor do ecossistema, era necessário:
1. Um canal direto e sem fricção na interface principal para envio de feedbacks, sugestões de melhoria e relato de problemas.
2. Uma apresentação editorial detalhada que elucide todos os pilares e benefícios científicos do ecossistema Aresta frente aos leitores tradicionais de PDF/EPUB.
3. Persistência relacional auditável das mensagens no banco de dados PostgreSQL com chave estrangeira para o usuário e timestamp.

## Decisão
1. **Cabeçalho Unificado da Home (`index.vue`)**:
   - Inclusão de dois novos botões circulares no padrão visual da barra de controles (ao lado do botão de alternar tema e do badge de ofensiva/streak):
     - **Ícone de Informação (`InfoIcon`)**: Direciona para a rota dedicada `/beneficios`.
     - **Ícone de Mensagem (`MessageSquareIcon`)**: Aciona o drawer deslizante de feedback (`FeedbackCanvas`).
   - Disponível de forma consistente tanto na visualização com livros ativos na estante quanto no estado vazio inicial.

2. **Offcanvas Lateral de Feedback (`FeedbackCanvas.vue`)**:
   - Painel lateral deslizante via `<Teleport to="body">` com backdrop translúcido desfocado e suporte a fechamento por tecla ESC e clique externo.
   - Categorização em 3 tipos: **Melhoria** (`IMPROVEMENT`), **Feedback Geral** (`FEEDBACK`) e **Problema** (`BUG`).
   - Reconhecimento automático do usuário logado via `useAuth()`.
   - Estados observáveis de carregamento, erro com mensagem amigável e confirmação de sucesso com feedback visual.

3. **Página de Benefícios da Plataforma (`beneficios.vue`)**:
   - Página com design editorial de alto padrão e tipografia Newsreader/Inter, estruturada em 4 pilares:
     - Leitura Imersiva e Sensorial (física de virada de página 3D com Three.js e controle de luz/sépia).
     - Ciência Cognitiva e Retenção (algoritmo FSRS de repetição espaçada e recall ativo).
     - Grafo de Conhecimento Espacial e Zettelkasten (mapeamento relacional e notas bidirecionais).
     - Canvas Espacial Infinito e IA Didática (síntese pedagógica estruturada e livretos conceituais).
   - Tabela comparativa e chamadas para ação integradas à estante e upload.

4. **Persistência Relacional via Prisma ORM & PostgreSQL (`schema.prisma` e Migration SQL)**:
   - Criação do modelo `Feedback` no Prisma:
     - `id`: Chave primária autoincrementada.
     - `user_id`: Chave estrangeira referenciando `users(id)` com `ON DELETE CASCADE`.
     - `message`: Texto da mensagem (`@db.Text`).
     - `type`: Tipo de mensagem (`FEEDBACK` | `IMPROVEMENT` | `BUG`).
     - `created_at`: Data e hora de criação (`@default(now())`).
   - Geração e versionamento da migration SQL `20260913220500_add_feedbacks_table/migration.sql` em estrita conformidade com a Regra 3.2.
   - Endpoint `POST /api/feedback` e `GET /api/feedback` protegidos por autenticação e com cobertura integral de testes unitários.

## Consequências
- **Positivas**:
  - Canal direto, elegante e integrado para escuta contínua da comunidade de leitores.
  - Aumento da clareza e retenção dos usuários sobre os diferenciais científicos do Aresta.
  - Rastreabilidade completa das mensagens enviadas com auditoria por usuário no PostgreSQL.
  - 100% de cobertura de testes unitários no frontend e backend.
