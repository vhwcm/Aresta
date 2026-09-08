# Regra: Central Lead Orchestrator vs Worker

Esta regra define o padrão de orquestração do Antigravity para manter a sessão raiz como o **Ponto Único de Contato (Central de Comando)** e os subagentes como **Workers Especialistas de Background**.

---

## 🛡️ Guardrail de Escopo (Lead Agent vs Worker)

Para blindar o fluxo contra loops de delegação e concorrência desordenada:

### 1. SE VOCÊ FOR A SESSÃO RAIZ (Lead Agent / Chat Principal com o Usuário):
- **Ponto Único de Contato**: O usuário interage exclusivamente através desta conversa principal.
- **Decomposição e Delegação**: Ao receber demandas médias ou grandes, divida o escopo em subtarefas atômicas e invoque subagentes (`invoke_subagent` com tipo `self` ou `research`) fornecendo escopo claro, arquivos alvo e critérios de aceite.
- **Rastreamento Vivo Obrigatório em 2 Níveis**:
  1. **Nível Macro Global (`checklist.md`)**:
     - Local: [checklist.md](file:///c:/Users/vichw/Aresta/checklist.md) na raiz.
     - Formato rígido de 1 linha: `[DD/MM/AAAA HH:MM] [Fazendo/Concluído] Descrição`.
     - Preserva o histórico cumulativo de todas as solicitações do usuário.
  2. **Nível Micro da Tarefa Atual (`TASKS.md` ou `specs/active/<feature>/tasks.md`)**:
     - **Ciclo de Vida do `TASKS.md`**: Existe um único `TASKS.md` ativo por demanda em execução.
     - **Execuções em Paralelo**: Cada subagente recebe um ID de worker (ex: `Worker Auth`, `Worker UI`) e suas tarefas são agrupadas no `TASKS.md` em seções distintas ou em `specs/active/<feature_id>/tasks.md` se for uma spec formal.
     - **Finalização**: Quando a demanda termina e é arquivada, o `TASKS.md` é concluído e o registro macro consolidado fica salvo para sempre no `checklist.md`.
- **Relatórios Consolidados no Chat Central**:
  - Sempre que um subagente finalizar uma etapa, envie no chat central uma síntese estruturada:
    - `[x]` O que foi entregue pelo subagente;
    - Arquivos e artefatos gerados ou alterados (com links de arquivo);
    - `[ ]` O que está sendo iniciado a seguir;
    - Avisos prévios de comandos destrutivos, bloqueios ou decisões que exigem aprovação do usuário.
- **Zero Ruído de Terminal**: Jamais despeje logs brutos, outputs longos de terminal ou traces completos no chat. O chat é executivo e focado em visibilidade de progresso.

### 2. SE VOCÊ FOR UM SUBAGENTE (Worker / Tarefa de Background):
- **Executor Focado**: Seu único papel é EXECUTAR tecnicamente a tarefa recebida dentro dos arquivos delimitados.
- **Restrição Estrita**:
  - **NUNCA** orquestre, crie novos subagentes ou tente delegar trabalho.
  - **NUNCA** altere o `checklist.md` geral da raiz ou o `TASKS.md` diretamente sem instrução explícita do pai.
- **Retorno Estruturado**: Ao terminar a tarefa, envie ao agente orquestrador um resumo objetivo contendo:
  1. O que foi feito;
  2. Arquivos alterados/criados;
  3. Resultado de testes ou validações locais executadas;
  4. Decisões ou bloqueios encontrados.

---

## 📋 Organização de Tarefas em Paralelo no `TASKS.md`

Quando múltiplos subagentes estiverem rodando simultaneamente:

```markdown
# Status da Execução: [Nome da Demanda]

## 🟢 Concluído
- [x] [Worker Backend]: Criou endpoints em `apps/api/src/modules/auth/`
- [x] [Worker DB]: Validou schema do Prisma e migrations

## 🟡 Em Execução (Paralelo)
- [ ] [Worker Web-UI]: Construindo componentes de login em `apps/web/app/pages/login.vue`
- [ ] [Worker AI]: Refatorando pipeline de embedding em `apps/api/src/modules/ai/`

## ⚪ Próximos Passos
- [ ] [Worker Tests]: Executar suite de integração E2E
- [ ] Lead Agent: Quality Gates finais e fechamento no `checklist.md`
```

---

## 💬 Modelo de Notificação de Status no Chat Central

```markdown
### 🔄 Progresso da Demanda: [Nome da Demanda]

- **Etapa**: 🟡 [Etapa Atual] / [Total de Etapas]
- **Concluído por [Nome do Worker]**:
  - `[x]` [Resumo objetivo da entrega técnica]
  - Arquivos: [caminho/arquivo](file:///c:/Users/vichw/Aresta/caminho/arquivo)
- **Próximas Etapas em Andamento (Paralelo)**:
  - `[ ]` [Worker A] -> [Ação A]
  - `[ ]` [Worker B] -> [Ação B]
- **Aprovações Pendentes**: Nenhuma (ou descrever se houver)
```
