# Requisitos: Módulo de Quadro Infinito (Canvas) & Anotações Livres com IA (OCR)

## 1. Objetivo Geral
Expandir o Aresta para ser também uma plataforma de anotações visuais e pensamento não-linear, oferecendo um Quadro Infinito (*Infinite Whiteboard / Canvas*) no padrão aberto **JSON Canvas** (estilo Obsidian Canvas). O usuário poderá criar múltiplos quadros, inserir blocos de notas retangulares, formas geométricas com texto interno, textos livres, conectar elementos através de setas direcionadas com pontos de ancoragem rígidos nos 4 lados (`top`, `right`, `bottom`, `left`), e redigir anotações manuscritas diretamente na tela (com mouse ou caneta de tablet/touch) que são transcritas automaticamente em Markdown estruturado via IA multimodal (OCR) e posicionadas exatamente no local desenhado.

---

## 2. Escopo

- **Incluído**:
  - Persistência e gerenciamento de múltiplos Canvases no banco de dados SQLite/Prisma (`aresta-back-node`), seguindo a especificação aberta **JSON Canvas** (`.canvas`).
  - Viewport infinito no Frontend (Nuxt 3) com suporte fluido a Pan (arrasto com botão do meio, espaço ou gestos), Zoom infinito (com limites seguros 0.1x a 3.0x), e grade (*dot grid*) responsiva.
  - Criação rápida de cards de anotação com duplo clique / duplo toque na tela.
  - Suporte a múltiplos tipos de nós (*Nodes*):
    - `text`: Bloco retangular de anotação com suporte a Markdown formatado e Live Preview.
    - `shape`: Formas geométricas (retângulo, retângulo arredondado, elipse/círculo, losango, triângulo) com texto interno editável.
    - `loose_text`: Texto livre flutuante sem borda/fundo pesado.
    - `book`: Card vinculado a um livro da estante do usuário.
    - `highlight`: Card vinculado a uma citação/marcação do leitor.
  - Conexões direcionadas (*Edges*) estilo Obsidian:
    - 4 pontos de ancoragem visuais (`top`, `right`, `bottom`, `left`) ao passar o mouse ou selecionar um nó.
    - Arrastar a partir de uma âncora traça a seta e faz snap magnético no lado do nó alvo (`fromNode`, `fromSide`, `toNode`, `toSide`).
    - Suporte a rótulos de texto opcionais no meio da seta e controle de direção.
  - Camada de Escrita Manual (*Inking / Drawing layer*):
    - Modo caneta para desenhar ou escrever à mão livre em qualquer ponto do canvas.
    - Botão flutuante de confirmação (*"✨ Transcrever"*) posicionado junto à caixa delimitadora (*bounding box*) do traçado.
    - Captura da imagem recortada do traço e envio para o serviço OCR/Gemini Vision do backend, transcrevendo a caligrafia em Markdown e substituindo o traço por um card de texto no local exato.
  - Autosave debounced (500ms - 1s) para o backend e histórico completo de Undo/Redo (`Ctrl+Z` / `Ctrl+Shift+Z` ou botões da interface).
  - Exportação e importação de arquivos `.canvas` (formato JSON Canvas padrão Obsidian).

- **Não Incluído**:
  - Colaboração multi-usuário em tempo real via WebSockets / CRDT nesta fase inicial (foco em uso individual sincronizado com nuvem).
  - Reconhecimento de formas vetoriais automáticas (transformar rabisco em círculo perfeito) nesta fase.

---

## 3. Requisitos Funcionais

### R1. Gerenciamento de Canvases
- **Descrição**: O usuário deve poder listar, criar novos canvass, renomear, duplicar e excluir quadros infinitos a partir da página `/canvas`.
- **Regra**: Cada canvas pertence a um `userId` e armazena seu payload no padrão JSON Canvas (`nodes`, `edges`, `viewport`).

### R2. Viewport Infinito e Navegação Fluida
- **Descrição**: O canvas deve permitir navegação tridimensional no plano 2D:
  - Panning: Arrastar com botão do meio do mouse, arrastar segurando `Space`, ou arrasto com dois dedos no touch.
  - Zoom: Roda do mouse (*wheel*) focalizada no cursor, botões de zoom in/out/reset e gesto de pinch-to-zoom no mobile/tablet.
  - Grade de fundo infinita com pontos sutis sincronizados com o nível de escala e posição.

