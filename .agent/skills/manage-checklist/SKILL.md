---
name: manage-checklist
description: >-
  Mantém e atualiza de forma contínua o arquivo checklist.md na raiz do projeto Aresta.
  Registra imediatamente qualquer solicitação do usuário, documenta o que está sendo feito (In Progress)
  e o que foi feito (Done), garantindo preservação total de contexto entre sessões.
---

# Manage Checklist Workflow (`checklist.md`)

Esta skill orienta o agente a registrar, rastrear e persistir **TODAS** as tarefas solicitadas pelo usuário no arquivo central [checklist.md](file:///c:/Users/vichw/Aresta/checklist.md), localizado na raiz do projeto.

---

## 🎯 Objetivo
Garantir que o usuário e o agente tenham sempre visibilidade clara e em tempo real sobre:
1. **O que está sendo feito agora** (tarefa ativa, subtarefas desdobradas, arquivos envolvidos, status atual).
2. **O que já foi feito** (histórico detalhado, data de conclusão, resumo da entrega, arquivos modificados, Quality Gates).
3. **Histórico cumulativo preservado** (nenhuma tarefa concluída deve ser descartada ou apagada).

---

## ⚡ Regras Mandatórias de Acionamento

1. **Recepção de Pedido**:
   - Sempre que o usuário enviar uma nova mensagem solicitando algo (implementação, refatoração, correção, documentação, etc.), o agente **DEVE** registrar a tarefa imediatamente em `checklist.md` antes ou logo no início da execução.
2. **Decomposição em Subitens**:
   - Cada tarefa deve conter um checklist `[ ]` com as etapas necessárias para sua conclusão.
3. **Atualização Durante o Progresso**:
   - Conforme passos são executados com sucesso, marcar como `[x]`.
4. **Finalização da Tarefa**:
   - Ao concluir a solicitação e validar os Quality Gates, mover o bloco da tarefa de `🔄 O Que Está Sendo Feito Agora (In Progress / Doing)` para `✅ O Que Já Foi Feito (Done / Concluído)`.
   - Atualizar os números da tabela de `📊 Visão Geral do Projeto`.

---

## 📋 Estrutura Padrão do `checklist.md`

### 1. Tabela de Visão Geral
```markdown
## 📊 Visão Geral do Projeto

| Indicador | Quantidade |
| :--- | :--- |
| 🔄 **Tarefas em Andamento (Doing)** | <N> |
| ✅ **Tarefas Concluídas (Done)** | <N> |
| 📋 **Backlog / A Fazer (To Do)** | <N> |
```

### 2. Formato de Tarefa em Andamento (In Progress)
```markdown
### [TASK-XXX] <Título Curto e Autoexplicativo da Tarefa>
- **Solicitação do Usuário**: <Resumo fiel do que o usuário pediu>
- **Início**: DD/MM/AAAA
- **Status**: 🟡 Em Andamento
- **Checklist de Execução**:
  - [x] Subtarefa 1 realizada
  - [ ] Subtarefa 2 em andamento
  - [ ] Subtarefa 3 pendente
  - [ ] Execução e validação dos Quality Gates (npm test / npm run build)
- **Arquivos Afetados**:
  - `caminho/do/arquivo1`
  - `caminho/do/arquivo2`
```

### 3. Formato de Tarefa Concluída (Done)
```markdown
### [TASK-XXX] <Título Curto e Autoexplicativo da Tarefa>
- **Data de Conclusão**: DD/MM/AAAA
- **Resumo**: <Resumo claro do que foi implementado, corrigido ou ajustado>
- **Quality Gates**: Passando 100% verde (`npm test`, `npm run build`).
- **Arquivos Modificados**:
  - `caminho/do/arquivo1`
  - `caminho/do/arquivo2`
```

---

## 🔄 Fluxo Operacional Passo a Passo

```
 ┌────────────────────────────────────────┐
 │   Usuário envia uma nova solicitação   │
 └───────────────────┬────────────────────┘
                     │
 ┌───────────────────▼────────────────────┐
 │  Registrar [TASK-XXX] em checklist.md  │
 │  na seção "In Progress" com subtarefas │
 └───────────────────┬────────────────────┘
                     │
 ┌───────────────────▼────────────────────┐
 │ Executar passos & marcar [x] no check  │
 └───────────────────┬────────────────────┘
                     │
 ┌───────────────────▼────────────────────┐
 │  Executar Quality Gates obrigatórios   │
 └───────────────────┬────────────────────┘
                     │ (100% verde)
 ┌───────────────────▼────────────────────┐
 │ Mover tarefa para "Done" com resumo e  │
 │ atualizar tabela de Visão Geral        │
 └────────────────────────────────────────┘
```
