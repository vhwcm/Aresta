# Resumo das Alterações — Gestão de Livros, Capas e Armazenamento

## 1. Estrutura de Armazenamento no Servidor
- **Diretório de Livros (Privado)**: `aresta-back/storage/books/` para armazenamento seguro de arquivos PDF.
- **Diretório de Capas (Acesso Rápido)**: `aresta-back/storage/covers/` exposto via rota estática do Javalin (`/covers/...`) para entrega otimizada de imagens PNG no front-end.

## 2. Migrações de Banco de Dados (Flyway)
- **`V4__create_books_table.sql`**: Tabela `books` para persistir `id`, `title`, `file_path` e `created_at`, além do seed inicial dos livros.
- **`V6__add_cover_path_to_books.sql`**: Expansão do esquema com a coluna `cover_path` para vincular as imagens das capas.

## 3. Camada Backend (Java + Javalin)
- **Model**: `org.example.model.Book` (Record).
- **Repository**: `BookRepository` e `JdbcBookRepository` (operações CRUD SQL parametrizadas).
- **Controller**: `BookController` fornecendo endpoints `/api/books`, `/api/books/{id}` e `/api/books/{id}/cover`.
- **Servidor Estático**: Mapeamento da rota estática `/covers` em `Main.java`.

## 4. Documentação MDX
- Documento [`livros_e_armazenamento.md`](livros_e_armazenamento.md) integrado à navegação da documentação em `mint.json` e `docs.json`.
