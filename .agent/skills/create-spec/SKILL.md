---
name: create-spec
description: >-
  Cria uma especificação técnica completa (requirements, design, tasks e diagrama ASCII)
  em specs/active/<feature>/ para funcionalidades médias ou grandes antes de qualquer codificação.
---

# Skill: Create Spec (Especificação Orientada a Design)

Esta skill formaliza o processo de criação de especificações técnicas (*Specs*) no modelo mental do Kiro. A regra primordial é: **pensar e especificar antes de codificar**.

## Quando Usar

- Sempre que uma tarefa envolver uma nova feature, alteração no banco de dados (`schema.prisma`), novo fluxo de API, refatoração estrutural ou novo módulo.

## Passo a Passo de Execução

1. **Definir o Nome e Diretório da Spec**:
   - Crie a pasta em `specs/active/<nome-da-feature>/` (ex: `specs/active/flashcards-spaced-repetition/`).

2. **Gerar os Requisitos Funcionais (`requirements.md`)**:
   - Baseie-se no template em `specs/templates/requirements.md`.
   - Defina o **Objetivo Geral**.
   - Liste os **Requisitos Funcionais Numerados** (`R1`, `R2`, `R3`...).
   - Estabeleça os **Critérios de Aceite Testáveis** com checkboxes `[ ]`.

3. **Desenhar a Arquitetura e Contratos (`design.md`)**:
   - Baseie-se no template em `specs/templates/design.md`.
   - Especifique componentes de Frontend e Backend afetados.
   - Detalhe schemas Zod, alterações no Prisma e contratos de API (Swagger/OpenAPI).
   - Defina a estratégia de tratamento de erros e fallbacks.
   - Referencie o diagrama visual de fluxo.

4. **Elaborar o Diagrama Visual em ASCII (`diagrams/<fluxo>.txt`)**:
   - Crie um diagrama visual em ASCII/Unicode Box Drawing ilustrando como os dados trafegam entre as camadas.
   - Salve em `specs/active/<feature>/diagrams/<fluxo>.txt`.

5. **Estruturar o Checklist de Execução (`tasks.md`)**:
   - Baseie-se no template em `specs/templates/tasks.md`.
   - Ordene as tarefas de forma atômica e sequencial: Migrações -> Schemas -> Services -> Controllers/Rotas -> Frontend (Stores/Composables/Componentes) -> Testes -> Atualização de Documentação.

6. **Revisar a Consistência da Spec**:
   - Assegure-se de que todos os requisitos em `requirements.md` possuem correspondência em `design.md` e tarefas dedicadas em `tasks.md`.
