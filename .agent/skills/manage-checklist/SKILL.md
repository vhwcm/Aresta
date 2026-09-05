---
name: manage-checklist
description: >-
  Mantém o arquivo checklist.md na raiz atualizado de forma ultra resumida (1 linha por tarefa,
  com data, horário e status de uma palavra). Registra imediatamente toda solicitação do usuário.
---

# Manage Checklist Workflow (`checklist.md`)

Esta skill orienta o agente a registrar e manter o arquivo [checklist.md](file:///c:/Users/vichw/Aresta/checklist.md) na raiz do projeto no formato **ultra resumido de uma linha por tarefa**.

---

## ⚡ Regras de Formato

1. **Uma linha por tarefa**: NUNCA use múltiplos blocos, tabelas de visão geral ou listas aninhadas.
2. **Campos obrigatórios na linha**:
   `- [DD/MM/AAAA HH:MM] [Status] Descrição objetiva da tarefa`
3. **Status de uma única palavra**:
   - `[Fazendo]` — Tarefa em execução
   - `[Concluído]` — Tarefa finalizada com sucesso
   - `[Pendente]` — Tarefa aguardando início (se houver)
4. **Data e Horário**: Sempre incluir dia, mês, ano e hora/minuto da ação.
5. **Sem Visão Geral**: Não adicionar tabelas, contadores ou textos introdutórios. Manter apenas os cabeçalhos das seções e as linhas.

---

## 📋 Estrutura do `checklist.md`

```markdown
# Checklist

## 🔄 Em Andamento
- [05/09/2026 18:40] [Fazendo] Descrição concisa da tarefa atual

## ✅ Concluído
- [05/09/2026 18:39] [Concluído] Descrição concisa da tarefa anterior
```

---

## 🔄 Fluxo de Atualização

1. **Ao receber qualquer pedido**:
   - Inserir imediatamente uma nova linha em `## 🔄 Em Andamento` com `[DD/MM/AAAA HH:MM] [Fazendo] <descrição>`.
2. **Ao concluir a tarefa**:
   - Mover a linha para o topo de `## ✅ Concluído` e alterar o status para `[Concluído]`, atualizando o horário de término.
3. **Preservação de Histórico**:
   - NUNCA apagar tarefas concluídas.