### R3. Criação e Manipulação de Nós
- **Descrição**: 
  - Duplo clique / duplo toque em área vazia cria imediatamente um bloco retangular de texto.
  - Barra de ferramentas flutuante (*Canvas Toolbar*) permite selecionar e adicionar: Bloco de Texto, Formas Geométricas (Retângulo, Círculo, Losango), Texto Solto e Caneta IA.
  - Cada nó pode ser movido livremente pelo canvas com snap opcional à grade, redimensionado através de *handles* nos cantos e lados, e excluído (`Delete` / `Backspace`).

### R4. Edição de Texto e Live Preview
- **Descrição**: Ao focar/dar duplo clique em um nó de texto ou forma geométrica, o editor inline entra em modo edição Markdown. Ao desfocar (blur) ou pressionar `Escape`, o conteúdo é renderizado com formatação rica (negrito, itálico, listas, checkboxes, títulos e tags).

### R5. Conexões Ancoradas nos 4 Lados (Obsidian Style)
- **Descrição**: Ao selecionar ou passar o mouse em um nó, 4 conectores (*anchors*) surgem nas bordas (`top`, `right`, `bottom`, `left`).
- **Regra**: Clicar e arrastar de uma âncora inicia uma linha guia com ponta de seta. Ao soltar sobre a âncora de outro nó, a conexão é registrada com `fromNode`, `fromSide`, `toNode`, `toSide`. É possível editar a cor da linha, estilo (curvo / ortogonal) e rótulo de texto da seta.

### R6. Escrita Manual e Transcrição com IA Multimodal
- **Descrição**: Ao ativar a ferramenta de Caneta, o usuário pode desenhar ou escrever livremente na tela.
- **Fluxo**: Ao soltar a caneta/mouse após desenhar, um botão flutuante com ícone de IA (*"✨ Transcrever"*) surge ao lado da área desenhada.
- **Processamento**: Ao clicar, o canvas extrai a imagem dos traços (com corte exato da *bounding box*), envia para `POST /api/ocr/transcribe` e insere um nó de texto no mesmo local e dimensão do traço transcrito. Se o usuário preferir descartar ou cancelar, pode clicar em descartar ou continuar escrevendo.

### R7. Integração com Livros e Citações
- **Descrição**: A barra lateral ou menu de inserção permite buscar livros da estante do usuário e anotações/citações existentes para adicioná-los como cards vinculados dentro do Canvas.

### R8. Autosave, Undo/Redo e Import/Export
- **Descrição**: 
  - Todas as modificações no canvas disparam um salvamento com debounce para o backend.
  - Pilha de ações com suporte a `Ctrl+Z` (Desfazer) e `Ctrl+Shift+Z` / `Ctrl+Y` (Refazer).
  - Opção de exportar o arquivo `.canvas` baixável e importar arquivos `.canvas` gerados pelo Obsidian.

---

## 4. Requisitos Não Funcionais

- **Performance**: Taxa de atualização a 60 FPS durante Pan e Zoom com dezenas de nós e conexões ativas.
- **Responsividade**: Compatibilidade completa com desktop (mouse e atalhos de teclado) e dispositivos móveis/tablets (touch e stylus).
- **Consistência de Dados**: Formato do documento 100% aderente ao JSON Canvas Spec v1.0.

---

## 5. Critérios de Aceite

- [ ] Usuário consegue criar, abrir, renomear e excluir múltiplos Canvases na rota `/canvas`.
- [ ] O viewport infinito responde com fluidez a pan, zoom e duplo clique para criar notas.
- [ ] Formas geométricas (retângulo, elipse, losango) e textos soltos podem ser inseridos, editados em Markdown e redimensionados.
- [ ] As setas conectam nós com precisão ancorando nos 4 lados (`top`, `right`, `bottom`, `left`) e mantêm as rotas ao mover os nós.
- [ ] A ferramenta de caneta captura a escrita manual e o botão "✨ Transcrever" gera o texto formatado via OCR/Gemini no local correto.
- [ ] Alterações são salvas automaticamente no banco de dados do backend Node.js via Prisma.
- [ ] Suporte a Undo/Redo e importação/exportação de arquivos `.canvas`.
