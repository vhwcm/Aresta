# ADR-011: Arquitetura de Páginas Físicas Estritas e Eliminação de Scroll nos Livretos Didáticos com IA

## Status
Aceito (Accepted)

## Data
2026-09-13

## Contexto
O ecossistema Aresta simula a leitura de livros físicos através de virada de página realista 2D/3D (`PageCurlCanvas`). No entanto, os livretos didáticos gerados por IA apresentavam barra de rolagem vertical (`overflow-y: auto`), violando a metáfora de uma folha de livro delimitada e conflitando com gestos táteis e atalhos de navegação. Esse comportamento ocorria porque o prompt do backend não impunha orçamentos espaciais nem contratos rigorosos de diagramação, permitindo seções extensas que extrapolavam o viewport da folha.

## Decisão
Adotamos uma abordagem de blindagem em duas camadas (Backend IA + Frontend Reader):
1. **Contrato de Diagramação e Orçamento Rígido na IA (`ai.service.ts`)**:
   - A IA atua como diagramador editorial de livro impresso com proibição expressa de rolagem vertical (*ZERO SCROLL*).
   - Cada página é tipada com `data-layout` (`cover`, `foundation`, `mechanism`, `analogy`, `nuances`, `subtopics`, `flashcards`) e submetida a um teto rígido de palavras (~100 a 160 palavras por folha).
   - Componentes visuais possuem limites estritos (ex: máximo de 2 flashcards compactos na página de fixação; máximo de 3 passos no stepper).
2. **Blindagem e Layout no Frontend (`DidacticDocumentAdapter.ts` & `main.css`)**:
   - Aplicação universal de `overflow: hidden !important` em `.didactic-page-wrapper` e layout vertical com flexbox proporcional.
   - Proporções compactas e arejadas para callouts, flashcards 3D e steppers.
   - Particionamento inteligente preventivo (*Smart Page Reflow*): caso um bloco de texto ultrapasse o limite seguro de altura (~850-1100 caracteres sem quebras), o adapter subdivide o conteúdo em subpáginas lógicas contínuas em vez de estourar a altura da página.

## Alternativas Consideradas
1. **Permitir Scrollbar Oculta com Rolagem por Roda do Mouse**: Descartado porque quebra a semântica de virada de folha e gera desorientação quando parte do texto fica invisível fora da tela.
2. **Auto-scaling de Fonte Dinâmico por Página**: Descartado por gerar incoerência tipográfica grotesca (uma página com fonte 18px e a seguinte com fonte 11px).

## Consequências
- **Positivas**:
  - Experiência editorial idêntica à de um livro impresso de alta qualidade.
  - Fluidez imediata no folhear 2D/3D sem conflitos de rolagem.
  - Síntese pedagógica mais densa, direta e memorável.
  - Proteção contra quebra de layout mesmo com ampliação de fontes.
- **Negativas / Desafios**:
  - A IA precisa ser precisa em seu poder de concisão para cobrir tópicos complexos respeitando os limites de cada página.
