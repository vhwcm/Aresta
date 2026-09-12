# ADR-006: Catálogo Global de Temas e Grafo de Livros (Enriquecimento por IA Removido)

- **Status**: Aceito (Escopo de IA revisto e simplificado)
- **Data**: 2026-08-27 (Atualizado em 12/09/2026)
- **Autores**: Equipe Aresta

---

## 1. Contexto

Anteriormente, os temas no Aresta eram criados de maneira restrita e privada por usuário, sem hierarquia estruturada de subtemas. Além disso, o grafo de conhecimento exibia apenas nós circulares de temas abstratos sem representar os livros diretamente no grafo. Havia sido cogitado um pipeline de enriquecimento automatizado por IA para inferir temas e resumos na inserção de livros.

---

## 2. Decisão

1. **Catálogo Global de Temas**:
   - Migrar a entidade `Theme` para uma tabela global única e dinâmica, compartilhada entre todo o acervo.
   - Criar a tabela `ThemeHierarchy` para representar relacionamentos de subtemas de forma direcionada (ex: `Programação` ➔ `Ferramentas`).
   - A atribuição e vínculo de temas a livros é realizada de forma direta e manual pelo usuário ou curadoria na estante (`PUT /api/user-books/:id/themes`), garantindo controle, simplicidade e ausência de latência externa.

2. **Remoção do Pipeline de IA para Enriquecimento de Livros (AnalyzeBook / Enrich)**:
   - **Removido do escopo**: Foi cancelada a chamada gRPC `AnalyzeBook` / Gemini Google Search Grounding para busca web e classificação automática de temas por similaridade de cosseno.
   - Livros adicionados iniciam sem temas pré-atribuídos e não dependem de serviços de IA para estarem disponíveis imediatamente para leitura.
   - Endpoints de enriquecimento sob demanda (`/api/books/:id/enrich`) foram descontinuados/removidos do escopo.

3. **Grafo de Conhecimento com Livros e Canvas Overlay**:
   - Renderizar nós de livros (`type = 'book'`) exibindo a miniatura da capa e o título truncado em até 10 caracteres com `'...'`.
   - Implementar `ThemeCanvasOverlay` ao clicar em um tema (carrossel horizontal de livros no topo + feed de anotações do tema abaixo).
   - Implementar `BookAnnotationsDrawer` ao clicar em um livro (detalhes, anotações do livro e criação de anotações soltas com `cfi` opcional).
   - Validar que anotações só podem ser vinculadas a temas pertencentes àquele livro.

---

## 3. Consequências

- **Positivas**:
  - Catálogo de temas consistente e reutilizável por todos os usuários.
  - Adição de livros instantânea, determinística e sem dependência de APIs externas de busca ou IA.
  - Eliminação de complexidade desnecessária e microserviços externos para cadastro de livros.
  - Experiência visual rica com capas de livros renderizadas diretamente no SVG do D3.
