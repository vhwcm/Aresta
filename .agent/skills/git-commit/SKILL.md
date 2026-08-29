---
name: git-commit
description: >-
  Instruções para versionamento automático e boas práticas de Git. Utilize esta skill
  sempre que concluir tarefas ou subtarefas para preparar arquivos (git add), realizar
  commits com mensagens descritivas e dividir tarefas grandes em commits atômicos menores.
---

# Git Commit Workflow

Instruções e diretrizes para versionamento e commits de alterações no repositório.

## Diretrizes Principais

1. **Validação Prévia de Quality Gates (Obrigatório)**:
   - **NUNCA** faça commit se qualquer Quality Gate estiver falhando. Antes de commitar, execute a skill `run-quality-gates` para assegurar que ESLint, Typecheck e Testes do Frontend e Backend estão 100% aprovados.

2. **Commit Imediato ao Concluir Tarefas**:
   - Sempre que uma tarefa (ou subtarefa bem definida) for finalizada e validada pelos Quality Gates, faça o stage dos arquivos modificados/criados (`git add`) e crie o commit correspondente (`git commit`).

3. **Divisão em Commits Menores (Commits Atômicos)**:
   - Em tarefas grandes, complexas ou com múltiplos componentes/escopos, **divida as alterações em commits menores e lógicos**.
   - Não acumule refatorações, novas features, correções e alterações de documentação em um único commit gigante.
   - Cada commit deve representar uma unidade coerente de trabalho (ex: `feat(api): ...`, `fix(ui): ...`, `refactor(db): ...`, `docs: ...`).

3. **Mensagens Descritivas e Claras**:
   - Utilize mensagens claras, objetivas e descritivas explicando o que foi feito e o contexto quando necessário.
   - Adote a convenção de Conventional Commits sempre que aplicável:
     - `feat:` Nova funcionalidade
     - `fix:` Correção de bug
     - `refactor:` Refatoração de código sem alteração de comportamento
     - `style:` Ajustes de formatação, layout ou estilo
     - `docs:` Alterações na documentação
     - `test:` Criação ou ajuste de testes
     - `chore:` Tarefas de manutenção, dependências ou configurações de build

## Procedimento Passo a Passo

1. **Verificar o status e arquivos alterados**:
   ```bash
   git status
   ```

2. **Revisar as diferenças para garantir que apenas o código pretendido está sendo versionado**:
   ```bash
   git diff
   ```

3. **Adicionar os arquivos ao stage (agrupando por contexto lógico)**:
   ```bash
   git add <caminho/dos/arquivos>
   ```

4. **Criar o commit com mensagem descritiva**:
   ```bash
   git commit -m "<tipo>(<escopo>): <descrição clara do que foi feito>"
   ```

5. **Para tarefas grandes, repetir o processo para cada grupo de alterações**:
   - Isole os arquivos de cada parte da tarefa, faça `git add` seletivo e commite individualmente antes de prosseguir para a próxima parte.

