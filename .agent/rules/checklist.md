# Regra Inegociável: Manutenção Obrigatória do Checklist Contínuo (`checklist.md`)

## 📌 Diretriz Central

É **OBRIGATÓRIO** e **MANDATÓRIO** registrar e manter atualizado o arquivo [checklist.md](file:///c:/Users/vichw/Aresta/checklist.md) na raiz do projeto para **TODAS** as solicitações feitas pelo usuário, sem exceção.

O objetivo desta regra é garantir que tanto o usuário quanto o agente mantenham total visibilidade sobre **o que está sendo feito** e **o que já foi feito**, preservando o contexto histórico do desenvolvimento ao longo do tempo.

---

## ⚡ Protocolo de Execução Obrigatório

Sempre que o usuário solicitar qualquer tarefa, comando, refatoração, correção de bug ou nova funcionalidade:

1. **Registro Imediato**:
   - Antes de iniciar alterações no código ou logo no primeiro passo de execução, adicione uma nova entrada na seção `🔄 O Que Está Sendo Feito Agora (In Progress / Doing)` do `checklist.md`.
   - Atribua um identificador sequencial `[TASK-XXX]` e detalhe a solicitação do usuário.
   - Decomponha a solicitação em um checklist de subtarefas acionáveis (`- [ ]`).

2. **Acompanhamento Ativo**:
   - Conforme cada subtarefa for concluída durante o atendimento da solicitação, atualize o checklist marcando `- [x]`.

3. **Finalização e Histórico Cumulativo**:
   - Ao concluir a tarefa e validar os Quality Gates obrigatórios, mova o bloco da tarefa para a seção `✅ O Que Já Foi Feito (Done / Concluído)`.
   - Preencha a data de conclusão, resumo do que foi entregue, lista de arquivos afetados e confirmação de validação dos Quality Gates.
   - Atualize a tabela de métricas `📊 Visão Geral do Projeto` no topo do arquivo.
   - **NUNCA** apague tarefas finalizadas: o histórico cumulativo deve ser rigorosamente preservado.
