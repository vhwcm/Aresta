# 📐 Aresta — Monorepositório (Leitor de Ebooks, Biblioteca & Mapa Mental)

O **Aresta** é uma aplicação web moderna para leitura interativa de ebooks (EPUB e PDF), gerenciamento de biblioteca pessoal, retenção de conhecimento com flashcards e visualização de conexões conceituais através de um **Grafo de Conhecimento / Mapa Mental**.

---

<p align="center">
  <img src="./aresta-back-node/storage/capturas_de_tela/Captura_de_tela_Home_Aresta.png" alt="Aresta — Dashboard Home, Flashcards e Anotações" width="900" style="border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
</p>

---

## ✨ Principais Funcionalidades

- 📖 **Leitor de Ebooks Multi-formato**: Suporte fluido a arquivos **EPUB** (via `foliate-js`) e **PDF** (via `pdfjs-dist`) com alternância de temas, controle de progresso e persistência.
- 🧠 **Grafo de Conhecimento & Mapa Mental**: Visualização interativa e física de nós (D3.js) conectando obras, conceitos, autores e ideias transversais.
- 🎯 **Dashboard Home & Streaks**: Acompanhamento de metas de leitura contínua, histórico recente e atalhos de continuidade imediata.
- 🗂️ **Central de Revisão & Flashcards**: Sistema de repetição espaçada e metodologia baseada na **Curva do Esquecimento** para fixação de conceitos-chave.
- 📝 **Anotações & Citações**: Extração e catalogação de trechos, pensamentos e marcações organizadas por livro, capítulo e página.
- 🔄 **Conversor de Documentos & Ferramentas**: Utilitários para conversão e processamento de livros digitais.
- 📚 **Biblioteca Pessoal & Catálogo**: Gestão de livros do usuário, upload de arquivos, capas e catálogo compartilhado.

---

## 🏛️ Arquitetura do Projeto

O repositório é um **monorepositório** unificado contendo o Frontend, Backend, Documentação e Automações de CI/CD.

```
Aresta/
├── front/                    # Frontend em Nuxt 4 (Vue 3 + TypeScript)
│   ├── app/
│   │   ├── adapters/         # Padrão Adapter (PDF.js e Foliate-js)
│   │   ├── components/       # Componentes Vue (Leitor, Grafo, Modais, Dock)
│   │   ├── composables/      # Lógica reativa (useGraph, useUserBooks, useCatalog, etc.)
│   │   ├── interfaces/       # Definições de tipos TypeScript
│   │   └── pages/            # Rotas do Nuxt (Home, Leitor, Grafo, Revisão, Biblioteca)
│   ├── tests/                # Testes Unitários (Vitest) e E2E (Playwright)
│   └── package.json
│
├── aresta-back-node/         # Backend em Node.js + Express + TypeScript (MVC + Swagger + Prisma)
│   ├── src/
│   │   ├── controllers/      # Controladores HTTP com anotações OpenAPI/Swagger
│   │   ├── services/         # Regras de negócio e persistência
│   │   ├── routes/           # Rotas da API e Swagger UI (/api-docs)
│   │   ├── middlewares/      # Autenticação JWT, Zod validation, error handler
│   │   ├── schemas/          # Schemas de validação Zod
│   │   └── config/           # Prisma client, envs e OpenAPI spec
│   ├── prisma/               # Schema Prisma, migrations e seeds (SQLite)
│   ├── storage/              # Armazenamento de livros, capas e capturas
│   ├── tests/                # Testes de integração (Vitest + Supertest)
│   └── package.json
│
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
  - `/api/books`: Catálogo global, download de PDF/EPUB e capas.
  - `/api/user-books`: Estante pessoal do usuário e progresso de leitura.
  - `/api/annotations`: Anotações, notas e citações em livros.
  - `/api/graph`: Nós de temas, conexões e vínculos conceituais.
  - `/api/users`: Gestão de usuários e permissões (ADMIN).
  - `/api/user-settings`: Configurações de leitura e idioma.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- **Node.js**: v18 ou superior (`npm` v9+)
- **Git**

---

### 🟢 1. Inicialização Rápida (Monorepositório)

Você pode iniciar o **Frontend e o Backend simultaneamente** executando um único comando na raiz do projeto:

```bash
# 1. Instalar as dependências
npm install
cd front && npm install && cd ../aresta-back-node && npm install && cd ..

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
- **Swagger UI**: [http://localhost:7070/api-docs](http://localhost:7070/api-docs)

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
cd aresta-back-node
npm install
npm run dev
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

# Checagem de tipos e compilação
npm run build
```

### Configurar Git Hooks (Opcional):
Para validar linters e testes automaticamente antes de cada commit:
```bash
npm run setup:hooks
```

---

## 📄 Licença e Contribuição
Desenvolvido como parte do projeto **Aresta**. Consulte a pasta [`docs/`](docs/) para mais detalhes de design system e decisões de arquitetura.
