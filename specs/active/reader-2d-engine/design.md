# Design Técnico: Leitor 2D Nativo de Alta Performance e Nitidez

## 1. Visão Geral da Arquitetura
Substituição da camada Three.js/WebGL por renderização direta em Canvas 2D com suporte a High-DPI (`window.devicePixelRatio`) e camada de texto HTML para seleção e highlights.

## 2. Diagrama de Fluxo
Consulte: `diagrams/reader-2d-flow.txt`

## 3. Componentes Afetados
- `front/app/pages/reader/[id].vue`: Remoção de WebGL renderer; adição de viewport Canvas 2D nativo.
- `front/app/components/ReaderBottomBar.vue`: Botão de alternância de modo (1 página / 2 páginas).
- `front/app/adapters/`: Preservação de `IBookDocument` com suporte a `devicePixelRatio`.

## 4. Otimização de Dependências
- Remoção de `three` e `@types/three` do `package.json`.
