# 🎨 Arquitetura do Quadro Infinito (Canvas) & Anotações com IA

O módulo de **Quadro Infinito & Anotações Livres com IA** transforma o Aresta em um ambiente de pensamento visual e não-linear no padrão aberto **JSON Canvas (v1.0)**, permitindo interoperabilidade com o Obsidian (`.canvas`).

---

## 1. Padrão de Dados (JSON Canvas Spec v1.0)

O documento do Canvas é armazenado na tabela `canvases` do SQLite (`aresta-back-node`) com a seguinte estrutura:

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "x": 100,
      "y": 150,
      "width": 260,
      "height": 180,
      "text": "## Minha Ideia\nTexto em Markdown...",
      "color": "#E57B55"
    },
    {
      "id": "node-2",
      "type": "shape",
      "shape": "diamond",
      "x": 450,
      "y": 150,
      "width": 180,
      "height": 120,
      "text": "Decisão Arquitetural",
      "color": "#3B82F6"
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "fromNode": "node-1",
      "fromSide": "right",
      "toNode": "node-2",
      "toSide": "left",
      "label": "origina",
      "color": "#E57B55",
      "toEnd": "arrow"
    }
  ],
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1.0
  }
}
```

---

## 2. Motor de Renderização Híbrido (DOM + SVG)

1. **Camada Viewport**: Gerenciada por CSS Transform `translate3d(x, y, 0) scale(zoom)` com suporte a Pan (mouse médio, espaço, drag) e Zoom centrado no cursor do usuário.
2. **Camada DOM (HTML/Vue)**: Renderiza cards retangulares de Markdown, formas geométricas vetoriais, texto solto e cards de livros da estante com inputs de texto nativos e Live Preview.
3. **Camada SVG (Arestas & Ancoragem)**:
   - 4 pontos de ancoragem rígidos (`top`, `right`, `bottom`, `left`) por nó.
   - Curvas de Bézier cúbicas ortogonais automáticas calculadas dinamicamente via `canvasGeometry.ts`.
   - Snap magnético ao soltar setas sobre outros nós.

---

## 3. Pipeline de Transcrição de Caligrafia via IA (Multimodal OCR)

1. **Inking Overlay**: Camada de captura de traços suaves (`useCanvasInking.ts`) ativada no modo Caneta (`activeTool === 'pen'`).
2. **Bounding Box Calculator**: Calcula os limites mínimos e máximos da caligrafia.
3. **Action Pill Flutuante**: Ao soltar a caneta, surge o botão flutuante `"✨ Transcrever com IA"`.
4. **Corte & Transcrição**: Rasteriza a caixa delimitadora com fundo branco sólido e traços escuros em PNG base64, chamando `POST /api/ocr/transcribe` (Gemini Vision 2.0 Flash) e inserindo o card Markdown nas exatas coordenadas do desenho.

---

## 4. Endpoints REST Backend (`/api/canvases`)

- `GET /api/canvases`: Lista os quadros do usuário.
- `POST /api/canvases`: Cria um novo quadro ou importa um `.canvas`.
- `GET /api/canvases/:id`: Obtém os dados completos do quadro.
- `PUT /api/canvases/:id`: Atualiza metadados e payload `data` (autosave debounced 750ms).
- `DELETE /api/canvases/:id`: Exclui um quadro.
- `POST /api/canvases/:id/duplicate`: Duplica um quadro existente.
