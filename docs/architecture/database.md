# Arquitetura de Banco de Dados (`prisma/schema.prisma`)

O Aresta utiliza **SQLite** com **Prisma ORM** como motor de persistência relacional local.

---

## 1. Diagrama Relacional de Entidades (ERD ASCII)

```
    ┌────────────────┐                ┌────────────────┐          ┌────────────────┐
    │     users      │ 1            N │   user_books   │ N      1 │     books      │
    │────────────────├────────────────┤────────────────├──────────┤────────────────│
    │ id (PK)        │                │ id (PK)        │          │ id (PK)        │
    │ email (UNIQUE) │                │ user_id (FK)   │          │ title          │
    │ current_streak │                │ book_id (FK)   │          │ file_path      │
    └───────┬────────┘                │ current_page   │          │ cover_path     │
            │                         └────────────────┘          └───────┬────────┘
            │ 1                                                           │ 1
            │                                                             │
            │ N                                                           │ 1
            ▼                                                             ▼
    ┌────────────────┐                                            ┌────────────────┐
    │ daily_activity │                                            │book_public_info│
    │────────────────│                                            │────────────────│
    │ id (PK)        │                                            │ id (PK)        │
    │ user_id (FK)   │                                            │ book_id (FK)   │
    │ date (YYYY-MM) │                                            │ author         │
    └────────────────┘                                            │ summary        │
                                                                  └───────┬────────┘
            ┌────────────────┐                                            │ 1
            │  annotations   │ N                                        N │
            │────────────────├────────────────────────────────────────────┘
            │ id (PK)        │
            │ user_id (FK)   │ 1
            │ book_id (FK)   │───┐
            │ cfi (Nullable) │   │
            │ selected_text  │   │
            └───────┬────────┘   │
                    │ 1          │
                    │            │
                    ▼ N          │
            ┌────────────────┐   │                                ┌────────────────┐
            │annotation_theme│   │ 1                            N │  book_themes   │
            │────────────────│   └────────────────────────────────┤────────────────│
            │ annotation_id  │                                    │ id (PK)        │
            │ theme_id       │                                    │ book_id (FK)   │
            └───────┬────────┘                                    │ theme_id (FK)  │
                    │ N                                           └───────┬────────┘
                    │                                                     │ N
                    ▼ 1                                                   │
            ┌────────────────┐                                            │
            │     themes     │◄───────────────────────────────────────────┘
            │ (Catálogo      │
            │   Global)      │
            │────────────────│
            │ id (PK)        │
            │ name (UNIQUE)  │
            │ color          │
            │ description    │
            │ embedding      │
            └───────┬────────┘
                    │ 1 (Parent)
                    │
                    ▼ N (Child)
            ┌──────────────────┐
            │theme_hierarchies │
            │──────────────────│
            │ id (PK)          │
            │ parent_theme_id  │
            │ child_theme_id   │
            └──────────────────┘
```

---

## 2. Principais Entidades e Responsabilidades

| Modelo Prisma | Tabela SQLite | Descrição |
| :--- | :--- | :--- |
| `User` | `users` | Usuários, credenciais com bcrypt, ofensivas/streaks e controle de congelamentos. |
| `Book` | `books` | Catálogo global de livros digitais (título, caminho físico do arquivo e capa). |
| `BookPublicInfo`| `book_public_infos` | Informações públicas e resumos do livro enriquecidos por IA (autor, resumo oficial). |
| `UserBook` | `user_books` | Relação N:N entre Usuário e Livro com status (`QUERO_LER`, `LENDO`, `LIDO`) e progresso de leitura. |
| `Theme` | `themes` | **Catálogo Global Único e Dinâmico de Temas** (com embeddings semânticos para pesquisa de similaridade via IA). |
| `ThemeHierarchy`| `theme_hierarchies` | Relação hierárquica e direcionada de subtemas (ex: "Programação" ➔ "Ferramentas"). |
| `BookTheme` | `book_themes` | Vínculos globais entre livros e temas associados pelo microserviço de IA ou administradores. |
| `Annotation` | `annotations` | Citações extraídas do leitor (com CFI) ou **anotações soltas** (CFI nulo) vinculadas ao livro. |
| `AnnotationTheme`| `annotation_themes`| Vínculo entre anotações e temas (restritos aos temas pertencentes ao livro correspondente). |
| `UserSettings` | `user_settings` | Preferências de leitura (animação de virar página, idioma). |
| `DailyActivity` | `daily_activities` | Registro diário de leitura (segundos lidos, flashcards revisados, status de conclusão). |

---

## 3. Comandos Úteis do Prisma

```bash
cd aresta-back-node

# Gerar o Prisma Client após alterações no schema
npm run prisma:generate

# Aplicar alterações no banco de desenvolvimento
npm run prisma:push

# Popular o banco de dados com dados de seed
npm run prisma:seed

# Abrir o visualizador gráfico de banco de dados
npm run prisma:studio
```
