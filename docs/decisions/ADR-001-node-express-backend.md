# ADR-001: Backend Unificado em Node.js com Express e TypeScript

## Status
Aceito (Accepted)

## Data
2026-08-25

## Contexto
O ecossistema Aresta necessitava de uma API RESTful de alta velocidade, baixa sobrecarga operacional, fácil integração com o ecossistema JavaScript/TypeScript do frontend Nuxt e tipagem estrita de ponta a ponta. Protótipos anteriores em outras linguagens introduziam complexidade excessiva de build e fragmentação de stack.

## Decisão
Decidimos consolidar o backend em **Node.js**, **Express.js** e **TypeScript**, estruturado no padrão MVC em camadas com validação Zod e geração automática de documentação Swagger (OpenAPI 3.0).

## Alternativas Consideradas
1. **Java / Javalin**: Descartado devido ao maior consumo de memória em tempo de execução, complexidade no gerenciamento de builds separados e duplicação de definições de tipos entre linguagens.
2. **NestJS**: Descartado por trazer excesso de abstração e boilerplates desnecessários para a escala atual do Aresta.
3. **Fastify**: Considerado, mas preterido em favor do Express pela maturidade do ecossistema e facilidade de middlewares.

## Consequências
- **Positivas**:
  - Código compartilhado e experiência unificada de TypeScript entre frontend e backend.
  - Inicialização em menos de 500ms e baixo consumo de memória.
  - Documentação OpenAPI / Swagger UI nativa e atualizada.
- **Negativas / Desafios**:
  - Necessidade de manter disciplina arquitetural nas camadas MVC (separação estrita entre controllers e services).
