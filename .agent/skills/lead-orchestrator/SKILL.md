---
name: lead-orchestrator
description: >-
  Orquestra execuções complexas usando o padrão Lead Agent com subagentes workers,
  central única de contato no chat principal e rastreamento vivo em checklist.md e TASKS.md.
---

# Lead Orchestrator Workflow

Esta skill formaliza o fluxo operacional do **Lead Agent (Ponto Único de Contato)** no ecossistema Aresta com Antigravity.

---

## 🎯 Princípios Fundamentais

1. **Ponto Único de Contato**: O usuário nunca precisa navegar entre abas ou subagentes; tudo é centralizado na sessão raiz.
2. **Workers Atômicos**: Subagentes operam em contextos isolados com escopo e diretivas claras.
3. **Visibilidade Dinâmica em 2 Níveis**:
   - **Nível Macro (`checklist.md`)**: Registro histórico cumulativo de 1 linha por demanda solicitada pelo usuário.
   - **Nível Micro Dinâmico (`TASKS.md`)**: Artefato vivo da demanda atual, detalhando o progresso individual e paralelo de cada worker.
4. **Sem Ruído**: Relatórios objetivos e estruturados no chat a cada etapa.

---

## 🚀 Ciclo Operacional e Gestão de Tarefas Paralelas

```
[Usuário envia demanda]
          │
          ▼
1. Registrar no checklist.md: - [DD/MM/AAAA HH:MM] [Fazendo] <descrição>
2. Criar ou resetar TASKS.md na raiz para a demanda atual:
   - 🟢 Concluído
   - 🟡 Em Execução (Workers paralelos identificados)
   - ⚪ Próximos Passos
          │
          ▼
3. Instanciar Workers via `invoke_subagent` (em lote ou sequencial):
   - Cada Worker recebe tag específica (ex: [Worker Backend], [Worker UI])
   - Escopo delimitado por arquivos/módulos
   - Critérios de validação locais
   - Proibição de re-orquestração
          │
          ▼
4. Workers executam em paralelo e devolvem resumos ao Lead Agent
          │
          ▼
5. Lead Agent consolida entregas e atualiza:
   - Atualiza TASKS.md em tempo real (marca [x] por worker)
   - Envia síntese limpa no chat principal (agrupando status paralelos)
          │
          ▼
6. Se houver comandos destrutivos / decisões de negócio:
   - Pausa e solicita aprovação no chat principal
          │
          ▼
7. Ao finalizar todas as etapas:
   - Executa Quality Gates obrigatórios (`npm run test:api`, `npm run test:web`, `npm run build:api`, `npm run build:web`)
   - Atualiza checklist.md: move para `## ✅ Concluído` com `[Concluído]`
   - Apresenta o walkthrough final consolidado ao usuário
```

---

## 📝 Formato do Artefato `TASKS.md` (Suporte a Paralelismo)

```markdown
# Status da Execução: [Nome da Demanda]

## 🟢 Concluído
- [x] [Worker DB]: Migrations criadas e validadas
- [x] [Worker Auth-API]: Endpoints de login/refresh implementados

## 🟡 Em Execução (Paralelo)
- [ ] [Worker Frontend]: Montando componentes de tela em `apps/web/app/pages/login.vue`
- [ ] [Worker Test-Suite]: Criando testes unitários em `apps/api/tests/auth.test.ts`

## ⚪ Próximos Passos
- [ ] [Worker E2E]: Rodar validação de integração ponta a ponta
- [ ] Lead Agent: Quality Gates gerais e encerramento
```

---

## 💬 Template de Notificação no Chat Central

```markdown
### 🔄 Atualização: [Nome da Feature/Demanda]

- **Status Geral**: 🟡 Em Execução (Etapa X/Y)
- **Finalizado por Worker [Nome/Tipo]**:
  - `[x]` [Resumo objetivo da entrega técnica]
  - **Arquivos modificados**: [caminho/arquivo](file:///c:/Users/vichw/Aresta/caminho/arquivo)
- **Etapas em Andamento (Paralelo)**:
  - `[ ]` [Worker A] -> [Descrição da ação A]
  - `[ ]` [Worker B] -> [Descrição da ação B]
- **Aprovações Pendentes**: Nenhuma (ou descrever se houver)
```

---

## 🔧 Subagentes Especializados (Specialists)

O Lead Orchestrator dispõe de **4 subagent types especializados** para delegar trabalho de domínio. Consulte a skill `invoke-specialists` para templates detalhados de invocação.

### Quando usar Specialists vs. `self`

| Cenário | Usar |
|---------|------|
| Implementação de backend (endpoints, services, Prisma) | `api-worker` |
| Implementação de frontend (componentes, composables, pages) | `web-worker` |
| Revisão de qualidade pós-implementação | `code-reviewer` |
| Auditoria de segurança (auth, JWT, OAuth, inputs) | `security-auditor` |
| Tarefa trivial (CSS fix, typo, config, 1-2 linhas) | Resolver inline ou `self` |
| Tarefa cross-domain inseparável e pequena | Resolver inline ou `self` |

### Regras de Paralelismo

- `api-worker` + `web-worker` → **PARALELO** quando tarefas são independentes
- `api-worker` → `web-worker` → **SEQUENCIAL** quando frontend depende de API nova
- `code-reviewer` + `security-auditor` → **PARALELO** sempre (ambos são read-only)
- Workers NUNCA criam subagentes ou alteram `checklist.md`/`TASKS.md`
