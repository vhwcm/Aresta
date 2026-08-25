# Regra: Documentação Visual em Diagramas ASCII

## Princípio Fundamental

Diagramas visuais em **ASCII / Unicode Box Drawing** são artefatos de primeira classe da documentação do projeto Aresta. Eles permitem que desenvolvedores e agentes compreendam fluxos complexos, interações entre camadas e limites do sistema instantaneamente sem precisar ler dezenas de arquivos de código.

## Quando Criar ou Atualizar um Diagrama ASCII

Crie ou atualize um diagrama em formato de texto (`.txt`) sempre que houver:
1. Um novo fluxo de comunicação entre Frontend e Backend.
2. Uma nova interação complexa envolvendo banco de dados ou estado compartilhado.
3. Fluxo de autenticação, autorização ou controle de sessão.
4. Processamento assíncrono, cálculo de streaks ou manipulação de grafos conceituais.
5. Nova especificação técnica (`specs/active/<feature>/diagrams/<fluxo>.txt`).

## Convenções de Formatação

- Utilize caixas Unicode (`┌─┐`, `│ │`, `└─┘`) ou ASCII puro (`+--+`, `|  |`, `+--+`) com setas direcionais (`──►`, `▲`, `▼`, `◄──` ou `-->`, `<--`).
- Mantenha os diagramas armazenados em `docs/architecture/diagrams/<nome-do-fluxo>.txt` e referenciados/embutidos em blocos de código com formatação monoespaçada nos documentos Markdown (`.md`).
- **Sincronização**: Se a implementação mudar, atualize o diagrama ASCII no mesmo commit da alteração de código.
