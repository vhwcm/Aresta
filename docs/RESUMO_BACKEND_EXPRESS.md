# Resumo das Alterações: Backend Express.js + Swagger + MVC

## 🎯 Objetivo
Refatorar o backend da aplicação Aresta para **Node.js** com **Express.js**, **TypeScript**, **Prisma ORM** e **Swagger (OpenAPI 3.0)**, mantendo o padrão arquitetural **MVC em camadas** e 100% de compatibilidade com o frontend Nuxt.

---

## 🛠️ Decisões Arquiteturais (/grill-me)
1. **Linguagem & Tipagem**: TypeScript strict mode com ES Modules (`NodeNext`).
2. **Camada de Banco de Dados**: Prisma ORM sobre SQLite, com mapeamento completo de tabelas e script de Seed automatizado (`prisma/seed.ts`).
3. **Documentação de APIs**: `swagger-jsdoc` e `swagger-ui-express` servindo a interface interativa em `/api-docs` e a especificação JSON em `/api-docs.json`.
4. **Validação de DTOs**: Schemas declarativos com **Zod** e middleware de validação para `body`, `query` e `params`.
5. **Estrutura de Camadas MVC**:
   - `src/controllers/`: Auth, Book, User, UserBook, UserSettings, Graph, Health.
   - `src/services/`: Camada de regras de negócio desacoplada.
   - `src/routes/`: Mapeamento e agrupamento de rotas.
   - `src/middlewares/`: JWT Auth, Role Guard (Admin), Tratamento global de erros e Validador Zod.
   - `src/schemas/`: Schemas Zod tipados.
   - `src/config/`: `env.ts`, `env.example.ts`, `prisma.ts`, `swagger.ts`.
6. **Segurança e Variáveis de Ambiente**:
   - Arquivos `.env` ignorados no `.gitignore`.
   - `.env.example` e `env.example.ts` criados com parâmetros documentados.
7. **Testes Automatizados**: Suíte com **Vitest** e **Supertest** cobrindo autenticação, usuários, livros, grafos e healthcheck (17 testes aprovados).

---

## 🚀 Comandos Rápidos

```bash
cd aresta-back-node

# Instalação
npm install

# Banco e Seed
npx prisma db push
npx prisma db seed

# Iniciar Servidor (Porta 7070)
npm run dev

# Rodar Testes Automatizados
npm test
```
