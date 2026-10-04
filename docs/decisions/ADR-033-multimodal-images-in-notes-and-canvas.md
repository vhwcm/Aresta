# ADR-033: Suporte Multimodal a Imagens nas Notas (Markdown) e no Canvas (Nós de Imagem)

## Status
Aceito e Implementado

## Data
2026-10-03

## Contexto
O ecossistema do Aresta até então permitia edição rica de texto em Markdown (via Milkdown/ProseMirror), anotações paged drawing e diagramação em telas infinitas de Canvas (nós de texto, notas, cartões e conexões). No entanto, o fluxo de estudo ativo e síntese visual frequentemente depende de diagramas externos, capturas de tela de livros didáticos, gráficos e ilustrações conceituais.
Para atender a essa demanda sem comprometer a filosofia local-first, a performance e a integridade de dados do Aresta, era necessário viabilizar a inserção de imagens tanto nas notas quanto no canvas com os seguintes requisitos:
1. **Suporte a múltiplas fontes de inserção**: Upload de arquivo local (File Picker), arrastar e soltar (Drag and Drop do sistema operacional e de outras abas do navegador) e colagem direta da área de transferência (Clipboard Paste).
2. **Prevenção de sobrecarga de armazenamento (Base64 Bloat)**: Imagens de alta resolução (15MB+) coladas diretamente como Data URLs podem travar o ProseMirror e saturar o IndexedDB.
3. **Preservação de fidelidade vetorial**: SVGs devem ser preservados sem rasterização.
4. **Interação ergonômica no Canvas**: Nós de imagem com redimensionamento proporcional com bloqueio de proporção (aspect ratio lock), visualização expandida (Lightbox modal com tecla Escape) e exportação SVG pura sem corrupção de entidades XML.
5. **Prevenção de duplicação de eventos**: Isolamento estrito de propagação de eventos entre o editor ProseMirror/Milkdown e os contêineres pais (`NoteEditorPane`).

## Decisão

1. **Otimizador de Imagens do Lado do Cliente (`imageOptimizer.ts`)**:
   - Criação do utilitário `optimizeImageFile(file, options)`.
   - Arquivos SVG (`image/svg+xml`) são mantidos em formato vetorial original via `FileReader.readAsDataURL`, preservando nitidez infinita e tamanho diminuto.
   - Imagens raster (PNG, JPEG, WebP) que ultrapassem dimensões máximas (padrão 1920px) são redimensionadas proporcionalmente via `<canvas>` HTML5 offscreen com compressão JPEG/WebP ajustada (qualidade 0.85).
   - Suporte defensivo a ambientes SSR/headless com fallback automático para `FileReader.readAsDataURL`.

2. **Integração nas Notas (`MilkdownEditor.vue` & `NoteEditorPane.vue`)**:
   - **Isolamento de Eventos**: Implementado `e.stopPropagation()` e `e.preventDefault()` nos manipuladores de drop e paste do Milkdown, impedindo que eventos borbulhem para o contêiner `NoteEditorPane` e eliminando inserções duplicadas.
   - **Inserção via Toolbar**: Adicionado botão de imagem na barra unificada que abre diálogo próprio (`useArestaDialog`) com opções de upload local ou link de URL externa.
   - **Detecção de Drop da Web**: Suporte a arraste direto de abas externas via inspeção de `text/uri-list`, payload HTML (`<img src="...">`) e fallbacks em `text/plain`.

3. **Nós de Imagem no Canvas (`CanvasNodeImage.vue`, `CanvasBoard.vue`, `useCanvas.ts`)**:
   - Tipo de nó estendido em `canvas.ts`: tipo `'image'` contendo `imageUrl`, `alt`, `caption` e `aspectRatio`.
   - Componente dedicado `CanvasNodeImage.vue` com estados visuais elegantes (loading spinner, erro com botão de recarregar e botão de expandir).
   - Lightbox modal com visualização ampliada, fundo escurecido e fechamento acessível via clique fora, botão de fechar ou tecla `Escape` (com listener desacoplado e limpo ao desmontar).
   - Redimensionamento proporcional na barra de manuseio (`CanvasBoard.vue`): ao arrastar alças de canto (`se`, `sw`, `ne`, `nw`), a altura e largura são travadas na proporção intrínseca (`aspectRatio`), prevenindo distorções e barras de corte.

4. **Exportação SVG Confiável (`useCanvas.ts`)**:
   - Inclusão do nó `<image xlink:href="..." />` com declaração obrigatória do namespace `xmlns:xlink="http://www.w3.org/1999/xlink"`.
   - Função utilitária de escape de entidades XML (`escapeXmlAttr`) para garantir que URLs com parâmetros de busca (`&`, `<`, `>`, `"`, `'`) não corrompam o parser SVG de navegadores e editores vetoriais externos.

## Consequências

### Positivas
- Notas e Canvas passam a suportar imagens completas de ponta a ponta de forma coesa, fluida e integrada.
- Imagens pesadas são compactadas antes de persistir no IndexedDB e sincronizar via Local-First Sync Engine.
- Exportação vetorial SVG preserva fidelidade total sem quebrar XML.
- 100% de compatibilidade com os Quality Gates e suíte de testes unitários do monólito (154 suites e 1.017 testes verdes).

### Custos e Riscos
- Imagens em Base64 armazenadas dentro do banco local aumentam o tamanho relativo do banco se o usuário inserir milhares de imagens (mitigado pelo downscaling max 1920px).
- URLs de imagens remotas dependem da persistência do servidor de origem; caso saiam do ar, um estado elegante de erro com tentativa de recarregamento é exibido.
