# ADR-005: Desenvolvimento Orientado a Especificações Técnicas (Modelo Mental Kiro)

## Status
Aceito (Accepted)

## Data
2026-08-25

## Contexto
Agentes de IA e equipes de engenharia enfrentam perda de contexto e divergências arquiteturais quando começam a escrever código diretamente a partir de solicitações abertas em linguagem natural, gerando implementações que não seguem os padrões do projeto ou contradizem decisões anteriores.

## Decisão
Adotamos formalmente a metodologia **Spec-Driven Development (Modelo Mental Kiro)** no ecossistema Aresta:
1. **Conhecimento Persistente**: A base de documentação em `docs/` e `specs/` é a fonte primária de verdade.
2. **Separação Rígida entre Pensar e Codificar**: Features médias ou grandes exigem a criação e aprovação de uma Spec (`requirements.md` + `design.md` + `tasks.md` + `diagrams/`) antes de qualquer alteração de código.
3. **Auditoria Contínua**: A skill `review-consistency` valida a aderência cruzada entre Código, Documentação, Testes e Specs.

## Alternativas Consideradas
1. **Desenvolvimento Ad-hoc Direto no Código**: Descartado por gerar inconsistências frequentes e desvio arquitetural em sessões de desenvolvimento com IA.
2. **Documentação Pós-Fato (Write docs after code)**: Descartado porque comumente a documentação nunca é escrita ou fica defasada imediatamente.

## Consequências
- **Positivas**:
  - Eliminação de suposições errôneas e alinhamento prévio sobre contratos de API e schemas.
  - Memória de projeto persistente independente do tamanho da janela de contexto da IA.
  - Rastreabilidade histórica de todas as funcionalidades concluídas em `specs/completed/`.
- **Negativas / Desafios**:
  - Exige a disciplina de criar os arquivos de spec para features grandes antes da codificação.
