# Requisitos: Refatoração de Temas, Anotações e Grafo de Conhecimento

## 1. Objetivo Geral
Refatorar a arquitetura de temas, anotações e o grafo de conhecimento no Aresta para transformar temas em um catálogo global dinâmico com hierarquia de subtemas, disponibilizar um painel administrativo para upload e catalogação de livros por Viktor, e modernizar o grafo de conhecimento para exibir nós de livros com capas truncadas e um canvas overlay deslizante de temas com carrossel de livros e feed de anotações vinculadas.

---

## 2. Escopo

### Incluído
- **Catálogo Global de Temas**: Migração para tabela `Theme` unificada e global, com suporte a tabela `ThemeHierarchy` para modelagem precisa de subtemas (ex: "Programação" -> "Mentalidade de programação", "Ferramentas").
- **Painel Administrativo para Viktor (`/admin/upload` ou `/admin/livros`)**: Upload de PDFs/EPUBs com Título e Autor, extração automática de capa (com fallback) e persistência de metadados públicos em `BookPublicInfo`.
- **Anotações Soltas & Validação de Temas**: Suporte a anotações soltas criadas diretamente no livro (`cfi` opcional) e garantia de que anotações só possam ser vinculadas a temas pertencentes àquele livro.
- **Visualização do Grafo de Conhecimento**: Renderização de nós de temas (círculos) e nós de livros (capa + título truncado em até 10 caracteres com `'...'`).
- **Interações do Grafo**:
  - Clique no Livro: Drawer/Painel exibindo todas as anotações do livro e formulário para criação de anotações soltas.
  - Clique no Tema: Canvas Overlay deslizante sobre o grafo contendo carrossel horizontal de livros no topo e feed de anotações do tema abaixo, com redirecionamento/filtro ao clicar em um livro.

### Não Incluído / Fora de Escopo
- **Enriquecimento Automático por IA (AnalyzeBook / Gemini / Embeddings)**: Removido do escopo. Temas são vinculados manualmente pelo usuário ou curador através da estante.
- Conversão OCR manual de imagens manuscritas (mantém-se funcional como está no gRPC existente).
- Sistema de e-commerce ou pagamento de livros.

---

## 3. Requisitos Funcionais

### R1. Catálogo Global de Temas e Hierarquia de Subtemas
- **Descrição**: O sistema deve manter uma única tabela global de temas (`Theme`), acessível a todos os livros e usuários, com nome único normalizado, cor, descrição e embedding vetorial.
- **Atores**: Sistema, Microserviço Go, Viktor (Admin), Usuário Autenticado.
- **Regras de Validação**:
  - Subtemas são relacionados através da tabela `ThemeHierarchy` (`parent_theme_id`, `child_theme_id`).
  - Livros são associados aos temas na tabela `BookTheme` (`book_id`, `theme_id`).

### R2. Painel Administrativo de Livros (Viktor)
- **Descrição**: Disponibilizar interface administrativa protegida por `role === 'ADMIN'` para upload de arquivos `.pdf` e `.epub`, preenchimento de `title` e `author`, extração da imagem de capa e envio para o catálogo público.
- **Atores**: Viktor / Administrador.
- **Regras de Validação**:
  - Arquivos devem ser validados quanto à extensão e MIME type (`application/pdf`, `application/epub+zip`).
  - Campos `title` e `author` são obrigatórios.

### R3. [REMOVIDO DO ESCOPO] Pesquisa na Web, Resumo e Embeddings de Temas via IA
- **Status**: Removido do escopo.
- **Motivação**: Atribuição automática por IA substituída por vinculação direta e manual via modal da estante/biblioteca (`PUT /api/user-books/:id/themes`), mantendo a adição de livros ágil e determinística.

### R4. Anotações do Livro e Anotações Soltas
- **Descrição**: Permitir criação de anotações vinculadas ao leitor (com CFI e trecho selecionado) e anotações soltas (sem CFI obrigatório) criadas diretamente pelo grafo ou painel do livro.
- **Atores**: Usuário Autenticado.
- **Regras de Validação**:
  - O campo `cfi` na tabela `Annotation` deve ser opcional (`String?`).
  - Anotações só podem ser vinculadas a temas que façam parte dos temas associados ao livro (`BookTheme`).

### R5. Grafo de Conhecimento com Nós de Livros
- **Descrição**: O Grafo D3/SVG deve renderizar tanto nós de temas quanto nós de livros. Nós de livros devem exibir a capa em miniatura e o título truncado em até 10 caracteres seguido de `...` se ultrapassar 10 caracteres.
- **Atores**: Usuário Autenticado.
- **Regras de Validação**:
  - Arestas conectam livros aos seus temas correspondentes e temas pais aos seus subtemas.
  - O título do livro no nó deve seguir a regra: `title.length > 10 ? title.slice(0, 10) + '...' : title`.

### R6. Interações e Canvas Overlay do Grafo
- **Descrição**:
  - Ao clicar em um nó de Livro: Abre drawer/painel com todas as anotações do livro e formulário para criar anotações soltas.
  - Ao clicar em um nó de Tema: Abre um Canvas Overlay deslizante sobre o grafo com lista horizontal scrollável de livros no topo e lista vertical de anotações daquele tema na parte inferior.
  - Ao clicar em um livro dentro do carrossel do tema: O painel filtra/redireciona para exibir apenas as anotações daquele livro selecionado.
- **Atores**: Usuário Autenticado.

---

## 4. Requisitos Não Funcionais
- **Performance**: A renderização do grafo D3 deve manter 60 FPS com simulação de forças otimizada e debounce no redimensionamento.
- **Segurança**: Rotas administrativas protegidas com middleware de verificação de papel `ADMIN`.
- **Resiliência**: Tratamento de timeout e fallback no microserviço Go caso a API externa de busca demore ou falhe.
- **Compatibilidade**: Suporte a temas claro e escuro no Canvas Overlay e nos nós SVG.

---

## 5. Critérios de Aceite
- [x] O modelo Prisma foi migrado com sucesso contendo as tabelas `Theme`, `ThemeHierarchy`, `BookTheme`, `BookPublicInfo` e `Annotation` (`cfi` opcional).
- [x] Viktor (Admin) consegue acessar o painel `/admin/upload`, subir um PDF/EPUB com Título e Autor, e salvar no catálogo.
- [x] Temas são vinculados manualmente pelo usuário ou curador via modal da estante/biblioteca (`user-books/:id/themes`).
- [x] Anotações podem ser criadas sem CFI (anotações soltas) e são restritas aos temas do livro.
- [x] O grafo exibe nós de temas e nós de livros com capas e títulos truncados em 10 caracteres (`...`).
- [x] Clicar no livro abre o drawer de anotações do livro e criação de notas soltas.
- [x] Clicar no tema abre o Canvas Overlay com carrossel horizontal de livros no topo e anotações do tema abaixo.
