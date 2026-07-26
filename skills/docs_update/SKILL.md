---
name: DocsUpdate
description: Exige atualização da documentação sempre que algo novo for adicionado ou refatorado.
---

Esta skill deve ser acionada sempre que:
- Um novo recurso, módulo ou endpoint for criado.
- Código existente for refatorado ou removido.

**Ações requeridas**:
1. Verificar se existe documentação correspondente em `/docs/` do projeto.
2. Caso não exista, criar ou atualizar o arquivo de documentação apropriado.
3. Garantir que a documentação reflita mudanças de API, comportamento ou arquitetura.
4. Incluir referência à alteração no registro de changelog.

Utilize esta skill como parte do processo de revisão de código e como checklist nos pipelines de CI/CD.
