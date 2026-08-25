---
name: implement-spec
description: >-
  Executa a implementação de uma funcionalidade a partir de uma especificação ativa
  em specs/active/<feature>/, mantendo fidelidade estrita ao design.md e marcando tarefas.
---

# Skill: Implement Spec (Implementação Guiada por Spec)

Esta skill coordena a execução de código a partir de uma Spec aprovada em `specs/active/<feature>/`.

## Regra de Ouro

> **Não invente ou altere a arquitetura durante a codificação sem atualizar o `design.md` da Spec.**

Se durante a implementação você descobrir que o design original é inviável ou precisa de ajustes, **pause a implementação, atualize o `design.md` (e o diagrama ASCII se afetado)** e então continue a codificação.

## Passo a Passo de Execução

1. **Carregar o Contexto da Spec**:
   - Leia `specs/active/<feature>/requirements.md`.
   - Leia `specs/active/<feature>/design.md`.
   - Leia `specs/active/<feature>/tasks.md`.

2. **Executar as Tarefas em Sequência Atômica**:
   - Pegue a próxima tarefa não marcada `[ ]` em `tasks.md`.
   - Implemente o código necessário no módulo correspondente (`aresta-back-node/`, `front/` ou `pdf2epub/`).
   - Mantenha os padrões definidos em `.agent/rules/architecture.md`.
   - Marque a tarefa como concluída `[x]` em `tasks.md`.

3. **Executar Testes da Unidade Implementada**:
   - Execute a suíte de testes relevante (Vitest / Supertest) para garantir que a etapa funciona sem quebrar o ecossistema.

4. **Iterar até Concluir Todas as Tarefas**:
   - Repita para cada tarefa do checklist em `tasks.md`.

5. **Finalização e Arquivamento**:
   - Execute a Skill `review-consistency` para validar que o código implementado atende 100% dos requisitos.
   - Execute a Skill `update-docs` para sincronizar `docs/`.
   - Mova a pasta de `specs/active/<feature>/` para `specs/completed/<feature>/`.
   - Faça o commit final da feature.
