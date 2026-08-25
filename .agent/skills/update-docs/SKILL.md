---
name: update-docs
description: >-
  Atualiza a base de conhecimento (docs/, ADRs, diagramas ASCII e guias) sempre que
  houver alterações em modelos, APIs, regras de negócio ou fluxos arquiteturais.
---

# Skill: Update Docs (Sincronização de Conhecimento)

Esta skill garante que a base de conhecimento do projeto em `docs/` permaneça uma representação exata e viva do código real.

## Fluxo de Decisão

```
                Código alterado
                       │
                       ▼
       O conhecimento do projeto mudou?
                       │
             ┌─────────┴─────────┐
             │                   │
            NÃO                 SIM
             │                   │
             ▼                   ▼
           FIM         Identificar escopos:
                                 │
                 ┌───────────────┼───────────────┬───────────────┐
                 ▼               ▼               ▼               ▼
           Architecture       Domain           ADRs        Diagramas ASCII
           (docs/arch/)    (docs/domain/) (docs/decisions/) (docs/arch/diagrams/)
```

## Passo a Passo de Execução

1. **Avaliar as Mudanças Realizadas no Código**:
   - Foram adicionadas/alteradas entidades no Prisma? -> Atualizar `docs/architecture/database.md` e `docs/domain/<entidade>.md`.
   - Foram adicionadas/alteradas rotas ou controllers? -> Atualizar `docs/architecture/backend.md` e Swagger annotations.
   - Foram adicionados/alterados componentes de UI ou adapters? -> Atualizar `docs/architecture/frontend.md` ou `docs/domain/reading.md`.
   - Houve uma nova decisão arquitetural significativa? -> Criar `docs/decisions/ADR-XXX-<nome>.md`.
   - O fluxo de dados mudou visualmente? -> Atualizar o arquivo `.txt` em `docs/architecture/diagrams/`.

2. **Aplicar Edições na Documentação**:
   - Mantenha explicações claras, focando em: *O que é? Por que existe? Quais são as regras? Como interage com os outros módulos?*

3. **Atualizar a Navegação do Mintlify se Houver Novos Arquivos**:
   - Verifique `docs/mint.json` e adicione os novos documentos nos grupos apropriados.

4. **Validar Consistência**:
   - Garanta que nenhum arquivo Markdown contenha referências a código ou rotas obsoletas.
