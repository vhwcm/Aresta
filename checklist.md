# 📌 Checklist Operacional — Aresta Monolith

> **Painel Central de Contexto e Rastreabilidade Contínua**  
> Este arquivo é a fonte da verdade para o acompanhamento de tudo o que foi solicitado, o que está em andamento e o que já foi finalizado no projeto Aresta.  
> **Regra**: Toda nova solicitação deve ser registrada imediatamente aqui antes ou durante o início da execução, e atualizada ao ser concluída.

---

## 📊 Visão Geral do Projeto

| Indicador | Quantidade |
| :--- | :--- |
| 🔄 **Tarefas em Andamento (Doing)** | 1 |
| ✅ **Tarefas Concluídas (Done)** | 6 |
| 📋 **Backlog / A Fazer (To Do)** | 0 |

---

## 🔄 O Que Está Sendo Feito Agora (In Progress / Doing)

### [TASK-007] Implementação do Sistema Central de Checklist (`checklist.md`), Skill e Regras de Manutenção
- **Solicitação do Usuário**: Criar o arquivo `checklist.md` na raiz do projeto, uma skill no `.agent/skills/` e diretrizes nas rules do sistema para que toda e qualquer tarefa solicitada seja registrada e atualizada com "o que está sendo feito" e "o que foi feito", mantendo o contexto sempre ativo.
- **Início**: 05/09/2026
- **Status**: 🟡 Em Andamento
- **Checklist de Execução**:
  - [x] Criar `checklist.md` na raiz com estrutura de visão geral, tarefas em andamento, tarefas concluídas e histórico
  - [ ] Criar a skill `.agent/skills/manage-checklist/SKILL.md` com protocolo detalhado de atualização contínua
  - [ ] Criar a rule `.agent/rules/checklist.md` formalizando a regra mandatória de rastreamento
  - [ ] Atualizar `AGENTS.md` com a regra inegociável de manutenção do `checklist.md`
  - [ ] Atualizar `GEMINI.md` e `.agent/rules/development.md` integrando o checklist ao fluxo de desenvolvimento
  - [ ] Validar integridade e garantir conformidade com os Quality Gates
- **Arquivos Afetados**:
  - `checklist.md` (novo)
  - `.agent/skills/manage-checklist/SKILL.md` (novo)
  - `.agent/rules/checklist.md` (novo)
  - `AGENTS.md` (atualizado)
  - `GEMINI.md` (atualizado)
  - `.agent/rules/development.md` (atualizado)

---

## ✅ O Que Já Foi Feito (Done / Concluído)

### [TASK-006] Migração de Microserviços para Monólito Modular
- **Data de Conclusão**: 05/09/2026
- **Resumo**: Unificação da arquitetura legada de múltiplos serviços (`aresta-auth`, `aresta-reader`, `aresta-canvas`, `aresta-memory`, `aresta-ai`) na arquitetura de monólito modular unificado (`apps/api` e `apps/web`), centralizando banco de dados no PostgreSQL 16 com extensão `pgvector`.
- **Quality Gates**: Passando 100% verde (`npm test`, `npm run build`).
- **Contexto**: Estabelecido monólito com Nuxt 3 / Tauri v2 no frontend e Express modular com Prisma ORM no backend.

---

### [TASK-005] Resolução de Problemas na Renderização do Canvas
- **Data de Conclusão**: 05/09/2026
- **Resumo**: Correção de gargalos de renderização e inconsistências de render no módulo de canvas infinito, garantindo sincronização de nós, viewport e otimização de transformações matriciais.
- **Status**: Concluído com sucesso.

---

### [TASK-004] Conexão de Notas no Grafo de Conhecimento
- **Data de Conclusão**: 05/09/2026
- **Resumo**: Implementação e estabilização do vínculo bidirecional entre anotações no leitor e nós no grafo de conhecimento, com propagação de metadados e persistência relacional.
- **Status**: Concluído com sucesso.

---

### [TASK-003] Ajuste e Refinamento de Filtros da Sidebar
- **Data de Conclusão**: 05/09/2026
- **Resumo**: Correção nos estados reativos e filtros de busca da barra lateral de navegação (livros, anotações, tags e decks de flashcards).
- **Status**: Concluído com sucesso.

---

### [TASK-002] Correções na Formatação e Renderização Markdown
- **Data de Conclusão**: 04/09/2026
- **Resumo**: Correção no parser de markdown do leitor e anotações para renderizar corretamente blocos de código, tabelas, callouts e destaques tipográficos.
- **Status**: Concluído com sucesso.

---

### [TASK-001] Padronização do Layout Unificado Para Notas
- **Data de Conclusão**: 04/09/2026
- **Resumo**: Estruturação visual e de componentes para a exibição de notas contextuais ao lado do leitor ativo, garantindo consistência responsiva e tema harmonioso.
- **Status**: Concluído com sucesso.

---

## 📋 Backlog / A Fazer (To Do)
*(Tarefas futuras ou novos pedidos do usuário entram aqui quando ainda não iniciados)*

---

## 📖 Instruções Rápidas de Manutenção
1. **Novo Pedido**: Inserir na seção `🔄 O Que Está Sendo Feito Agora (In Progress / Doing)` com ID sequencial e checklist decomposto.
2. **Durante o Trabalho**: Marcar `[x]` nos subitens conforme cada etapa for concluída.
3. **Ao Finalizar**: Mover para `✅ O Que Já Foi Feito (Done / Concluído)` com data, resumo do que foi entregue, arquivos afetados e confirmação de Quality Gates.
