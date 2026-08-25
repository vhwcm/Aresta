# Regra: Gestão da Documentação e Sincronização

## Princípio Fundamental

A pasta `docs/` é a **fonte única da verdade** (*single source of truth*) do projeto Aresta. O código-fonte, as especificações e a documentação devem permanecer estritamente sincronizados.

## Estrutura da Base de Conhecimento

```
docs/
├── architecture/             # Visão geral da arquitetura, backend, frontend, banco e infra
│   └── diagrams/             # Diagramas visuais em ASCII/Text art (*.txt)
├── domain/                   # Regras de negócio, entidades e fluxos funcionais
├── decisions/                # Architecture Decision Records (ADRs) numerados
├── systems/                  # Catálogo de tecnologias e padrões de observabilidade
└── guides/                   # Guias de instalação, fluxo de dev, testes e troubleshooting
```

## Regras de Sincronização

1. **Alteração de Comportamento ou API**:
   - Sempre que uma rota, schema, serviço ou componente for adicionado, modificado ou removido, a documentação correspondente em `docs/` deve ser atualizada no mesmo ciclo de desenvolvimento.

2. **Novas Decisões Arquiteturais**:
   - Qualquer decisão que introduza nova biblioteca principal, padrão de design, banco de dados ou protocolo de comunicação deve ser registrada como um novo ADR em `docs/decisions/ADR-XXX-<nome>.md`.

3. **Prevenção de Falsa Memória**:
   - É estritamente proibido deixar a documentação defasada em relação ao código real. Documentação obsoleta compromete a eficiência tanto de desenvolvedores humanos quanto de agentes de IA.
