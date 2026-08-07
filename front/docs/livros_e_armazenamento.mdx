# Gestão de Livros & Armazenamento de Capas

Documentação do módulo de armazenamento de livros, extração e gestão de capas, migrações de banco de dados e endpoints REST no servidor Aresta.

---

## 1. Visão Geral da Arquitetura

O sistema gerencia livros digitais (formatos como PDF e EPUB) e suas respectivas capas dividindo o armazenamento e a entrega em camadas de segurança e desempenho:

1. **Biblioteca de Livros (`storage/books/`)**: Diretório reservado e não público no servidor para os arquivos completos dos livros (PDFs).
2. **Repositório de Capas (`storage/covers/`)**: Diretório exposto estaticamente pelo servidor para carregamento rápido de thumbnails/capas em PNG no front-end.
3. **Banco de Dados (SQLite 3 + Flyway)**: Tabela `books` para relacionar `id`, `title`, `file_path` (caminho do arquivo do livro) e `cover_path` (caminho do arquivo da capa).

---

## 2. Estrutura de Pastas no Servidor

No diretório `aresta-back/`:

```text
aresta-back/
├── storage/
│   ├── books/              # Arquivos PDF dos livros (Privado/Protegido)
│   │   ├── a-cartomante.pdf
│   │   ├── Como-tocar-piano.pdf
│   │   └── ...
│   └── covers/             # Capas em formato PNG (Acesso Rápido)
│       ├── a-cartomante.png
│       ├── Como-tocar-piano.png
│       └── ...
```

---

## 3. Estrutura no Banco de Dados (SQLite)

### Tabela `books`

Tabela criada via Flyway migration [`V4__create_books_table.sql`](file:///home/morpho/Aresta/aresta-back/src/main/resources/db/migration/V4__create_books_table.sql) e expandida na migration [`V6__add_cover_path_to_books.sql`](file:///home/morpho/Aresta/aresta-back/src/main/resources/db/migration/V6__add_cover_path_to_books.sql):

```sql
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    cover_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Campos:
- **`id`**: Identificador único numérico (Chave Primária autoincrementada).
- **`title`**: Título amigável do livro.
- **`file_path`**: Endereço relativo/absoluto do arquivo do livro no servidor (`storage/books/...`).
- **`cover_path`**: Endereço do arquivo de imagem da capa no servidor (`storage/covers/...`).
- **`created_at`**: Data e hora do registro no banco de dados.

---

## 4. Endpoints da API RESTful (Javalin)

O servidor Javalin expõe os seguintes endpoints HTTP para manipulação de livros e consumo de capas:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/books` | Retorna a lista em JSON de todos os livros cadastrados |
| `GET` | `/api/books/{id}` | Retorna o JSON com os detalhes de um livro específico por ID |
| `GET` | `/api/books/{id}/cover` | Transmite o arquivo de imagem PNG da capa do livro |
| `GET` | `/covers/{filename}.png` | Servidor estático Javalin para acesso direto e em cache às capas |
| `POST` | `/api/books` | Registra um novo livro e atribui título, `filePath` e `coverPath` |
| `DELETE` | `/api/books/{id}` | Remove o registro de um livro pelo ID |

### Exemplo de Resposta JSON (`GET /api/books`):

```json
[
  {
    "id": 1,
    "title": "Contos Fluminenses",
    "filePath": "storage/books/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.pdf",
    "coverPath": "storage/covers/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.png",
    "createdAt": "2026-08-07 15:22:31"
  },
  {
    "id": 3,
    "title": "A Cartomante",
    "filePath": "storage/books/a-cartomante.pdf",
    "coverPath": "storage/covers/a-cartomante.png",
    "createdAt": "2026-08-07 15:22:31"
  }
]
```

---

## 5. Gerador e Extração de Capas

As capas podem ser enviadas manualmente ou geradas automaticamente a partir da 1ª página do arquivo PDF com a ferramenta CLI `pdftoppm`:

```bash
pdftoppm -png -f 1 -l 1 -r 150 storage/books/a-cartomante.pdf storage/covers/a-cartomante
```

Isso garante que cada livro armazenado possua uma capa em alta resolução associada e pronta para ser exibida nos cards e vitrines do front-end.
