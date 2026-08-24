# 📐 Aresta — Monorepositório (Leitor de Ebooks, Biblioteca & Mapa Mental)

O **Aresta** é uma aplicação web completa para leitura interativa de ebooks (EPUB e PDF), gerenciamento de biblioteca pessoal e visualização de conexões conceituais através de um **Grafo de Conhecimento / Mapa Mental**.

---

## 🏛️ Arquitetura do Projeto

O repositório é um **monorepositório** unificado contendo o Frontend, Backend, Documentação e Automações de CI/CD.

```
Aresta/
├── front/                    # Frontend em Nuxt 4 (Vue 3 + TypeScript)
│   ├── app/
│   │   ├── adapters/         # Padrão Adapter (PDF.js e Foliate-js)
│   │   ├── components/       # Componentes Vue (Leitor, Grafo, Modais)
│   │   ├── composables/      # Lógica reativa (useGraph, useUserBooks, useCatalog)
│   │   ├── interfaces/       # Definições de tipos TypeScript
│   │   └── pages/            # Rotas do Nuxt (Biblioteca, Leitor, Grafo)
│   ├── tests/                # Testes Unitários (Vitest) e E2E (Playwright)
│   └── package.json
│
├── aresta-back-node/         # Backend em Node.js + Express + TypeScript (MVC + Swagger)
│   ├── src/
│   │   ├── controllers/      # Controladores HTTP com anotações OpenAPI/Swagger
│   │   ├── services/         # Regras de negócio e persistência
│   │   ├── routes/           # Rotas da API e Swagger UI (/api-docs)
│   │   ├── middlewares/      # Autenticação JWT, Zod validation, error handler
│   │   ├── schemas/          # Schemas de validação Zod
│   │   └── config/           # Prisma client, envs e OpenAPI spec
│   ├── prisma/               # Schema Prisma, migrations e seeds
│   ├── tests/                # Testes de integração (Vitest + Supertest)
│   └── package.json
│
├── aresta-back/              # Backend de referência em Java 21 (Legado)
├── docs/                     # Documentação de arquitetura e APIs (Mintlify)
├── scripts/                  # Scripts de suporte e git hooks
├── .github/workflows/        # CI/CD Quality Gates (GitHub Actions)
├── start.sh                  # Script de inicialização concorrente (Front + Back)
└── package.json              # Entrypoint de scripts do monorepositório
```

---

### 🎨 Frontend (`front/`)
- **Tecnologias**: [Nuxt 4](https://nuxt.com/) / Vue 3, TypeScript, Tailwind CSS, Pinia, D3.js.
- **Leitor de Ebooks**: Padrão *Adapter* (`BookDocumentFactory`) abstraindo o suporte a formatos:
  - **EPUB**: Renderização via [`foliate-js`](https://github.com/johnfactotum/foliate-js).
  - **PDF**: Renderização via [`pdfjs-dist`](https://mozilla.github.io/pdf.js/).
- **Grafo & Mapa Mental**: Renderização interativa baseada em SVG/Canvas com física de nós para conectar livros e temas conceituais.

---

### ⚡ Backend Express.js (`aresta-back-node/`)
- **Tecnologias**: Node.js, Express.js, TypeScript, [Prisma ORM](https://www.prisma.io/), SQLite, Swagger (OpenAPI 3.0), JWT, BCrypt, Zod.
- **Porta padrão**: `7070` (`http://localhost:7070/api`).
- **Documentação Swagger UI**: `http://localhost:7070/api-docs`.
- **Domínio das APIs**:
  - `/api/auth`: Autenticação e perfil de usuário (`POST /login`, `GET /me`).
  - `/api/books`: Catálogo global, download de PDF e capas.
  - `/api/user-books`: Estante pessoal do usuário e progresso.
  - `/api/graph`: Nós de temas, conexões e vínculos conceituais.
  - `/api/users`: Gestão de usuários e permissões (ADMIN).
  - `/api/user-settings`: Configurações de leitura e idioma.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- **Node.js**: v18 ou superior (`npm` v9+)
- **Java JDK**: 21 ou superior
- **Git**

---

### 🟢 1. Inicialização Rápida (Monorepositório)

Você pode iniciar o **Frontend e o Backend simultaneamente** executando um único comando na raiz do projeto:

```bash
# 1. Instalar as dependências do Frontend
cd front && npm install && cd ..

# 2. Iniciar ambos os serviços (Backend na 7070 e Frontend na 3000)
npm start
```
*Ou execute diretamente:*
```bash
./start.sh
```

Acesse no seu navegador:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:7070/api/health](http://localhost:7070/api/health)

---

### 🛠️ 2. Execução Individual dos Módulos

#### Executando apenas o Frontend:
```bash
cd front
npm install
npm run dev
```

#### Executando apenas o Backend:
```bash
cd aresta-back
./gradlew run
```

---

## 🧪 Suíte de Testes e Qualidade

O projeto utiliza **Quality Gates** automatizados via GitHub Actions e pré-commit hooks.

### Frontend (`front/`)
```bash
cd front

# Executar testes unitários (Vitest)
npm run test

# Executar linter (ESLint)
npm run lint

# Checagem de tipos TypeScript
npm run typecheck
```

### Backend Express.js (`aresta-back-node/`)
```bash
cd aresta-back-node

# Executar testes unitários e de integração (Vitest + Supertest)
npm test

# Executar testes em modo watch
npm run test:watch
```

### Backend Java Legado (`aresta-back/`)
```bash
cd aresta-back

# Executar testes unitários e de integração (JUnit 5)
./gradlew test

# Executar validação de estilo de código (Checkstyle)
./gradlew checkstyle
```

### Configurar Git Hooks (Opcional):
Para validar linters e testes automaticamente antes de cada commit:
```bash
npm run setup:hooks
```

---

## 📄 Licença e Contribuição
Desenvolvido como parte do projeto **Aresta**. Consulte a pasta [`docs/`](docs/) para mais detalhes de design system e decisões de arquitetura.
