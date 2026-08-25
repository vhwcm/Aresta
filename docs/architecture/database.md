# Arquitetura de Banco de Dados (`prisma/schema.prisma`)

O Aresta utiliza **SQLite** com **Prisma ORM** como motor de persistência relacional local.

---

## 1. Diagrama Relacional de Entidades (ERD ASCII)

```
    ┌────────────────┐                ┌────────────────┐
    │     users      │ 1            N │   user_books   │
    │────────────────├────────────────┤────────────────│
    │ id (PK)        │                │ id (PK)        │
    │ email (UNIQUE) │                │ user_id (FK)   │
    │ current_streak │                │ book_id (FK)   │
    └───────┬────────┘                │ current_page   │
            │                         └───────┬────────┘
            │ 1                               │ N
            │                                 │
            │ N                               ▼ 1
            ▼                         ┌────────────────┐
    ┌────────────────┐                │  book_themes   │
    │ daily_activity │                │────────────────│
    │────────────────│                │ id (PK)        │
    │ id (PK)        │                │ user_book_id   │
    │ user_id (FK)   │                │ theme_id (FK)  │
    │ date (YYYY-MM) │                └───────┬────────┘
    └────────────────┘                        │ N
                                              │
            ┌────────────────┐                ▼ 1
            │  annotations   │ N            1 ┌────────────────┐
            │────────────────├────────────────┤     themes     │
            │ id (PK)        │                │────────────────│
            │ user_id (FK)   │                │ id (PK)        │
            │ book_id (FK)   │                │ user_id (FK)   │
            │ cfi            │                │ name           │
            │ selected_text  │                │ color          │
            └───────┬────────┘                └───────┬────────┘
                    │ 1                               │
                    │                                 │ N
                    ▼ N                               ▼
            ┌────────────────┐                ┌──────────────────┐
            │annotation_theme│                │theme_connections │
            │────────────────│                │──────────────────│
            │ annotation_id  │                │ source_theme_id  │
            │ theme_id       │                │ target_theme_id  │
            └────────────────┘                └──────────────────┘
```

---

## 2. Principais Entidades e Responsabilidades

| Modelo Prisma | Tabela SQLite | Descrição |
| :--- | :--- | :--- |
| `User` | `users` | Usuários, credenciais com bcrypt, ofensivas/streaks e controle de congelamentos. |
| `Book` | `books` | Catálogo global de livros digitais (título, caminho físico do arquivo e capa). |
| `UserBook` | `user_books` | Relação N:N entre Usuário e Livro com status (`QUERO_LER`, `LENDO`, `LIDO`) e progresso de leitura. |
| `Theme` | `themes` | Conceitos ou tópicos cadastrados pelo usuário para categorização e mapa mental. |
| `ThemeConnection`| `theme_connections` | Arestas direcionadas entre temas para formar o grafo mental. |
| `BookTheme` | `book_themes` | Vínculos entre livros na estante e temas do usuário. |
| `Annotation` | `annotations` | Citações extraídas de livros com CFI/posição e anotações pessoais. |
| `AnnotationTheme`| `annotation_themes`| Vínculo entre notas específicas e temas do grafo. |
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
