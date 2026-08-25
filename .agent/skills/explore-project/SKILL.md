---
name: explore-project
description: >-
  Instrui o agente a entender a arquitetura, regras de domínio, ADRs, diagramas ASCII e
  código relevante antes de planejar ou realizar qualquer alteração no projeto Aresta.
---

# Skill: Explore Project (Exploração Estruturada)

Esta skill orienta o processo de exploração metódica do monorepositório Aresta antes da escrita de código ou especificação.

## Quando Usar

- Ao receber uma solicitação de funcionalidade média ou grande.
- Ao iniciar uma nova sessão de trabalho ou investigar um módulo desconhecido.
- Para evitar suposições prematuras e garantir alinhamento com a arquitetura estabelecida.

## Passo a Passo de Execução

1. **Consultar as Regras Operacionais**:
   - Inspecione [AGENTS.md](../../../AGENTS.md) e as regras em `.agent/rules/`.

2. **Identificar a Arquitetura e Diagramas**:
   - Inspecione a documentação correspondente em `docs/architecture/` (ex: `overview.md`, `backend.md`, `frontend.md`, `database.md`).
   - Visualize os diagramas de fluxo em `docs/architecture/diagrams/*.txt`.

3. **Consultar o Domínio e Regras de Negócio**:
   - Consulte o arquivo correspondente ao domínio em `docs/domain/` (ex: `books.md`, `reading.md`, `graph.md`, `annotations.md`, `streak.md`, `users.md`, `flashcards.md`).

4. **Revisar Decisões Registradas (ADRs)**:
   - Verifique `docs/decisions/` para compreender os motivos de escolhas arquiteturais passadas e restrições impostas.

5. **Localizar o Código Relacionado**:
   - Backend: `aresta-back-node/src/` (`controllers/`, `services/`, `schemas/`, `routes/`, `prisma/schema.prisma`).
   - Frontend: `front/app/` (`pages/`, `components/`, `composables/`, `adapters/`, `stores/`).
   - Utilitários/Python: `pdf2epub/`.

6. **Mapear Impactos e Dependências**:
   - Identifique quais schemas Zod, entidades do Prisma, componentes Vue ou endpoints de API serão afetados.
   - Resuma o contexto encontrado antes de propor a especificação ou implementação.
