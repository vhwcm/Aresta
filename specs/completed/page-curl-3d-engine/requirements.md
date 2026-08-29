# Requisitos: Motor 3D Realista de Virada de Página (Kindle Grade)

## 1. Objetivo Geral
Substituir o modelo defeituoso de fatiamento CSS por um motor de renderização 3D WebGL (Three.js) com malha deformável contínua e física gestual realista, eliminando listras verticais, artefatos de emenda e sobrecarga de CPU/GPU, entregando uma sensação autêntica de toque e virada de página física a 60/120 FPS.

## 2. Escopo
- **Incluído**:
  - Malha 3D contínua subdividida em WebGL (sem fatias CSS ou emendas).
  - Shaders de deformação cônica (cantos) e cilíndrica (laterais).
  - Interação direta com o mouse e toque (arraste 1:1, inércia e amortecimento elástico via Hooke's Law).
  - Camada de repouso nativa com seleção de texto, anotações, grifos e dicionário intactos.
  - Sombras dinâmicas de contato (ambient occlusion) e iluminação especular suave de papel.
  - Suporte completo a PDF e EPUB em layouts de 1 página (mobile) e 2 páginas (desktop).
- **Não Incluído**:
  - Alterações no backend ou no banco de dados.

## 3. Requisitos Funcionais

### R1. Eliminação de Listras e Emendas Visuais
- **Descrição**: A renderização da página em 3D durante o folheio deve ser uma superfície contínua e uniforme, sem nenhuma emenda vertical, corte de subpixel ou fresta visível sob qualquer tema (Claro, Escuro, Sépia).
- **Atores**: Usuário Leitor.
- **Regra de Validação**: Nenhuma divisão em fatias DOM/CSS; a textura é projetada sobre um único plano de vértices WebGL contínuo.

### R2. Física de Toque e Manipulação Direta
- **Descrição**: O usuário pode segurar qualquer ponto da borda da página (canto superior, borda central ou canto inferior) e arrastar com o dedo ou mouse.
- **Atores**: Usuário Leitor.
- **Regra de Validação**:
  - Arrastar pelo canto produz curvatura cônica diagonal.
  - Arrastar pelo centro produz curvatura cilíndrica horizontal.
  - Soltar antes de 35% de progresso ativa mola elástica que retorna a página à posição inicial.
  - Soltar após 35% ou realizar flick rápido completa o giro com suavização natural.
  - Clique simples (tap) na margem executa a virada automática fluida.

### R3. Integração Híbrida Zero-Jitter com Seleção de Texto
- **Descrição**: Em estado estacionário (repouso), o leitor mantém a camada DOM e Canvas 2D nativos para permitir seleção de texto perfeita, ativação do menu de contexto/dicionário e anotações. No momento do toque/arrasto, a textura pré-renderizada é assumida pelo WebGL com 0ms de atraso e sem cintilação visual (*no flash*).
- **Atores**: Usuário Leitor.
- **Regra de Validação**: Grifos e seleções permanecem ativos no modo de repouso.

### R4. Performance e Otimização de Recursos
- **Descrição**: O motor 3D deve executar a 60 FPS mínimos (120 FPS em telas compatíveis), pausando o loop `requestAnimationFrame` quando não houver animação ou interação em andamento.
- **Atores**: Sistema.
- **Regra de Validação**: Desalocação correta de geometrias, materiais e texturas Three.js para evitar memory leaks.

## 4. Requisitos Não Funcionais
- **Performance**: Taxa de quadros estável (>= 60 FPS) e consumo mínimo de bateria em repouso.
- **Compatibilidade**: Desktop (Windows/Linux/macOS), Mobile (Android via Tauri) e Web/Navegadores modernos com WebGL 2.0 / WebGL 1.0 fallback.

## 5. Critérios de Aceite
- [ ] Listras verticais e artefatos de emenda eliminados em 100% dos testes visuais.
- [ ] Arrastar cantos e laterais com mouse/toque segue a posição física da mão em tempo real.
- [ ] Transição suave entre estado de repouso (texto selecionável) e estado 3D de virada.
- [ ] Suporte a temas Claro, Escuro e Sépia com iluminação e sombras integradas.
- [ ] Desalocação limpa de memória WebGL sem vazamentos ao trocar de livro ou redimensionar a janela.
