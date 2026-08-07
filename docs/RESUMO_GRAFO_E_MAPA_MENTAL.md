# 🌌 Módulo de Grafo & Mapa Mental de Leitura

O módulo de **Grafo & Mapa Mental** permite aos usuários visualizar e organizar os conceitos, temas e categorias dos livros que estão lendo no sistema **Aresta** em um visualizador interativo em estilo Obsidian.

---

## 🏗️ 1. Banco de Dados e Migrações (Flyway V7)

As tabelas criadas no banco de dados SQLite (`aresta_dev.db` e `aresta_prod.db`) via Flyway em `V7__create_user_books_and_themes_graph.sql` são:

1. **`user_books`**:
   - Armazena a estante individual de cada usuário.
   - Campos: `id`, `user_id`, `book_id`, `status` (`QUERO_LER`, `LENDO`, `LIDO`, `ABANDONADO`), `current_page`, `created_at`, `updated_at`.
   - Restrição `UNIQUE(user_id, book_id)`.

2. **`themes`**:
   - Representa os nós de temas/conceitos no mapa mental pertencentes a um usuário.
   - Campos: `id`, `user_id`, `name`, `color`, `description`, `created_at`.

3. **`theme_connections`**:
   - Conexões (arestas) direcionadas entre nós de temas para compor o mapa mental em malha.
   - Campos: `id`, `user_id`, `source_theme_id`, `target_theme_id`, `created_at`.

4. **`book_themes`**:
   - Associação N:N entre os livros do usuário (`user_books`) e os nós de temas no grafo.
   - Campos: `id`, `user_book_id`, `theme_id`, `created_at`.

---

## ⚡ 2. API REST Backend (Java / Javalin)

- `GET /api/user-books`: Retorna todos os livros da estante do usuário logado.
- `POST /api/user-books`: Adiciona um livro à estante do usuário.
- `PATCH /api/user-books/{id}`: Atualiza status de leitura e página em que o usuário parou.
- `DELETE /api/user-books/{id}`: Remove o livro da estante.

- `GET /api/graph`: Retorna nós (`nodes`), arestas (`edges`) e livros associados ao grafo do usuário.
- `POST /api/graph/nodes`: Cria um novo nó de tema.
- `PUT /api/graph/nodes/{id}`: Atualiza nome, cor ou descrição do tema.
- `DELETE /api/graph/nodes/{id}`: Deleta um nó de tema.
- `POST /api/graph/connections`: Conecta dois nós de temas.
- `DELETE /api/graph/connections/{sourceId}/{targetId}`: Desconecta dois temas.
- `POST /api/graph/nodes/{id}/books`: Vincula um livro da estante a um nó de tema.
- `DELETE /api/graph/nodes/{id}/books/{userBookId}`: Desvincula o livro do nó.

---

## 🎨 3. Visualizador Frontend (Nuxt 3 / D3.js)

- **Simulação Física em D3.js**: Renderiza o grafo em tela cheia com simulação de forças (`forceSimulation`, `forceLink`, `forceManyBody`, `forceCollide`), zoom, pan e arrasto de nós.
- **Gaveta de Inspeção (`NodeDrawer.vue`)**: Permite ver os detalhes de cada nó, seus livros conectados (com badge de status `Lendo`, `Lido` e progresso de páginas), alterar cor/descrição ou vincular novos livros.
- **Modais**: Modais de criação de tema e de conexão entre dois temas no mapa mental.

---

## 🧪 4. Cobertura de Testes

- **Backend (JUnit 5 + SQLite)**:
  - `UserBookRepositoryTest.java` (Valida CRUD e relacionamentos da estante).
  - `GraphRepositoryTest.java` (Valida criação de nós, conexões e buscas de dados do grafo).
- **Frontend (Vitest)**:
  - `useGraph.test.ts` (Valida o composable do grafo e requisições REST).
  - `useUserBooks.test.ts` (Valida o composable de livros do usuário).
