# ADR-006: Catálogo Global de Temas, Enriquecimento com IA e Grafo de Livros

- **Status**: Aceito
- **Data**: 2026-08-27
- **Autores**: Equipe Aresta

---

## 1. Contexto

Anteriormente, os temas no Aresta eram criados de maneira restrita e privada por usuário, sem hierarquia estruturada de subtemas e sem integração com enriquecimento automatizado por IA no momento do upload dos livros. Além disso, o grafo de conhecimento exibia apenas nós circulares de temas abstratos sem representar os livros diretamente no grafo.

---

## 2. Decisão

1. **Catálogo Global de Temas**:
   - Migrar a entidade `Theme` para uma tabela global única e dinâmica, compartilhada entre todo o acervo.
   - Criar a tabela `ThemeHierarchy` para representar relacionamentos de subtemas de forma direcionada (ex: `Programação` ➔ `Ferramentas`).
   - Adicionar coluna `embedding` (vetor JSON) para busca por similaridade semântica (cosseno).

2. **Microserviço Go & IA (AnalyzeBook)**:
   - Utilizar o serviço Go via gRPC (`AnalyzeBook`) com **Gemini 2.5 Flash** e **Google Search Grounding** para pesquisar informações da obra na web.
   - Gerar resumo público persistido em `BookPublicInfo`.
   - Utilizar embeddings semânticos para mapear temas existentes ou propor novos subtemas com parentesco hierárquico.

3. **Grafo de Conhecimento com Livros e Canvas Overlay**:
   - Renderizar nós de livros (`type = 'book'`) exibindo a miniatura da capa e o título truncado em até 10 caracteres com `'...'`.
   - Implementar `ThemeCanvasOverlay` ao clicar em um tema (carrossel horizontal de livros no topo + feed de anotações do tema abaixo).
   - Implementar `BookAnnotationsDrawer` ao clicar em um livro (detalhes, anotações do livro e criação de anotações soltas com `cfi` opcional).
   - Validar que anotações só podem ser vinculadas a temas pertencentes àquele livro.

---

## 3. Consequências

- **Positivas**:
  - Catálogo de temas consistente e reutilizável por todos os usuários.
  - Descoberta semântica rica de tópicos e subtemas no grafo.
  - Experiência visual rica com capas de livros renderizadas diretamente no SVG do D3.
- **Mitigações**:
  - Se a chamada externa do Gemini falhar durante o upload administrativo, o livro continua salvo no catálogo com dados básicos e permite reprocessamento via `/api/books/:id/enrich`.
