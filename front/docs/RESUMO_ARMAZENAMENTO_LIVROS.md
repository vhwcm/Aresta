# Resumo das Alterações — Gestão de Livros, Capas e Armazenamento

## 1. Estrutura de Armazenamento no Servidor
- **Diretório de Livros (Privado)**: `aresta-back-node/storage/books/` para armazenamento seguro de arquivos PDF/EPUB.
- **Diretório de Capas (Acesso Rápido)**: `aresta-back-node/storage/covers/` exposto via rota estática do Express (`/covers/...`) para entrega otimizada de imagens PNG no front-end.

## 2. Modelagem de Dados (Prisma ORM)
- **Model `Book`**: Tabela `books` para persistir `id`, `title`, `file_path`, `cover_path` e `created_at`, além do seed inicial dos livros.

## 3. Camada Backend (Node.js + Express + Prisma)
- **Service**: `BookService` (operações CRUD com Prisma Client).
- **Controller**: `BookController` fornecendo endpoints `/api/books`, `/api/books/:id`, `/api/books/:id/cover` e `/api/books/:id/file`.
- **Servidor Estático**: Mapeamento da rota estática `/covers` em `app.ts`.

## 4. Documentação MDX
- Documento [`livros_e_armazenamento.md`](livros_e_armazenamento.md) integrado à navegação da documentação em `mint.json` e `docs.json`.
