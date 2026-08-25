# Design Técnico: [Nome da Feature]

## 1. Visão Geral da Arquitetura
[Explicação de como a funcionalidade se integra ao ecossistema existente]

## 2. Diagrama Visual de Fluxo
Consulte o diagrama em: `diagrams/flow.txt`

## 3. Contratos de Dados e Schemas

### 3.1. Schemas Zod (`src/schemas/`)
```typescript
// Exemplo de schema de validação
export const createExampleSchema = z.object({
  // campos...
});
```

### 3.2. Modelo de Banco de Dados (`prisma/schema.prisma`)
```prisma
// Alterações ou novos modelos Prisma
```

## 4. Endpoints de API (OpenAPI / Swagger)
- `POST /api/exemplo`: [Descrição, request body e responses 200, 400, 401, 500]
- `GET /api/exemplo/:id`: [Descrição, params e responses]

## 5. Componentes Frontend & Estado
- **Composables / Pinia Stores**: [Nome e responsabilidades]
- **Componentes Vue**: [Estrutura de componentes, props e emits]

## 6. Tratamento de Erros & Fallbacks
- [Estratégia para falhas de rede, dados inválidos ou timeout]

## 7. Estratégia de Testes
- **Backend**: Testes de integração com Vitest e Supertest
- **Frontend**: Testes unitários de composables/componentes com Vitest
