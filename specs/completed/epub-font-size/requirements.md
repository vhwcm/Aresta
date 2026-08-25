# Requisitos da Spec: Alteração Dinâmica de Tamanho de Fonte em EPUB

## Objetivo Geral
Permitir que o usuário ajuste o tamanho do texto (font-size) de livros em formato EPUB em tempo real durante a leitura, recalculando a paginação e a renderização sem perder a posição relativa de leitura, com controles na barra inferior (`ReaderBottomBar`), persistência local e no perfil do usuário.

---

## Requisitos Funcionais

### R1. Adaptador de Documento EPUB com Suporte a Font-Size
- **R1.1**: O `IBookDocument` deve estender suporte opcional a `fontSize?: number` e `setFontSize?(fontSize: number, currentPage?: number): number`.
- **R1.2**: O `EpubDocumentAdapter` deve permitir configurar e atualizar o tamanho da fonte (faixa de `12px` a `36px`, padrão `18px`).
- **R1.3**: Ao atualizar o tamanho da fonte com `setFontSize(newSize, currentPage)`, o adaptador deve limpar o cache de páginas renderizadas, recalcular a paginação virtual de cada seção XHTML com base no novo tamanho e mapear a nova página global proporcional à posição do usuário na seção atual.
- **R1.4**: A camada de texto (`renderTextLayer`) e o desenho no canvas (`_renderPageToCanvas`) devem utilizar dinamicamente a propriedade `_fontSize`.
- **R1.5**: O `PdfDocumentAdapter` deve tratar `setFontSize` como no-op seguro retornando a página atual.

### R2. Gerenciamento de Estado do Leitor & Preferências
- **R2.1**: A `readerStore` deve manter o estado reativo `fontSize: number` e fornecer ações `setFontSize(size)`, `increaseFontSize()`, `decreaseFontSize()` e `resetFontSize()`.
- **R2.2**: A `useSettings` deve incluir `epubFontSize: number` (padrão `18`), salvando no `localStorage` e sincronizando com o backend.
- **R2.3**: Ao carregar um livro EPUB, a `readerStore` deve inicializar o adaptador com a preferência de tamanho de fonte salva.
- **R2.4**: O composable `useBookPageTurn` deve observar alterações em `store.fontSize`, invalidar o cache de rasters (`rasterCache`) e disparar o redesenho imediato do canvas 2D.

### R3. Interface de Usuário e Controles
- **R3.1**: A barra inferior (`ReaderBottomBar`) deve exibir um botão de tipografia (`Aa`) quando o leitor estiver exibindo um EPUB (`store.documentType === 'epub'`).
- **R3.2**: Ao clicar no botão, deve abrir um popover com opções de:
  - Botão diminuir tamanho (`A-` / -2px)
  - Indicador numérico do tamanho atual (ex: `18 px`)
  - Botão aumentar tamanho (`A+` / +2px)
  - Botão de redefinir para o padrão (18px)
  - Botões de seleção rápida / presets (Pequeno: 14px, Médio: 18px, Grande: 22px, Muito Grande: 26px)
- **R3.3**: O modal de configurações gerais (`SettingsModal.vue`) deve oferecer controle de ajuste do tamanho de fonte padrão de EPUB.

---

## Critérios de Aceite
- [ ] Alterar o tamanho da fonte em um livro EPUB reflete instantaneamente no texto visual e na camada de seleção.
- [ ] A contagem total de páginas e o percentual de leitura são recalculados.
- [ ] A posição de leitura é preservada (o usuário não é jogado para a página 1 ao redimensionar).
- [ ] O tamanho da fonte é persistido e lembrado entre sessões de leitura.
- [ ] Todos os testes automatizados unitários e de integração passam com 100% de sucesso.
