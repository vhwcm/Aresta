# Regra: Migrations e Gerenciamento do Banco de Dados (Prisma ORM)

## 1. Regra Inegociável de Schema e Migrations

Toda e qualquer alteração em `apps/api/prisma/schema.prisma` (criação de models, adição/remoção de campos, criação de índices, relacionamentos, enums ou extensões) **EXIGE OBRIGATORIAMENTE** a criação e versionamento do respectivo arquivo de migration SQL em `apps/api/prisma/migrations/`.

> ⚠️ **CRÍTICO:** Nunca altere `schema.prisma` sem gerar a migration correspondente. O container de produção executa `npx prisma migrate deploy`, que **apenas executa arquivos SQL existentes** na pasta `prisma/migrations/`. Se a migration não estiver versionada, as tabelas não existirão em produção.

---

## 2. Fluxo Obrigatório de Alteração no Banco de Dados

Sempre que uma tarefa envolver alteração de dados ou persistência:

### Passo 1: Atualizar o Schema
Editar `apps/api/prisma/schema.prisma` seguindo os padrões do projeto:
- Tabelas mapeadas para `snake_case` no plural via `@@map("nome_da_tabela")`.
- Colunas em `snake_case` com tipos explícitos (`@db.Text`, `@default(...)`, etc.).
- Relacionamentos com constraints de integridade referencial (`onDelete: Cascade` ou `SetNull`).
- Índices (`@@index`, `@@unique`) em chaves estrangeiras e campos de busca frequente.

### Passo 2: Gerar a Migration e o Prisma Client
No diretório `apps/api/`:
```bash
# Gerar a migration com nome semântico
npx prisma migrate dev --name <descricao_da_alteracao>

# Ou, se o banco Docker estiver rodando:
npm run prisma:migrate
npm run prisma:generate
```
A migration gerada (`apps/api/prisma/migrations/<timestamp>_<nome>/migration.sql`) deve ser commitada no Git.

### Passo 3: Atualizar e Validar o Seed
Se novos campos obrigatórios foram adicionados, atualizar `apps/api/prisma/seed.ts` e validar a execução do seed:
```bash
npx prisma db seed
```

### Passo 4: Executar Quality Gates
Executar os testes para garantir que nenhuma query ou tipagem quebrou:
```bash
npm run test:api
```

---

## 3. Diretrizes de Deploy e Produção

- **Execução Automática**: O container da API (`apps/api/Dockerfile`) executa `npx prisma migrate deploy` antes de subir o servidor Express (`node dist/server.js`).
- **Idempotência**: As migrations devem ser seguras para rodar em produção sem perda de dados não intencional.
- **Ambiente Docker**: A conexão com o banco dentro do Docker deve sempre utilizar o host do container `aresta-db` (ex: `postgresql://aresta:senha@aresta-db:5432/aresta_db`) e nunca `localhost`.
