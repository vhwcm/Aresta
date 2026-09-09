# ADR-004: Diagramas em ASCII / Text Art Embutidos na Documentação

## Status
Aceito (Accepted)

## Data
2026-08-25 (Atualizado em 2026-09-09)

## Contexto
O projeto precisa de diagramas visuais claros para ilustrar a arquitetura, ciclo de vida de requisições, fluxo de leitura e grafos conceituais. Formatos binários de imagem (PNG/JPEG) ou dependências externas pesadas de renderização criam fricção no versionamento, dificultam a leitura e edição rápida por desenvolvedores e impedem a inspeção direta por agentes de IA. Além disso, manter arquivos `.txt` isolados em uma subpasta separada causava dispersão de documentação.

## Decisão
Adotamos **ASCII e Unicode Box Drawing** como linguagem e padrão universal de diagramação do Aresta.
Os diagramas são **embutidos diretamente dentro dos documentos Markdown** (`docs/architecture/*.md` e `specs/**/design.md`) em blocos de código com formatação monoespaçada (` ```text ` ou ` ``` `), sem a necessidade de pastas de arquivos `.txt` avulsos.

## Alternativas Consideradas
1. **Pasta de arquivos `.txt` separada (`docs/architecture/diagrams/`)**: Gerava redundância e fragmentava a leitura do contexto técnico.
2. **Diagramas D2 / PlantUML / Graphviz**: Exigem CLI adicional instalado no ambiente e ferramentas para compilação visual em bitmap/SVG.
3. **Imagens PNG/SVG exportadas manualmente (Figma / Draw.io)**: Impossíveis de ler em diffs do Git e difíceis de manter sincronizadas durante refatorações ágeis.

## Consequências
- **Positivas**:
  - Contexto unificado: O texto explicativo e a representação visual coexistem no mesmo arquivo Markdown.
  - 100% legível em qualquer terminal, editor de código, IDE ou ferramenta de IA sem necessidade de extensões ou plugins.
  - Totalmente versionável em `git diff`, facilitando revisões de pull requests.
  - Zero dependência externa de renderizador ou arquivos soltos.
- **Negativas / Desafios**:
  - Requer cuidado na edição manual de larguras de colunas e caracteres de borda ao atualizar os diagramas.
