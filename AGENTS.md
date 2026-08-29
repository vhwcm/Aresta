# Diretrizes do Projeto & Manual do Agente (Modelo Mental Kiro)

Este repositório adota o **modelo mental do Kiro**, onde o conhecimento estruturado, especificações técnicas, observabilidade e diagramação visual guiam todo o ciclo de vida do desenvolvimento.

```
                  ┌─────────────────────┐
                  │   PROJECT KNOWLEDGE │
                  │ (docs/, ADRs, ASCII)│
                  └──────────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              ↓              ↓              ↓
          ARCHITECTURE     DOMAIN       DECISIONS
         (docs/arch/)   (docs/domain/) (docs/decisions/)
              │              │              │
              └──────────────┼──────────────┘
                             ↓
                        SPEC / PLAN
                   (specs/active/<feat>)
                [requirements + design + tasks + ASCII]
                             ↓
                           TASKS
                             ↓
                       IMPLEMENTAÇÃO
                             ↓
                      TESTES & LOGS
                    (runtime evidence)
                             ↓
                    REVIEW & CONSISTENCY
                             ↓
                    ATUALIZA DOCUMENTAÇÃO
              (docs, ADRs, specs, ASCII, guides)
```

---

## 1. Conhecimento do Projeto e Fonte da Verdade

- A pasta `docs/` é a **fonte única da verdade** (*single source of truth*) para a arquitetura, regras de domínio, sistemas e decisões do projeto.
- Antes de iniciar qualquer alteração que vá além de correções triviais, inspecione a documentação pertinente em `docs/architecture/`, `docs/domain/`, `docs/decisions/` e `specs/`.
- Nunca introduza novos padrões arquiteturais, novas dependências ou alterações estruturais no banco/API sem registrá-los na documentação ou em um ADR (*Architecture Decision Record*).

---

## 2. Fluxo de Desenvolvimento e Classificação de Tarefas

O fluxo de trabalho depende do tamanho e impacto da alteração:

### 🟢 Tarefas Pequenas (Bug trivial, typo, ajuste de CSS/estilo, refactor local)
1. Inspecionar o arquivo relevante.
2. Implementar a alteração diretamente.
3. Rodar testes automatizados da área afetada.
4. Fazer `git commit` atômico descritivo.

### 🟡 Tarefas Médias (Novo endpoint, alteração em composable/store, novo componente)
1. Consultar a documentação correspondente em `docs/`.
2. Implementar as mudanças no código.
3. Escrever ou atualizar os testes unitários/integração.
4. Atualizar a documentação correspondente em `docs/`.
5. Executar testes e linters.
6. Fazer `git commit` atômico descritivo.

### 🔴 Tarefas Grandes (Nova funcionalidade, novo modelo no banco, mudança arquitetural, novo módulo)
1. **Explore**: Executar exploração sistemática do projeto (Skill `explore-project`).
2. **Consult Knowledge**: Revisar arquitetura, domínio, ADRs e diagramas ASCII existentes.
3. **Create Spec**: Criar especificação formal em `specs/active/<nome-da-feature>/` (Skill `create-spec`), contendo:
   - `requirements.md`: Objetivo, requisitos funcionais (R1..Rn) e critérios de aceite.
   - `design.md`: Arquitetura, componentes, schemas Zod, migrações e contratos.
   - `diagrams/<fluxo>.txt`: Diagrama visual em texto/ASCII representativo.
   - `tasks.md`: Checklist sequencial e atômico de implementação.
4. **Implement**: Executar as tarefas descritas na Spec (Skill `implement-spec`). Não altere o design sem atualizar a Spec.
5. **Test & Observe**: Rodar testes unitários, testes de integração e validar logs de runtime.
6. **Review Consistency**: Auditar coerência entre Código ↔ Docs ↔ Specs ↔ Testes ↔ Diagramas (Skill `review-consistency`).
7. **Update Knowledge**: Mover spec para `specs/completed/` e atualizar `docs/` (Skill `update-docs`).
8. **Commit**: Commitar as alterações em commits menores e lógicos.

---

## 3. Observabilidade e Logging para Troubleshooting

- A aplicação deve manter logs estruturados com contexto suficiente para diagnóstico (`DEBUG`, `INFO`, `WARN`, `ERROR`).
- Em investigações de problemas, baseie-se em **evidências observáveis** (logs de execução, mensagens de erro, reprodução via testes) em vez de apenas suposições estáticas de código.
- Nunca registre dados sensíveis, credenciais ou tokens em logs.

---

## 4. Documentação Visual com Diagramas ASCII

- Fluxos de dados relevantes, integrações entre front/back, autenticação e arquiteturas de módulos devem possuir diagramas em **ASCII / Unicode Box Drawing** salvos em `docs/architecture/diagrams/*.txt` ou `specs/**/diagrams/*.txt`.
- Mantenha os diagramas ASCII sempre sincronizados com o código real.

---

## 5. Git & Versionamento & Quality Gates

- **Bloqueio Inegociável de Commits**: **NUNCA** realize `git commit` ou `git push` com Quality Gates falhando. Execute a skill `run-quality-gates` para validar Frontend (`lint`, `typecheck`, `test`) e Backend (`build`, `test`).
- **Commits ao Concluir Tarefas**: Sempre que uma tarefa ou subtarefa for concluída e validada por todos os quality gates, realize o `git add` dos arquivos pertinentes e faça um `git commit`.
- **Mensagens Descritivas**: Utilize mensagens claras e descritivas seguindo Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- **Commits Atômicos/Menores**: Em tarefas grandes, divida as alterações em commits menores e lógicos em vez de acumular tudo em um único commit gigante.
