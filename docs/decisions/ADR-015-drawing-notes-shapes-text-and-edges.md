# ADR-015: Formas Geométricas, Texto Livre, Arestas Direcionadas e Seleção por Mouse nas Notas de Desenho

## Status
Aceito (Accepted)

## Data
2026-09-16

## Contexto
As notas de desenho (`.drawing` / `DrawingNote`) no Aresta foram inicialmente concebidas com foco em escrita manual e inking digital livre estilo caderno A4 (esferográfica, marca-texto e borracha). No entanto, fluxos de raciocínio visual, diagramação ativa e esquemas conceituais exigem elementos geométricos regulares (retângulos, círculos, triângulos, losangos, etc.), digitação de texto com tipografia limpa, conexões explícitas entre ideias através de arestas direcionadas (setas com curvas de Bézier e âncoras magnéticas) e uma ferramenta de mouse/cursor para selecionar, mover e redimensionar nós na página sem disparar traços de caneta.

## Decisão

1. **Extensão do Contrato de Dados da Nota de Desenho (`DrawingPage`)**:
   - Adicionada estrutura híbrida a cada página: traços manuais (`strokes: DrawingStroke[]`), nós vetoriais (`nodes: CanvasNode[]`) e arestas direcionadas (`edges: CanvasEdge[]`).
   - Coordenadas canônicas indexadas ao espaço físico da folha A4 (`794 x 1123`), garantindo alinhamento absoluto independente da escala visual da tela.

2. **Expansão de Ferramentas na Toolbar (`DrawingToolbar.vue`)**:
   - Inclusão do modo Seleção/Mouse (`select`), permitindo manipulação livre de nós e arestas sem inking acidental.
   - Menu flutuante de Formas Geométricas (`shape`) com suporte a 10 geometrias poligonais: Retângulo, Círculo, Triângulo, Losango, Trapézio, Paralelogramo, Hexágono, Cilindro, Estrela e Nuvem.
   - Ferramenta de Texto Livre (`text`) para criação ágil de caixas tipográficas editáveis na folha.

3. **Camada de Nós e Arestas Vetoriais sobre o Canvas 2D (`DrawingPageCanvas.vue`)**:
   - Integração da camada reativa SVG de arestas (`CanvasEdgeLayer.vue`) e componentes de nó (`CanvasNode.vue`), renderizados com `pointer-events: auto` sob o container de zoom/pan.
   - Manipulação de âncoras magnéticas (top, right, bottom, left) para interligar formas geométricas e notas textuais.
   - Exportação unificada para IA (`exportToDataUrl`): ao gerar imagens para síntese de IA ou download, os nós vetoriais e as arestas Bézier são desenhados diretamente no contexto 2D do `<canvas>`, mantendo fidelidade total no OCR/Gemini Vision.

4. **Gerenciamento de Estado Reativo no Composable (`useDrawing.ts`)**:
   - Ações atômicas: `addNodeToPage`, `updateNodeInPage`, `removeNodeFromPage`, `addEdgeToPage` e `removeEdgeFromPage`.
   - Atalhos de teclado ergonômicos integrados no atalho global (V para Seleção, S para Formas, T para Texto, P para Caneta, E para Borracha, Delete/Backspace para remoção).

## Consequências
- **Positivas**:
  - Transição perfeita de um caderno analógico puro para uma ferramenta híbrida completa de ideação, permitindo desenhar livremente com stylus e ao mesmo tempo estruturar diagramas técnicos com formas, textos e setas Bézier.
  - Compatibilidade com o mecanismo existente de síntese semântica por IA (`DrawingAiSynthesisModal`), já que as formas e conexões são rasterizadas no preview enviado ao modelo multimodal.
  - Quality Gates 100% verdes com cobertura completa de testes unitários.
