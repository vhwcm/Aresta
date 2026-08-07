# Resumo das Alterações — Banco de Dados, Migrations e Usuários

## 1. Instalação e Configuração do SQLite 3
- Binário e CLI do `sqlite3` (versão 3.45.3) instalados e adicionados ao `PATH` do sistema.
- Suporte a dois ambientes de banco de dados (`aresta_dev.db` e `aresta_prod.db`) alternados via flag `app.debug`.
- Pool de conexões JDBC gerenciado via **HikariCP**.

## 2. Migrações Automatizadas com Flyway
- Adicionadas as migrações SQL em `src/main/resources/db/migration/`:
  - `V1__initial_schema.sql`
  - `V2__add_app_config.sql`
  - `V3__enhance_users_table.sql`
- Tabela `flyway_schema_history` criada e validada automaticamente em cada inicialização.

## 3. Arquitetura em Camadas e API RESTful (Javalin)
- Implementado o **Repository Pattern** (`UserRepository`, `AppConfigRepository`, `JdbcUserRepository`, `JdbcAppConfigRepository`).
- Servidor REST **Javalin** configurado na porta `7070` com suporte a CORS.
- Hashing seguro de senhas com a biblioteca **jBCrypt**.
- Logging estruturado via **SLF4J / Logback** (`logback.xml`).

## 4. Interface Front-End em Nuxt 3
- Criada a rota e página `/users` em `app/pages/users.vue` para administração de usuários.
- Atalho integrado na barra de navegação lateral (`app/layouts/default.vue`).
- Filtros em tempo real (busca, perfil, status) e modal para cadastro/edição.

## 5. Suíte de Testes (TDD)
- Testes unitários do repositório Java e testes de integração REST API (`UserControllerTest.java`).
- Teste unitário do componente Vue (`users.test.ts`).
- 100% de aprovação na suíte de testes do backend e frontend (109 testes em Vitest).
