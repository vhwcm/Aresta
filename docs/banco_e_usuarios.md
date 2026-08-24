# Banco de Dados & Gestão de Usuários

Documentação da arquitetura de persistência, migrações automatizadas, servidor REST API e módulo de gestão de usuários.

## 1. Arquitetura de Banco de Dados (SQLite 3)

O projeto utiliza **SQLite 3** com suporte a dois ambientes isolados, configurados dinamicamente via flag de *debug* (`app.debug` ou variável `APP_DEBUG`):

- **Desenvolvimento / Testes (`debug = true`)**: Banco de dados `aresta_dev.db`.
- **Produção (`debug = false`)**: Banco de dados `aresta_prod.db`.

O gerenciamento de conexões é realizado pelo **HikariCP** (`DatabaseManager.java`), garantindo um pool de conexões otimizado e fechamento gracioso de recursos.

## 2. Versionamento do Esquema (Flyway Migrations)

Todas as alterações de banco de dados são versionadas e aplicadas automaticamente na inicialização da aplicação através do **Flyway**:

- `V1__initial_schema.sql`: Estrutura inicial da tabela `users`.
- `V2__add_app_config.sql`: Criação da tabela de configurações do sistema (`app_config`).
- `V3__enhance_users_table.sql`: Expansão da tabela de usuários com suporte a `password_hash` (BCrypt), `role` (`ADMIN` / `USER`), `is_active` e timestamps.

## 3. Endpoints da API RESTful (Javalin)

O servidor back-end executa em `http://localhost:7070` utilizando o micro-framework **Javalin** com suporte a CORS:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verificação de status e versão do esquema do banco |
| `GET` | `/api/users` | Retorna a lista de todos os usuários (sem hashes de senha) |
| `GET` | `/api/users/{id}` | Busca um usuário específico por ID |
| `POST` | `/api/users` | Cadastra um novo usuário com senha criptografada via BCrypt |
| `PUT` | `/api/users/{id}` | Atualiza dados, papel ou status de um usuário |
| `DELETE` | `/api/users/{id}` | Remove um usuário pelo ID |

## 4. Módulo Front-End de Usuários (Nuxt 3)

A interface de gerenciamento de usuários foi desenvolvida em Vue/Nuxt 3 no caminho `/users` (`app/pages/users.vue`):

- **Barra de Navegação**: Atalho com ícone `UsersIcon` na *nav rail* lateral.
- **Filtros Dinâmicos**: Busca reativa por nome/email, filtro por perfil (`ADMIN`/`USER`) e filtro por status (`Ativo`/`Inativo`).
- **Modal Interativo**: Modal para criação e edição de usuários com comunicação direta à API REST backend (`http://localhost:7070/api/users`).
- **Design System**: Estilização alinhada ao padrão Aresta (Dark Mode, Glassmorphic panels, Lucide Icons e fontes Newsreader e Inter).
