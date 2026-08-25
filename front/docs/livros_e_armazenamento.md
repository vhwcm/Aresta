# Gestão de Livros & Armazenamento de Arquivos e Capas

Documentação do módulo de armazenamento de livros digitais (PDF e EPUB 3), extração e gestão de capas, banco de dados e endpoints REST no servidor Aresta.

---

## 1. Visão Geral da Arquitetura

O sistema gerencia livros digitais dividindo o armazenamento e a entrega em diretórios dedicados e variáveis configuráveis:

1. **Repositório de EPUBs (`storage/epubs/`)**: Diretório dos livros digitais reflowable no padrão EPUB 3.
2. **Repositório de PDFs (`storage/pdfs/`)**: Diretório dos arquivos PDF originais para arquivamento e conversão.
3. **Repositório de Capas (`storage/covers/`)**: Diretório de imagens PNG/JPEG de capas dos livros para exibição no front-end.
4. **Banco de Dados (SQLite + Prisma ORM)**: Tabela `books` para relacionar `id`, `title`, `file_path` (`storage/epubs/...`) e `cover_path` (`storage/covers/...`).

---

## 2. Estrutura de Pastas no Servidor

No diretório `aresta-back-node/`:

```text
aresta-back-node/
├── storage/
│   ├── epubs/              # Arquivos EPUB 3 dos livros
│   │   ├── a-cartomante.epub
│   │   ├── O-Alienista.epub
│   │   └── ...
│   ├── pdfs/               # Arquivos PDF originais
│   │   ├── a-cartomante.pdf
│   │   ├── O-Alienista.pdf
│   │   └── ...
│   └── covers/             # Capas em formato PNG
│       ├── a-cartomante.png
│       ├── O-Alienista.png
│       └── ...
```

---

## 3. Configurações e Rotas Centralizadas

As rotas e diretórios são configurados centralizadamente em `src/config/routes.ts` e `src/config/env.ts`:

- `ROUTES.BOOKS`: `/api/books`
- `ROUTES.CONVERT`: `/api/convert`
- `ROUTES.EPUBS`: `/epubs`
- `ROUTES.PDFS`: `/pdfs`
- `ROUTES.COVERS`: `/covers`

---

## 4. Endpoints da API RESTful (Express.js)

O servidor Express expõe os seguintes endpoints HTTP:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/books` | Retorna a lista em JSON de todos os livros cadastrados |
| `GET` | `/api/books/:id` | Retorna o JSON com os detalhes de um livro específico por ID |
| `GET` | `/api/books/:id/cover` | Transmite o arquivo de imagem PNG da capa do livro |
| `GET` | `/api/books/:id/file` | Transmite o arquivo de mídia (EPUB/PDF) com Content-Type adequado |
| `GET` | `/epubs/:filename` | Rota de arquivos estáticos Express para publicações EPUB 3 |
| `GET` | `/pdfs/:filename` | Rota de arquivos estáticos Express para documentos PDF |
| `GET` | `/covers/:filename` | Rota de arquivos estáticos Express para capas |
| `POST` | `/api/books` | Registra um novo livro e atribui título, `filePath` e `coverPath` |
| `DELETE` | `/api/books/:id` | Remove o registro de um livro pelo ID |

### Exemplo de Resposta JSON (`GET /api/books`):

```json
[
  {
    "id": 1,
    "title": "Contos Fluminenses",
    "filePath": "storage/epubs/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.epub",
    "coverPath": "storage/covers/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.png",
    "createdAt": "2026-08-25 08:15:00"
  },
  {
    "id": 3,
    "title": "A Cartomante",
    "filePath": "storage/epubs/a-cartomante.epub",
    "coverPath": "storage/covers/a-cartomante.png",
    "createdAt": "2026-08-25 08:15:00"
  }
]
```
