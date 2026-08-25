# Guia: Fluxo de Trabalho de Desenvolvimento (Workflow)

Este documento descreve as etapas recomendadas para desenvolvedores e agentes de IA ao criar features, corrigir bugs ou realizar refatorações no Aresta.

---

## 1. Ciclo de Vida do Desenvolvimento

```
      Receber Tarefa / Demanda
                 │
                 ▼
       Classificar o Escopo
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
  Pequeno      Médio       Grande
  (Bug/Fix)  (Endpoint)  (Feature/Módulo)
     │           │           │
     │           │           ▼
     │           │      Criar Spec em `specs/active/`
     │           │      (requirements, design, tasks, ASCII)
     │           │           │
     └───────────┼───────────┘
                 ▼
          Implementação
                 │
                 ▼
        Testes Automatizados
                 │
                 ▼
     Auditoria de Consistência
                 │
                 ▼
    Atualizar Documentação em `docs/`
                 │
                 ▼
          Commits Atômicos
```

---

## 2. Boas Práticas de Commit
- Sempre commite ao terminar uma tarefa validada.
- Adote Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- Mantenha commits menores e focados em uma única responsabilidade.

---

## 3. Checklist Pré-Merge
Antes de submeter alterações ou finalizar tarefas:
1. `npm test` no backend e no frontend.
2. `npm run typecheck` e `npm run lint` no frontend.
3. `npm run build` no backend.
4. Garantir que os diagramas ASCII em `docs/architecture/diagrams/` e `docs/` refletem as mudanças.
