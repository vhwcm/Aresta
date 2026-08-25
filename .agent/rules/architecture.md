# Regra: Padrões e Diretrizes Arquiteturais

## Padrões Arquiteturais no Monorepositório

### 1. Backend Express (`aresta-back-node/`)
- **Arquitetura em Camadas (MVC)**:
  - **Routes (`src/routes/`)**: Declaração de endpoints HTTP e Swagger JSDoc.
  - **Middlewares (`src/middlewares/`)**: Autenticação (`auth.middleware.ts`), validação Zod (`validate.middleware.ts`), tratamento de erros (`error.middleware.ts`).
  - **Controllers (`src/controllers/`)**: Recepção de requisições, extração de parâmetros validados, orquestração e resposta HTTP.
  - **Services (`src/services/`)**: Regras de negócio, cálculos, transações e chamadas ao Prisma Client.
  - **Schemas (`src/schemas/`)**: Definições e inferência de tipos TypeScript com validação Zod para body, query e params.
  - **Config (`src/config/`)**: Instância única do Prisma Client (`prisma.ts`), validação de variáveis de ambiente (`env.ts`) e Swagger spec.

### 2. Frontend Nuxt 4 (`front/`)
- **Padrão Adapter para Leitor de Ebooks**:
  - `BookDocumentFactory` e `BookDocumentAdapter` para isolar bibliotecas externas (`foliate-js` e `pdfjs-dist`) do restante da UI.
- **Gerenciamento de Estado**:
  - Pinia Stores e Composables reativos (`useGraph`, `useUserBooks`, `useAnnotations`, `useStreak`).
- **Visualização de Dados**:
  - Módulos D3.js desacoplados da lógica de apresentação pura dos componentes.

### 3. Restrições e Limites
- Controllers não devem executar queries Prisma diretamente; delegue para a camada de Service.
- Schemas Zod devem validar todas as entradas HTTP externas antes de atingir as regras de negócio.
- Senhas devem ser tratadas exclusivamente com hash seguro (BCrypt).
