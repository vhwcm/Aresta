# Requisitos da Spec: Leitor 2D Nativo de Alta Performance e Nitidez

## Objetivo Geral
Substituir o motor de renderização do leitor de livros (baseado em Three.js/WebGL 3D) por um motor de renderização puramente 2D nativo (Canvas 2D + DOM TextLayer), eliminando perdas de nitidez causadas por texturização WebGL, reduzindo a pegada de memória e dependências (removendo `three`), e oferecendo suporte a transição 2D suave (slide), High-DPI nativo (`window.devicePixelRatio`), modo adaptativo de página única/dupla e seleção de texto desobstruída.

---

## Requisitos Funcionais

### R1. Renderização 2D Direta e Alta Nitidez (High-DPI)
- **R1.1**: Renderizar as páginas de PDF e EPUB diretamente em Canvas 2D utilizando `window.devicePixelRatio` para que a contagem de pixels físicos corresponda à resolução da tela (evitando blurriness).
- **R1.2**: Ajustar automaticamente a escala ao redimensionar a janela ou ao abrir/fechar o painel lateral do Grafo de Conhecimento.
- **R1.3**: Manter compatibilidade com os adaptadores de documento existentes (`PdfDocumentAdapter`, `EpubDocumentAdapter`).

### R2. Transição 2D Suave e Responsiva (Slide Horizontal)
- **R2.1**: Implementar transição horizontal (slide) entre a página atual e a próxima/anterior com aceleração suave e duração ágil (~200ms).
- **R2.2**: Suportar gestos de arrasto/swipe nas margens laterais externas da tela (desktop e mobile).
- **R2.3**: Respeitar a configuração de acessibilidade e preferência do usuário (`pageAnimationEnabled` / `reducedMotion`), executando troca instantânea quando a animação estiver desativada.

### R3. Modo Adaptativo de Exibição (Página Única vs Página Dupla)
- **R3.1**: Exibir 1 página centralizada no mobile ou quando o painel do grafo estiver aberto no desktop.
- **R3.2**: Suportar exibição de 2 páginas lado a lado no desktop em tela cheia com alternância manual via botão na barra inferior (`ReaderBottomBar`).
- **R3.3**: Sincronizar o avanço e retrocesso de páginas adequadamente (1 página em modo simples, 2 páginas em modo duplo).

### R4. Camada de Texto e Interações (TextLayer & Anotações)
- **R4.1**: Sobrepor a camada invisível de texto (`TextLayer`) perfeitamente alinhada às dimensões das páginas 2D.
- **R4.2**: Manter seleção de texto fluida e sem interferência com gestos de virada na área central.
- **R4.3**: Exibir o tooltip de seleção e abrir modal de anotação com o texto selecionado.
- **R4.4**: Suportar navegação por teclado (setas ← / →) e botões flutuantes (‹ / ›).

### R5. Limpeza de Dependências e Otimização do Bundle
- **R5.1**: Remover `three` e `@types/three` do `front/package.json`.
- **R5.2**: Eliminar todo código e shaders legados de WebGL 3D do leitor.

---

## Critérios de Aceite

- [ ] Motor 2D renderiza páginas de PDF e EPUB com 100% de nitidez sem Three.js/WebGL.
- [ ] Transições de página 2D (slide) ocorrem de forma fluida e instantânea quando desativadas.
- [ ] Alternância entre 1 página e 2 páginas funciona responsivamente e via botão na barra inferior.
- [ ] Seleção de texto, marcadores e criação de anotações funcionam perfeitamente na TextLayer.
- [ ] `three` e `@types/three` são removidos do `package.json` e todos os testes automatizados passam.
