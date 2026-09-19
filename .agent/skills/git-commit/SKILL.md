---
name: git-commit
description: >-
  Instruções para versionamento automático e boas práticas de Git. Utilize esta skill
  sempre que concluir tarefas ou subtarefas para preparar arquivos (git add), realizar
  commits com mensagens descritivas, dividir tarefas grandes em commits atômicos menores
  e realizar o push para o repositório remoto.
---

# Git Commit & Push Workflow

Instruções e diretrizes para versionamento, commits e sincronização (push) de alterações no repositório.

## Diretrizes Principais

1. **Validação Prévia de Quality Gates (Obrigatório)**:
   - **NUNCA** faça commit se qualquer Quality Gate estiver falhando. Antes de commitar, execute a skill `run-quality-gates` para assegurar que ESLint, Typecheck e Testes do Frontend e Backend estão 100% aprovados.

2. **Commit Imediato ao Concluir Tarefas**:
   - Sempre que uma tarefa (ou subtarefa bem definida) for finalizada e validada pelos Quality Gates, faça o stage dos arquivos modificados/criados (`git add`) e crie o commit correspondente (`git commit`).

3. **Divisão em Commits Menores (Commits Atômicos)**:
   - Em tarefas grandes, complexas ou com múltiplos componentes/escopos, **divida as alterações em commits menores e lógicos**.
   - Não acumule refatorações, novas features, correções e alterações de documentação em um único commit gigante.
   - Cada commit deve representar uma unidade coerente de trabalho (ex: `feat(api): ...`, `fix(ui): ...`, `refactor(db): ...`, `docs: ...`).

4. **Mensagens Descritivas e Claras**:
   - Utilize mensagens claras, objetivas e descritivas explicando o que foi feito e o contexto quando necessário.
   - Adote a convenção de Conventional Commits sempre que aplicável:
     - `feat:` Nova funcionalidade
     - `fix:` Correção de bug
     - `refactor:` Refatoração de código sem alteração de comportamento
     - `style:` Ajustes de formatação, layout ou estilo
     - `docs:` Alterações na documentação
     - `test:` Criação ou ajuste de testes
     - `chore:` Tarefas de manutenção, dependências ou configurações de build

5. **Envio para o Repositório Remoto e Versionamento de Tags (Git Push & Tag)**:
   - Após finalizar os commits da tarefa/etapa, crie uma tag incremental (`v1.0.X` ou `+0.1` em relação à última tag existente) e envie para o repositório remoto (`git push origin <branch>` e `git push origin <tag>`).
   - Isso garante o rastreamento de versões e aciona a compilação/release automática de APKs no CI/CD.

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

6. **Consultar a última tag e criar a próxima tag incremental**:
   ```bash
   # Obter a última tag
   git tag -l "v*" --sort=-v:refname
   # Exemplo: se a última for v1.0.7, a próxima será v1.0.8
   git tag v1.0.8
   ```

7. **Enviar os commits e a nova tag para o repositório remoto**:
   ```bash
   git push origin main && git push origin v1.0.8
   ```
   *(Caso seja o primeiro push de uma nova branch: `git push -u origin <nome-da-branch>`)*

