# Regra: Fluxo de Desenvolvimento e Classificação de Tarefas

## Classificação do Escopo de Tarefas

O agente deve avaliar o impacto da tarefa solicitada pelo usuário e aplicar o protocolo correspondente:

### 1. Tarefa Pequena (Small Scope)
- **Definição**: Correção de bug pontual/óbvio, ajuste de tipografia/CSS, refatoração estritamente local, atualização de dependência menor.
- **Protocolo**:
  1. Localizar o arquivo afetado.
  2. Implementar a correção diretamente.
  3. Executar os testes unitários da área.
  4. Realizar `git commit` com mensagem Conventional Commits.

### 2. Tarefa Média (Medium Scope)
- **Definição**: Adição de novo endpoint em rota existente, criação de novo componente ou composable, alteração de schema Zod, nova regra de negócio em service existente.
- **Protocolo**:
  1. Consultar a documentação correspondente em `docs/domain/` ou `docs/architecture/`.
  2. Implementar a alteração no código.
  3. Adicionar/atualizar testes automatizados (Vitest / Supertest).
  4. Atualizar a documentação correspondente em `docs/`.
  5. Validar linters e testes.
  6. Realizar `git commit` com mensagem descritiva.

### 3. Tarefa Grande (Large Scope / Feature)
- **Definição**: Novo módulo ou sistema, alteração de banco de dados (`prisma/schema.prisma`), novo fluxo de autenticação, refatoração de múltiplos módulos, nova integração externa.
- **Protocolo Obrigatório**:
  1. **Exploração**: Executar a Skill `explore-project`.
  2. **Criação de Spec**: Executar a Skill `create-spec` gerando `specs/active/<feature>/` (`requirements.md`, `design.md`, `tasks.md`, `diagrams/<fluxo>.txt`).
  3. **Implementação Guiada**: Executar a Skill `implement-spec`, seguindo o checklist de tarefas sem violar o `design.md`.
  4. **Testes e Logs**: Executar suíte completa de testes e validar comportamento em runtime.
  5. **Auditoria de Consistência**: Executar a Skill `review-consistency`.
  6. **Atualização de Conhecimento**: Mover a spec para `specs/completed/` e executar a Skill `update-docs`.
  7. **Commits Atômicos**: Realizar commits divididos por etapa.
