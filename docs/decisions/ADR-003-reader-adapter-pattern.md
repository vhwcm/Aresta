# ADR-003: Padrão Adapter para Leitor de Ebooks Multi-formato

## Status
Aceito (Accepted)

## Data
2026-08-25

## Contexto
O frontend precisa renderizar tanto arquivos **EPUB** (documentos reflowable baseados em HTML/CSS) quanto **PDF** (documentos de páginas fixas vetoriais). Acoplar a interface de usuário do Vue diretamente às APIs de bibliotecas terceiras distintas (`foliate-js` e `pdfjs-dist`) tornaria os componentes do leitor frágeis, difíceis de testar e propensos a vazamentos de memória.

## Decisão
Implementamos o padrão de projeto estrutural **Adapter** (`IBookDocument`, `BookDocumentFactory`, `EpubDocumentAdapter`, `PdfDocumentAdapter`). A página do leitor interage exclusivamente com a interface `IBookDocument`, tornando a troca de motores ou a adição de novos formatos (ex: MOBI, CBZ) completamente transparente para a UI.

## Alternativas Consideradas
1. **Componentes Separados de Leitor (`EpubReader.vue` e `PdfReader.vue`)**: Descartado por duplicar quase toda a lógica de UI, zoom, anotações, barra inferior e navegação de teclado.
2. **Uso de Web Viewers Embutidos (Iframe)**: Descartado pela perda de controle sobre seleção de texto, temas escuros/sépia personalizados e integração com anotações e mapa mental.

## Consequências
- **Positivas**:
  - UI 100% agnóstica ao formato de arquivo.
  - Facilidade de mock em testes unitários.
  - Ciclo de vida e liberação de memória encapsulados no método `destroy()`.
- **Negativas / Desafios**:
  - Necessidade de mapear paginação virtual em EPUBs que não possuem conceito intrínseco de páginas fixas.
