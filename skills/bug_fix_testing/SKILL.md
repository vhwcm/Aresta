---
name: BugFixTesting
description: Garante que correções de bugs e novas funcionalidades sejam acompanhadas por testes automatizados.
---

Esta skill deve ser aplicada sempre que:
- Um *bug* for corrigido.
- Uma *nova funcionalidade* for desenvolvida.

**Requisitos**:
1. Verificar a presença de testes unitários ou end‑to‑end que cubram as alterações.
2. Caso não existam, criar os testes necessários antes de concluir a mudança.
3. Garantir que a cobertura de código não diminua; a pipeline de CI deve falhar se a cobertura baixar.
4. Documentar os testes criados no registro de alterações.

Utilize esta skill como parte do processo de revisão de código e como gatilho nos pipelines de CI/CD.
