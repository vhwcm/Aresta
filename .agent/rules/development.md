# Regra: Fluxo de Desenvolvimento e Classificação de Tarefas

## Classificação do Escopo de Tarefas

O agente deve avaliar o impacto da tarefa solicitada pelo usuário e aplicar o protocolo correspondente:

### 1. Tarefa Pequena (Small Scope)
- **Definição**: Correção de bug pontual/óbvio, ajuste de tipografia/CSS, refatoração estritamente local, atualização de dependência menor.
- **Protocolo**:
  1. Registrar imediatamente a tarefa em `checklist.md` na seção "In Progress".
  2. Localizar o arquivo afetado.
  3. Implementar a correção diretamente.
  4. Executar os testes unitários da área.
  5. Mover a tarefa para "Done" no `checklist.md`.
  6. Realizar `git commit` com mensagem Conventional Commits.

### 2. Tarefa Média (Medium Scope)
- **Definição**: Adição de novo endpoint em rota existente, criação de novo componente ou composable, alteração de schema Zod, nova regra de negócio em service existente.
- **Protocolo**:
  1. Registrar imediatamente a tarefa em `checklist.md` na seção "In Progress" com subtarefas decompostas.
  2. Consultar a documentação correspondente em `docs/domain/` ou `docs/architecture/`.
  3. Implementar a alteração no código.
  4. Adicionar/atualizar testes automatizados (Vitest / Supertest).
  5. Atualizar a documentação correspondente em `docs/`.
  6. Validar linters e testes.
  7. Mover a tarefa para "Done" no `checklist.md`.
  8. Realizar `git commit` com mensagem descritiva.

### 3. Tarefa Grande (Large Scope / Feature)
- **Definição**: Novo módulo ou sistema, alteração de banco de dados (`prisma/schema.prisma`), novo fluxo de autenticação, refatoração de múltiplos módulos, nova integração externa.
- **Protocolo Obrigatório**:
  1. Registrar imediatamente a tarefa em `checklist.md` na seção "In Progress" com subtarefas decompostas.
  2. **Exploração**: Executar a Skill `explore-project`.
  3. **Criação de Spec**: Executar a Skill `create-spec` gerando `specs/active/<feature>/` (`requirements.md`, `design.md`, `tasks.md`, `diagrams/<fluxo>.txt`).
  4. **Implementação Guiada**: Executar a Skill `implement-spec`, seguindo o checklist de tarefas sem violar o `design.md`.
  5. **Testes e Logs**: Executar suíte completa de testes e validar comportamento em runtime.
  6. **Auditoria de Consistência**: Executar a Skill `review-consistency`.
  7. **Atualização de Conhecimento**: Mover a spec para `specs/completed/` e executar a Skill `update-docs`.
  8. Mover a tarefa para "Done" no `checklist.md`.
  9. **Commits Atômicos**: Realizar commits divididos por etapa.

