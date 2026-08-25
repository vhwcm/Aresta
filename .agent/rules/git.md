# Regra: Versionamento e Commits Git

## Diretrizes de Versionamento

1. **Commit Obrigatório ao Concluir Etapas**:
   - Nunca deixe trabalho validado pendente na árvore de trabalho sem commit. Ao finalizar uma tarefa, subtarefa, documentação ou teste, faça `git add` dos arquivos pertinentes e execute `git commit`.

2. **Commits Atômicos e Menores**:
   - Em tarefas complexas ou com múltiplos escopos, **divida as alterações em commits lógicos e menores**.
   - Separe commits de infraestrutura, backend, frontend, testes, documentação e regras.
   - Não acumule refatorações, novas features e ajustes de formatação em um único commit gigante.

3. **Convenção de Mensagens (Conventional Commits)**:
   - Formato: `<tipo>(<escopo>): <descrição em português ou inglês claro>`
   - Tipos suportados:
     - `feat:` Nova funcionalidade
     - `fix:` Correção de bug
     - `refactor:` Refatoração sem alteração de comportamento
     - `docs:` Alterações e inclusões na documentação ou diagramas
     - `test:` Inclusão ou ajuste de testes
     - `chore:` Manutenção, dependências, scripts ou regras do agente
