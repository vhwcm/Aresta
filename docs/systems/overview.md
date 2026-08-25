# Catálogo de Sistemas & Tecnologias

Este documento lista todas as tecnologias, bibliotecas e sistemas em uso ativo no monorepositório **Aresta**.

---

## 1. Controle de Versão, CI/CD & Automação
- **Git** – Controle de versionamento distribuído com Conventional Commits e commits atômicos.
- **GitHub Actions** – Pipelines de integração contínua para linting, checagem de tipos e testes automatizados (`.github/workflows/quality-gates.yml`).
- **Pre-commit** – Hooks locais de sanitização, verificação de formatação e quality gates antes do commit (`.pre-commit-config.yaml`).

---

## 2. Backend & Persistência (`aresta-back-node/`)
- **Node.js (v20+)** – Ambiente de execução JavaScript/TypeScript assíncrono.
- **Express.js (v4.19)** – Framework web para construção de APIs RESTful.
- **TypeScript (v5.4)** – Tipagem estática e segurança em tempo de compilação.
- **Prisma ORM (v5.14)** – Mapeamento objeto-relacional, geração de tipos e migrações.
- **SQLite 3** – Banco de dados relacional embarcado de alta performance em modo WAL.
- **Zod (v3.23)** – Validação e inferência de schemas em runtime para body, params e query.
- **Swagger / OpenAPI 3.0 (`swagger-jsdoc` & `swagger-ui-express`)** – Documentação viva e interativa da API exposta em `/api-docs`.
- **BCrypt.js** – Algoritmo de hash criptográfico seguro para proteção de senhas de usuários.
- **JSON Web Token (`jsonwebtoken`)** – Emissão e verificação de tokens de autenticação stateless.

---

## 3. Frontend & Visualização (`front/`)
- **Nuxt 4 / Vue 3** – Framework fullstack reativo moderno com Composition API e SSR/SPA.
- **Tailwind CSS (v3.4)** – Framework utilitário de estilos e design system responsivo.
- **Pinia (v3.0)** – Gerenciamento de estado global reativo.
- **D3.js (v7.9)** – Mecanismo de simulação de física de forças e renderização de grafos de conhecimento.
- **Foliate-js (v1.0)** – Motor de parsing e renderização de ebooks EPUB no navegador.
- **PDF.js (`pdfjs-dist` v6.1)** – Motor de renderização e extração de texto de documentos PDF.
- **Lucide Vue Next** – Pacote de ícones SVG consistentes e leves.

---

## 4. Testes & Qualidade
- **Vitest** – Test runner ultrarrápido para testes unitários no frontend e backend.
- **Supertest** – Biblioteca de asserção e testes de integração HTTP contra o servidor Express.
- **Playwright** – Framework para testes ponta a ponta (E2E) em navegadores reais.
- **ESLint** – Linter estático com regras de qualidade, identação e tamanho máximo de funções.

---

## 5. Conversor de Documentos (`pdf2epub/`)
- **Python (v3.12)** – Linguagem para processamento de arquivos.
- **PyPDF / EbookLib** – Extração de texto e estruturação de pacotes EPUB.
- **Pytest** – Suíte de testes unitários para os algoritmos de conversão.
