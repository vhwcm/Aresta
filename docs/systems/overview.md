# Catálogo de Sistemas & Tecnologias

Este documento lista todas as tecnologias, bibliotecas e sistemas em uso ativo no monólito **Aresta**.

---

## 1. Controle de Versão, CI/CD & Automação
- **Git** – Controle de versionamento distribuído com Conventional Commits, commits atômicos e versionamento de tags semânticas (`v1.X.X`).
- **GitHub Actions** – Pipelines de integração contínua para sanitização, linting, checagem de tipos, testes automatizados e release de APKs Android (`.github/workflows/quality-gates.yml`, `.github/workflows/release-apk.yml`).
- **Pre-commit** – Hooks locais de sanitização, formatação e verificação de quality gates antes do commit (`.pre-commit-config.yaml`).

---

## 2. Backend & Persistência Central (`apps/api/`)
- **Node.js (v20+ / v22)** – Ambiente de execução JavaScript/TypeScript assíncrono.
- **Express.js (v4.21)** – Framework web modular para construção de APIs RESTful.
- **TypeScript (v5.7)** – Tipagem estática e segurança em tempo de compilação.
- **Prisma ORM (v5.22)** – Mapeamento objeto-relacional, geração de tipos e migrações versionadas em SQL.
- **PostgreSQL 16 com extensão `pgvector`** – Banco de dados relacional e vetorial para embeddings semânticos.
- **Google Gemini SDK (`@google/generative-ai`)** – Geração de embeddings e síntese contextual de livretos didáticos e flashcards.
- **Zod (v3.24)** – Validação e inferência de schemas em runtime para body, params e query.
- **BCrypt.js** – Algoritmo de hash criptográfico seguro para proteção de senhas de usuários.
- **JSON Web Token (`jsonwebtoken`)** – Emissão e verificação de tokens de autenticação stateless.

---

## 3. Frontend, Desktop & Mobile (`apps/web/`)
- **Nuxt 3 / Vue 3** – Framework fullstack reativo moderno com Composition API e SSR/SPA.
- **Tauri v2** – Runtime nativo multiplataforma (Desktop Windows/Linux e Mobile Android) com sandbox de segurança (ACL capabilities).
- **Tailwind CSS (v3.4)** – Framework utilitário de estilos e design system responsivo.
- **Pinia** – Gerenciamento de estado global reativo.
- **D3.js** – Mecanismo de simulação de física de forças e renderização do Grafo de Conhecimento radial.
- **Three.js** – Mecanismo 3D para animação física de virada de página (Page Curl 3D).
- **Foliate.js** – Motor de parsing e renderização de ebooks EPUB no navegador.
- **PDF.js (`pdfjs-dist` v4.10)** – Motor de renderização e extração de texto de documentos PDF 100% offline.
- **Dexie.js / IndexedDB & SQLite Nativo** – Camada de persistência Local-First com fallback automático e resiliente.
- **Lucide Vue Next** – Pacote de ícones SVG consistentes e leves.

---

## 4. Testes & Qualidade
- **Vitest** – Test runner ultrarrápido para testes unitários no frontend (`apps/web`) e backend (`apps/api`).
- **Axios / Supertest** – Asserções e testes de integração HTTP contra o servidor Express.
- **ESLint** – Linter estático com regras de qualidade, identação e tamanho de funções e arquivos.
