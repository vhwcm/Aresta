# Regra: Estrutura do Projeto e Monorepositório

## Visão Geral do Monorepositório

O projeto **Aresta** é estruturado como um monorepositório contendo os seguintes módulos e responsabilidades:

```
Aresta/
├── front/                    # Frontend em Nuxt 4 (Vue 3, TypeScript, Tailwind, Pinia, D3.js)
├── aresta-back-node/         # Backend em Node.js (Express, TypeScript, Prisma ORM, SQLite)
├── pdf2epub/                 # Serviço de conversão de documentos PDF para EPUB (Python)
├── docs/                     # Base de conhecimento, arquitetura, domínio, ADRs e guias
├── specs/                    # Especificações técnicas ativas e concluídas
├── scripts/                  # Scripts utilitários e hooks de CI/CD
└── .agent/                   # Regras e Skills do agente de desenvolvimento
```

## Convenções de Módulos

1. **Frontend (`front/`)**:
   - Todo código de UI, componentes Vue, composables e páginas reside aqui.
   - Padrão Adapter em `front/app/adapters/` para renderização de livros (`foliate-js` para EPUB e `pdfjs-dist` para PDF).
   - Gerenciamento de estado com Pinia e lógica de visualização de grafos com D3.js.

2. **Backend (`aresta-back-node/`)**:
   - Padrão arquitetural MVC em camadas (`controllers/`, `services/`, `middlewares/`, `schemas/`, `routes/`, `config/`).
   - Validação estrita de runtime utilizando schemas Zod.
   - Documentação de rotas e schemas via Swagger (OpenAPI 3.0).
   - Acesso e migração a banco de dados gerenciados pelo Prisma ORM (`prisma/schema.prisma`).

3. **Conversor de Documentos (`pdf2epub/`)**:
   - Módulo em Python para extração de texto, formatação e geração de arquivos EPUB a partir de PDFs.

4. **Documentação (`docs/`)**:
   - Única fonte da verdade do projeto. Centralizada na raiz.
