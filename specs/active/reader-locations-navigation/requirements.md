# Requisitos: Navegação por Localizações, Salto de Página e Sumário (PDF/EPUB)

## 1. Objetivo Geral
Permitir rolar, saltar para qualquer página/localização e navegar entre capítulos (estilo Google Play Livros) em PDF e EPUB, com abertura em tempo O(1) em relação ao tamanho do livro. Hoje o EPUB processa e mede o layout de **todas** as seções antes da 1ª tela (`EpubDocumentAdapter.load`), e o salto no modo scroll sofre deslocamento de layout.

## 2. Escopo
- **Incluído**: modelo de localizações estáveis para EPUB (todos os modos); endereço canônico de posição; pipeline progressivo de abertura em blocos; virtualização por blocos no scroll EPUB; pipeline de render PDF com janela, cancelamento e prévia; paginado EPUB com telas preguiçosas; slider com marcas de capítulo, Sumário, chip "Voltar" e campo "Ir para"; persistência local de `readingPosition`; migração preguiçosa de anotações `page:N` de EPUB.
- **Não Incluído**: miniaturas de PDF; botões de capítulo anterior/próximo; busca textual no livro; alteração no Postgres (progresso é local-first, ADR-016).

## 3. Requisitos Funcionais

### R1. Localizações estáveis no EPUB
- **Descrição**: 1 localização = 1.024 caracteres de texto (`LOCATION_SIZE`, constante versionada). "Loc. X de Y" é exibido em todos os modos de EPUB. O valor não depende de fonte, tamanho ou dispositivo.
- **Regra**: a contagem de caracteres usa a mesma travessia de nós de texto (`TreeWalker`) usada para os offsets de anotação.

### R2. Endereço canônico de posição
- **Descrição**: EPUB → `epub:<sectionIndex>:<charOffset>`; PDF → `page:<N>`. Usado por progresso, anotações, páginas salvas e histórico.
- **Regra**: `page:N` em anotações de EPUB é legado. Ele é resolvido de forma preguiçosa pelo texto citado (fallback proporcional `N/totalAntigo`) e reescrito no formato novo.

### R3. Abertura progressiva do EPUB
- **Descrição**: na hora, somente OPF, TOC, a seção-alvo e uma vizinha. O total inicial de localizações (o "Y" no rótulo *"Loc. X de Y"* e no divisor do slider) é estimado instantaneamente no frame 1 a partir do tamanho descompactado em bytes dos arquivos XHTML listados na spine (obtido do diretório central do ZIP sem descompactar, com razão média de ~0,45 char/byte). A contagem exata roda em blocos de 10 seções no idle (background). O índice exato resultante fica em cache no IndexedDB por hash do livro (da 2ª abertura em diante, o total é exato e instantâneo desde o início).
- **Regra**: a descompressão do ZIP é preguiçosa por arquivo; imagens viram blob URL apenas quando a seção é montada.

### R4. Scroll EPUB virtualizado por blocos
- **Descrição**: cada seção é dividida em blocos de ~10 localizações, cortando apenas entre elementos de bloco de 1º nível. Placeholders têm altura estimada. Há compensação manual de âncora. No máximo 5 blocos ficam no DOM.

### R5. Pipeline PDF no scroll
- **Descrição**: dimensões por página obtidas em blocos de 10 no idle (com cache). Página-alvo e a seguinte são rasterizadas na abertura. Janela: ±1 em resolução total, ±2 no idle, teto de 6 canvases (LRU). `renderTask.cancel()` ao sair da janela. Prévia em escala 0,2 no scroll rápido ou salto distante. Camada de texto só depois do scroll parar.

### R6. Salto para posição
- **Descrição**: `goToPosition(pos)` funciona em scroll e paginado. EPUB: monta o bloco-alvo ±1 e rola até o `Range` do offset exato. PDF: rola até o slot com dimensão conhecida.

### R7. Paginado EPUB com telas preguiçosas
- **Descrição**: as colunas são calculadas só para a seção atual e as vizinhas. Avanço e retrocesso por tela atravessam as seções. O efeito visual 3D é preservado.

### R8. Navegação (UI)
- **Slider** com marcas de capítulo e balão de prévia (capítulo + Loc./Pág.). O salto acontece só ao soltar.
- **Gaveta de Sumário** aninhada, com o capítulo atual destacado e o % de cada capítulo. EPUB via TOC do foliate; PDF via `getOutline()`.
- **Chip "Voltar para Loc./Pág. X"** após qualquer salto (pilha de histórico).
- **Campo "Ir para"**: número da página (PDF) ou localização / % (EPUB).

### R9. Persistência local da posição
- **Descrição**: coluna `reading_position TEXT` em `books` (SQLite Tauri) e campo `readingPosition` no Dexie e em `types.ts`, propagados pelo `useSyncEngine`. `currentPage` continua preenchido (localização ou página) para Home e cards. A leitura prefere `readingPosition` e cai para `currentPage`.
- **Regra**: remover o `PATCH /api/user-books/:id` morto (a rota retorna 410).

## 4. Requisitos Não Funcionais (orçamentos — Android intermediário, EPUB 1 MB de texto / PDF 500 págs.)
- 1ª tela (cache hit): EPUB ≤ 300 ms, PDF ≤ 250 ms. Cache miss (sem contar o download): ≤ 500 ms.
- Salto: prévia ≤ 150 ms; PDF nítido ≤ 400 ms.
- Nenhuma long task > 50 ms causada pelo trabalho em background (`deadline.timeRemaining()`).
- ≤ 6 canvases PDF; ≤ 5 blocos EPUB no DOM; 0 px de deslocamento visível após o salto.
- Compatibilidade: Chrome, Firefox, Safari / WebView iOS, Android WebView (Tauri v2). Fallback de `requestIdleCallback` com `setTimeout`.

## 5. Critérios de Aceite
- [ ] `LocationIndex` converte posição ↔ localização de forma exata e estável (unit).
- [ ] `parsePosition`/`serializePosition` cobrem `epub:s:o`, `page:N` e entradas inválidas (unit).
- [ ] A estimativa converge para o exato e o total publicado é monotonicamente atualizado sem saltar a posição do leitor (unit).
- [ ] O scheduler de blocos respeita o deadline, é cancelável e reprioriza em torno do alvo (unit, timers falsos).
- [ ] O particionador nunca quebra elemento de bloco e cada bloco fica com ≤ ~1,5× o alvo (unit).
- [ ] A compensação de âncora mantém o 1º caractere visível fixo quando blocos acima mudam de altura (unit).
- [ ] O resolvedor legado acha o texto citado; sem citação, usa a proporção (unit).
- [ ] A LRU de canvases nunca passa de 6 e cancela renders fora da janela (unit com mocks de pdf.js).
- [ ] TOC normalizado (EPUB e outline do PDF) gera `TocEntry` com posição e localização (unit).
- [ ] A posição é persistida e restaurada via `readingPosition`, com fallback para `currentPage` (unit de repositório).
- [ ] Os orçamentos de §4 são medidos pelo `readerProfiler` no benchmark com fixtures (script).
- [ ] `npm test` e `npm run build` verdes em `apps/web`.
