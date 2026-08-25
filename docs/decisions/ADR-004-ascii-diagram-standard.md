# ADR-004: Diagramas em ASCII / Text Art como Padrão Visual do Projeto

## Status
Aceito (Accepted)

## Data
2026-08-25

## Contexto
O projeto precisa de diagramas visuais claros para ilustrar a arquitetura, ciclo de vida de requisições, fluxo de leitura e grafos conceituais. Formatos binários de imagem (PNG/JPEG) ou dependências externas pesadas de renderização criam fricção no versionamento, dificultam a leitura e edição rápida por desenvolvedores e impedem a inspeção direta por agentes de IA.

## Decisão
Adotamos **ASCII e Unicode Box Drawing** como linguagem e padrão universal de diagramação do Aresta. Os diagramas são salvos como arquivos de texto (`.txt`) em `docs/architecture/diagrams/` e `specs/**/diagrams/`, e podem ser facilmente embutidos em blocos de código Markdown (` ``` `).

## Alternativas Consideradas
1. **Diagramas D2 / PlantUML / Graphviz**: Exigem CLI adicional instalado no ambiente e ferramentas para compilação visual em bitmap/SVG.
2. **Imagens PNG/SVG exportadas manualmente (Figma / Draw.io)**: Impossíveis de ler em diffs do Git e difíceis de manter sincronizadas durante refatorações ágeis.

## Consequências
- **Positivas**:
  - 100% legível em qualquer terminal, editor de código, IDE ou ferramenta de IA sem necessidade de extensões.
  - Totalmente versionável em `git diff`, facilitando revisões de pull requests.
  - Zero dependência externa de renderizador.
- **Negativas / Desafios**:
  - Requer cuidado na edição manual de larguras de colunas e caracteres de borda.
