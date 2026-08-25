---
name: review-consistency
description: >-
  Audita e valida a consistência cruzada entre Requirements, Design, Tasks, Código,
  Testes, Documentação, ADRs, Diagramas ASCII e Logs de Execução.
---

# Skill: Review Consistency (Auditoria Cruzada)

Esta skill executa uma varredura crítica no repositório para identificar e corrigir inconsistências e divergências documentais ou de código.

## Matriz de Auditoria

```
    Requirements  ◄──►  Design
         ▲                 ▲
         │                 │
       Tasks      ◄──►    Code
         ▲                 ▲
         │                 │
       Tests      ◄──►  Docs & ADRs
         ▲                 ▲
         │                 │
     Runtime Logs ◄──►  Diagramas ASCII
```

## Checklist de Verificação

1. **Requisitos ↔ Design ↔ Tasks**:
   - Todo requisito funcional (`R1..Rn`) em `requirements.md` possui desenho técnico correspondente em `design.md`?
   - Toda etapa necessária do design possui uma tarefa em `tasks.md`?

2. **Design ↔ Código**:
   - As assinaturas de métodos, endpoints de rotas e schemas Zod implementados batem com a especificação?
   - O código utiliza os padrões e camadas documentadas em `design.md`?

3. **Código ↔ Documentação & ADRs**:
   - Há discrepância entre a tecnologia documentada em `docs/` e as dependências reais em `package.json`? (Ex: doc menciona biblioteca antiga não mais utilizada).
   - Os modelos descritos em `docs/architecture/database.md` refletem fielmente o `prisma/schema.prisma`?

4. **Código ↔ Diagramas ASCII**:
   - Os diagramas em `docs/architecture/diagrams/*.txt` mostram as camadas e fluxos que realmente existem no código?

5. **Código ↔ Testes Automatizados**:
   - As principais rotas do backend possuem testes de integração em `aresta-back-node/tests/`?
   - Componentes críticos do frontend possuem testes em `front/tests/`?

6. **Relatório de Divergências**:
   - Se encontrar inconsistências, liste os conflitos pontuais e gere as correções imediatamente antes de dar a tarefa como concluída.
